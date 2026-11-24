"""FastAPI dependencies: who is calling, and are they allowed to."""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any
import uuid

from fastapi import Depends, Request
from fastapi.params import Depends as DependsParam
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.services import AccountSuspendedError, ApiKeyService, InvalidTokenError
from kernel.core.database import get_db
from kernel.core.security.jwt import decode_token
from kernel.core.services import BadRequestError, ForbiddenError
from kernel.tenancy.models import TenantMember, TenantMemberStatus, TenantModule
from kernel.user.models.rbac import UserRole
from kernel.user.models.user import User, UserStatus
from kernel.user.services import RBACService, UserService

API_KEY_PREFIX = "inno_live_"
ADMIN_ROLE_CODES = ("owner", "admin", "super_admin")
NO_TENANT = uuid.UUID("00000000-0000-0000-0000-000000000000")

_bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="JWT Bearer access token or personal access token (inno_live_...). Obtain an access token via POST /auth/login (30-minute lifespan, refreshed via POST /auth/refresh). Send in the HTTP Authorization header as 'Bearer <token>'.",
)


def get_user_service() -> UserService:
    return UserService()


def get_api_key_service() -> ApiKeyService:
    return ApiKeyService()


def get_rbac_service() -> RBACService:
    return RBACService()


# ---- authentication ----------------------------------------------------------


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
) -> User:
    """The active user behind the bearer token, `access_token` cookie or API key."""
    # Some routers call this function directly, so the Depends defaults may arrive unresolved.
    if isinstance(user_service, DependsParam):
        user_service = get_user_service()
    if isinstance(api_key_service, DependsParam):
        api_key_service = get_api_key_service()

    token = credentials.credentials if credentials and credentials.credentials else request.cookies.get("access_token")
    if not token:
        raise InvalidTokenError("Authentication token or API key required.")

    if token.startswith(API_KEY_PREFIX):
        return await _user_from_api_key(request, session, token, user_service, api_key_service)
    return await _user_from_jwt(session, token, user_service)


async def _user_from_api_key(
    request: Request,
    session: AsyncSession,
    raw_key: str,
    user_service: UserService,
    api_key_service: ApiKeyService,
) -> User:
    api_key = await api_key_service.verify_api_key(session, raw_key)
    if not api_key:
        raise InvalidTokenError("Invalid, expired, or revoked API key.")

    user = await user_service.get_by_id(session, api_key.user_id)
    _ensure_active(user)

    # Later checks (scopes, tenant) read these.
    request.state.api_key = api_key
    request.state.tenant_id = api_key.tenant_id
    return user


async def _user_from_jwt(session: AsyncSession, token: str, user_service: UserService) -> User:
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise InvalidTokenError("Access token has expired.")
    except jwt.PyJWTError:
        raise InvalidTokenError("Invalid access token.")

    if payload.get("type") != "access":
        raise InvalidTokenError("Invalid token type: expected access token.")
    if not payload.get("sub"):
        raise InvalidTokenError("Token subject is missing.")
    try:
        user_id = uuid.UUID(str(payload["sub"]))
    except ValueError:
        raise InvalidTokenError("Invalid token subject format.")

    user = await user_service.get_by_id(session, user_id)
    _ensure_active(user)

    # Password changes and logout-all bump token_version, which retires older tokens.
    token_version = payload.get("token_version")
    if token_version is not None and user.token_version != token_version:
        raise InvalidTokenError("Token version invalidated. Please log in again.")
    return user


def _ensure_active(user: User | None) -> None:
    if not user or user.status != UserStatus.ACTIVE or user.is_blocked:
        raise AccountSuspendedError()


async def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_super_admin:
        raise ForbiddenError("Super administrator privilege required.")
    return current_user


# ---- authorization ---------------------------------------------------------------


def require_permission(permission_code: str, tenant_header_name: str = "X-Tenant-ID") -> Callable:
    """Dependency: the user (or API key) must hold `permission_code`."""

    async def check(
        request: Request,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db),
        rbac_service: RBACService = Depends(get_rbac_service),
    ) -> User:
        api_key = getattr(request.state, "api_key", None)
        if api_key:
            scopes = api_key.scopes or []
            if "*" not in scopes and permission_code not in scopes:
                raise ForbiddenError(f"API key does not have required scope '{permission_code}'.")
            return current_user

        tenant_id = _uuid_header(request, tenant_header_name)
        if not await rbac_service.has_permission(
            session=session, user_id=current_user.id, permission_code=permission_code, tenant_id=tenant_id
        ):
            raise ForbiddenError(f"Permission '{permission_code}' required.")
        return current_user

    return check


