"""User and Tenant Context Dependency for In-App Control Plane & External API Key Access."""

import uuid
from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.dependencies import get_current_user as kernel_get_current_user
from kernel.core.database import get_db
from kernel.user.models.user import User, UserStatus
from tracura.models.api_key import ApiLogApiKey
from tracura.services.api_key_service import ApiKeyService

_bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="Bearer token or API Key (inno_log_live_... or inno_live_...)",
)


def get_api_key_service() -> ApiKeyService:
    return ApiKeyService()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    x_api_key: str | None = Header(
        default=None,
        alias="X-API-Key",
        description="Scoped Ingestion / Management API Key (inno_log_live_...)",
    ),
    session: AsyncSession = Depends(get_db),
    key_service: ApiKeyService = Depends(get_api_key_service),
) -> User:
    """Validate JWT token, Kernel API key (inno_live_...), or API Logger key (inno_log_live_...).

    Enables all API Logger management & query endpoints to be accessed via API Key:
    - X-API-Key: inno_log_live_...
    - Authorization: Bearer inno_log_live_...
    - Authorization: Bearer inno_live_...
    - Authorization: Bearer <jwt>
    - Cookie: access_token=<jwt>
    """
    raw_key: str | None = None
    if x_api_key:
        raw_key = x_api_key
    elif credentials and credentials.credentials and credentials.credentials.startswith("inno_log_live_"):
        raw_key = credentials.credentials

    # 1. API Logger Ingestion / Management Key (inno_log_live_...)
    if raw_key:
        api_key = await key_service.verify_key(session, raw_key)
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid, revoked, or expired API Key.",
            )

        # Resolve client IP
        forwarded = request.headers.get("x-forwarded-for")
        client_ip = (
            forwarded.split(",")[0].strip()
            if forwarded
            else (request.client.host if request.client else None)
        )

        # Validate IP allowlist if defined
        if not key_service.validate_ip(api_key, client_ip):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Client IP '{client_ip}' is not permitted by API key IP allowlist.",
            )

        # Attach tenant_id and key to request state
        request.state.tenant_id = api_key.tenant_id
        request.state.api_key = api_key

        # Resolve User or return synthetic User for service calls
        if api_key.created_by:
            user = await session.get(User, api_key.created_by)
            if user:
                return user

        # Construct synthetic User instance
        actor_id = api_key.created_by or api_key.id
        return User(
            id=actor_id,
            first_name=api_key.name,
            last_name="Service",
            email_hash=f"hash_{api_key.key_prefix}",
            email_encrypted=f"enc_{api_key.key_prefix}",
            password_hash="service_auth_token",
            status=UserStatus.ACTIVE,
            is_super_admin=True,
        )

    # 2. Kernel Auth (JWT access token or inno_live_... personal access token)
    override_user = request.app.dependency_overrides.get(kernel_get_current_user)
    if override_user:
        import asyncio
        res = override_user()
        if asyncio.iscoroutine(res):
            return await res
        return res

    try:
        user = await kernel_get_current_user(
            request=request,
            credentials=credentials,
            session=session,
        )
        return user
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc) if hasattr(exc, "detail") else "Authentication token or API key required.",
        )


async def get_active_tenant_id(
    request: Request,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    x_tenant_id: uuid.UUID | None = Header(
        default=None,
        alias="X-Tenant-ID",
        description="Active tenant context UUID",
    ),
) -> uuid.UUID:
    """Resolve current active tenant UUID from API key, header, or user membership."""
    # 1. State set by API key (ApiLogApiKey or kernel ApiKey)
    state_tid = getattr(request.state, "tenant_id", None)
    if state_tid:
        return state_tid

    # 2. Header explicit override
    if x_tenant_id:
        return x_tenant_id

    # 3. Check app dependency override (e.g. in test suites)
    try:
        from kernel.tenancy.router import get_current_tenant_id
        override_tid = request.app.dependency_overrides.get(get_current_tenant_id)
        if override_tid:
            import asyncio
            res = override_tid()
            if asyncio.iscoroutine(res):
                return await res
            return res
    except Exception:
        pass

    # 4. Query tenant membership for authenticated user
    try:
        from kernel.tenancy.models import Tenant, TenantMember, TenantMemberStatus

        stmt = (
            select(TenantMember.tenant_id)
            .where(
                TenantMember.user_id == user.id,
                TenantMember.status == TenantMemberStatus.ACTIVE,
            )
            .limit(1)
        )
        tid = (await session.execute(stmt)).scalar_one_or_none()
        if tid:
            return tid

        stmt_tenant = select(Tenant.id).where(Tenant.deleted_at.is_(None)).limit(1)
        tid = (await session.execute(stmt_tenant)).scalar_one_or_none()
        if tid:
            return tid
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Active tenant context required. Please provide X-Tenant-ID header.",
    )