def require_module(module_code: str, tenant_header_name: str = "X-Tenant-ID") -> Callable:
    """Dependency: the tenant has the module switched on and the user is entitled to it."""

    async def check(
        request: Request,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db),
        rbac_service: RBACService = Depends(get_rbac_service),
    ) -> User:
        api_key = getattr(request.state, "api_key", None)
        if api_key:
            scopes = api_key.scopes or []
            if "*" not in scopes and module_code not in scopes and f"{module_code}:*" not in scopes:
                raise ForbiddenError(f"API key does not have scope for module '{module_code}'.")
            return current_user

        if current_user.is_super_admin:
            return current_user

        tenant_id = await _resolve_tenant(request, session, current_user, tenant_header_name)
        if not tenant_id:
            raise BadRequestError("Active tenant context required. Please provide X-Tenant-ID header.")
        request.state.tenant_id = tenant_id
        await _ensure_module_active(session, tenant_id, module_code)

        roles = await rbac_service.get_user_roles(session, current_user.id, tenant_id)
        if any(r.code in ADMIN_ROLE_CODES for r in roles):
            return current_user

        grants = set(await rbac_service.get_user_module_grants(session, current_user.id, tenant_id))
        if module_code in grants or module_code in {r.module_code for r in roles if r.module_code}:
            return current_user
        raise ForbiddenError(f"User is not entitled to access module '{module_code}'.")

    return check


@dataclass
class SecurityContext:
    """Who is acting, in which tenant, and how much data they may see (`scope`)."""

    user: User
    tenant_id: uuid.UUID
    module: str
    permission: str
    scope: str  # 'ORGANIZATION' | 'DEPARTMENT' | 'TEAM' | 'OWN'
    user_department_id: uuid.UUID | None = None

    def apply_scope(self, query: Any, owner_col: Any = None, department_col: Any = None) -> Any:
        """Narrow a SELECT to the rows this scope may see."""
        if self.scope == "ORGANIZATION":
            return query
        if self.scope == "DEPARTMENT" and department_col is not None and self.user_department_id:
            return query.where(department_col == self.user_department_id)
        if self.scope in ("OWN", "TEAM", "DEPARTMENT") and owner_col is not None:
            return query.where(owner_col == self.user.id)
        return query


def require_security_context(
    permission_code: str,
    module_code: str | None = None,
    tenant_header_name: str = "X-Tenant-ID",
) -> Callable:
    """Dependency: module switched on + permission held; returns a SecurityContext with the data scope."""
    module = module_code or permission_code.split(":")[0]

    async def check(
        request: Request,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db),
        rbac_service: RBACService = Depends(get_rbac_service),
    ) -> SecurityContext:
        tenant_id = await _resolve_tenant(request, session, current_user, tenant_header_name)

        if current_user.is_super_admin:
            return SecurityContext(
                user=current_user, tenant_id=tenant_id or NO_TENANT, module=module,
                permission=permission_code, scope="ORGANIZATION",
            )
        if not tenant_id:
            raise BadRequestError("Active tenant context required. Please provide X-Tenant-ID header.")

        await _ensure_module_active(session, tenant_id, module)
        if not await rbac_service.has_permission(
            session=session, user_id=current_user.id, permission_code=permission_code, tenant_id=tenant_id
        ):
            raise ForbiddenError(f"Permission '{permission_code}' required.")

        roles = await rbac_service.get_user_roles(session, current_user.id, tenant_id)
        if any(r.code in ADMIN_ROLE_CODES for r in roles):
            scope, department_id = "ORGANIZATION", None
        else:
            permissions = await rbac_service.get_user_permissions(session, current_user.id, tenant_id)
            scope = next((p.get("scope", "OWN") for p in permissions if p["code"] == permission_code), "OWN")
            department_id = await _user_department(session, current_user.id, tenant_id)

        return SecurityContext(
            user=current_user, tenant_id=tenant_id, module=module, permission=permission_code,
            scope=scope, user_department_id=department_id,
        )

    return check


# ---- helpers -------------------------------------------------------------------------


def _uuid_header(request: Request, name: str) -> uuid.UUID | None:
    """The header as a UUID, or None when it is missing or malformed."""
    value = request.headers.get(name)
    try:
        return uuid.UUID(value) if value else None
    except ValueError:
        return None


async def _resolve_tenant(
    request: Request, session: AsyncSession, user: User, header_name: str
) -> uuid.UUID | None:
    """Tenant for this request: set by an API key, else the tenant header, else the user's first membership."""
    tenant_id = getattr(request.state, "tenant_id", None) or _uuid_header(request, header_name)
    if tenant_id:
        return tenant_id
    stmt = (
        select(TenantMember.tenant_id)
        .where(TenantMember.user_id == user.id, TenantMember.status == TenantMemberStatus.ACTIVE)
        .limit(1)
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def _ensure_module_active(session: AsyncSession, tenant_id: uuid.UUID, module: str) -> None:
    stmt = select(TenantModule.id).where(
        TenantModule.tenant_id == tenant_id,
        TenantModule.module_id == module,
        TenantModule.is_active.is_(True),
        TenantModule.deleted_at.is_(None),
    )
    if not (await session.execute(stmt)).scalar_one_or_none():
        raise ForbiddenError(f"Module '{module}' is not activated for this tenant.")


async def _user_department(session: AsyncSession, user_id: uuid.UUID, tenant_id: uuid.UUID) -> uuid.UUID | None:
    stmt = (
        select(UserRole.department_id)
        .where(UserRole.user_id == user_id, UserRole.tenant_id == tenant_id, UserRole.department_id.is_not(None))
        .limit(1)
    )
    return (await session.execute(stmt)).scalar_one_or_none()
