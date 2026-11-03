"""FastAPI dependencies for user authentication and authorization."""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any
import uuid

from fastapi import Depends, Header, Request
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

_bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="JWT Bearer access token or personal access token (inno_live_...). Obtain an access token via POST /auth/login (30-minute lifespan, refreshed via POST /auth/refresh). Send in the HTTP Authorization header as 'Bearer <token>'.",
)


def get_user_service() -> UserService:
    return UserService()


def get_api_key_service() -> ApiKeyService:
    return ApiKeyService()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
) -> User:
    """Validate JWT access token, HttpOnly cookie, or API key and return active User instance."""
    if isinstance(user_service, DependsParam):
        user_service = get_user_service()
    if isinstance(api_key_service, DependsParam):
        api_key_service = get_api_key_service()

    raw_token: str | None = None

    if credentials and credentials.credentials:
        raw_token = credentials.credentials
    elif "access_token" in request.cookies:
        raw_token = request.cookies.get("access_token")

    if not raw_token:
        raise InvalidTokenError("Authentication token or API key required.")

    # 1. API Key Authentication (inno_live_...)
    if raw_token.startswith("inno_live_"):
        api_key = await api_key_service.verify_api_key(session, raw_token)
        if not api_key:
            raise InvalidTokenError("Invalid, expired, or revoked API key.")

        user = await user_service.get_by_id(session, api_key.user_id)
        if not user or user.status != UserStatus.ACTIVE or user.is_blocked:
            raise AccountSuspendedError()

        # Attach api_key and tenant_id to request state for downstream checks
        request.state.api_key = api_key
        request.state.tenant_id = api_key.tenant_id
        return user

    # 2. JWT Access Token Authentication
    try:
        payload = decode_token(raw_token)
    except jwt.ExpiredSignatureError:
        raise InvalidTokenError("Access token has expired.")
    except jwt.PyJWTError:
        raise InvalidTokenError("Invalid access token.")

    if payload.get("type") != "access":
        raise InvalidTokenError("Invalid token type: expected access token.")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise InvalidTokenError("Token subject is missing.")

    try:
        user_id = uuid.UUID(str(user_id_str))
    except ValueError:
        raise InvalidTokenError("Invalid token subject format.")

    user = await user_service.get_by_id(session, user_id)
    if not user or user.status != UserStatus.ACTIVE or user.is_blocked:
        raise AccountSuspendedError()

    # Invalidation Check: token version must match (invalidates on password reset or logout-all)
    token_version = payload.get("token_version")
    if token_version is not None and user.token_version != token_version:
        raise InvalidTokenError("Token version invalidated. Please log in again.")

    return user


async def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Enforce that current actor holds platform-wide super administrator status."""
    if not current_user.is_super_admin:
        from kernel.core.services import ForbiddenError
        raise ForbiddenError("Super administrator privilege required.")
    return current_user


def require_permission(
    permission_code: str,
    tenant_header_name: str = "X-Tenant-ID",
) -> Callable:
    """Factory creating a FastAPI dependency that verifies an atomic RBAC permission."""

    async def _dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db),
        rbac_service: RBACService = Depends(lambda: RBACService()),
    ) -> User:
        # If authenticated via API Key, verify scope grants access
        api_key = getattr(request.state, "api_key", None)
        if api_key:
            scopes = api_key.scopes or []
            if "*" not in scopes and permission_code not in scopes:
                from kernel.core.services import ForbiddenError
                raise ForbiddenError(f"API key does not have required scope '{permission_code}'.")
            return current_user

        tenant_id_header = request.headers.get(tenant_header_name)
        tenant_id: uuid.UUID | None = None
        if tenant_id_header:
            try:
                tenant_id = uuid.UUID(tenant_id_header)
            except ValueError:
                pass

        has_perm = await rbac_service.has_permission(
            session=session,
            user_id=current_user.id,
            permission_code=permission_code,
            tenant_id=tenant_id,
        )
        if not has_perm:
            from kernel.core.services import ForbiddenError
            raise ForbiddenError(f"Permission '{permission_code}' required.")
        return current_user

    return _dependency


@dataclass
class SecurityContext:
    """Encapsulates the actor, tenant, module, atomic permission, and effective data scope."""

    user: User
    tenant_id: uuid.UUID
    module: str
    permission: str
    scope: str  # 'ORGANIZATION' | 'DEPARTMENT' | 'TEAM' | 'OWN'
    user_department_id: uuid.UUID | None = None

    def apply_scope(
        self,
        query: Any,
        owner_col: Any = None,
        department_col: Any = None,
    ) -> Any:
        """Apply tenant and RBAC data-scoping filter to a SQLAlchemy Select statement.

        - ORGANIZATION: Unrestricted across active tenant.
        - DEPARTMENT: Scoped to records in the user's department.
        - TEAM / OWN: Scoped to records owned/assigned to the user.
        """
        if self.scope == "ORGANIZATION":
            return query
        if self.scope == "DEPARTMENT" and department_col is not None and self.user_department_id:
            return query.where(department_col == self.user_department_id)
        if self.scope in ("OWN", "TEAM", "DEPARTMENT") and owner_col is not None:
            return query.where(owner_col == self.user.id)
        return query


def require_module(
    module_code: str,
    tenant_header_name: str = "X-Tenant-ID",
) -> Callable:
    """Factory creating a FastAPI router-level dependency enforcing that the tenant has
    activated the business module AND the authenticated actor has an active entitlement for it.

    Tiers evaluated:
    - Tier 1: Tenant Activation Gate (TenantModule active in tenant).
    - Tier 2: User Entitlement Gate (is_super_admin, tenant admin, or UserModuleGrant / module-tagged Role).
    """

    async def _dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db),
        rbac_service: RBACService = Depends(lambda: RBACService()),
    ) -> User:
        # API Key bypass / scope check
        api_key = getattr(request.state, "api_key", None)
        if api_key:
            scopes = api_key.scopes or []
            if "*" not in scopes and module_code not in scopes and f"{module_code}:*" not in scopes:
                raise ForbiddenError(f"API key does not have scope for module '{module_code}'.")
            return current_user

        # Super admin platform bypass
        if current_user.is_super_admin:
            return current_user

        # 1. Resolve active tenant
        tenant_id: uuid.UUID | None = None
        state_tid = getattr(request.state, "tenant_id", None)
        if state_tid:
            tenant_id = state_tid
        else:
            hdr = request.headers.get(tenant_header_name)
            if hdr:
                try:
                    tenant_id = uuid.UUID(hdr)
                except ValueError:
                    pass

        if not tenant_id:
            # Query user's default active tenant membership
            stmt = (
                select(TenantMember.tenant_id)
                .where(
                    TenantMember.user_id == current_user.id,
                    TenantMember.status == TenantMemberStatus.ACTIVE,
                )
                .limit(1)
            )
            tenant_id = (await session.execute(stmt)).scalar_one_or_none()

        if not tenant_id:
            raise BadRequestError("Active tenant context required. Please provide X-Tenant-ID header.")

        # Attach tenant_id to request state for downstream dependencies
        request.state.tenant_id = tenant_id

        # 2. Tier 1: Tenant Licensing Check
        tm_stmt = (
            select(TenantModule.id)
            .where(
                TenantModule.tenant_id == tenant_id,
                TenantModule.module_id == module_code,
                TenantModule.is_active.is_(True),
                TenantModule.deleted_at.is_(None),
            )
        )
        tm_exists = (await session.execute(tm_stmt)).scalar_one_or_none()
        if not tm_exists:
            raise ForbiddenError(f"Module '{module_code}' is not activated for this tenant.")

        # 3. Tier 2: User Entitlement Check
        user_roles = await rbac_service.get_user_roles(session, current_user.id, tenant_id)
        is_owner_or_admin = any(r.code in ("owner", "admin", "super_admin") for r in user_roles)
        if is_owner_or_admin:
            return current_user

        explicit_grants = set(await rbac_service.get_user_module_grants(session, current_user.id, tenant_id))
        role_modules = {r.module_code for r in user_roles if r.module_code}
        if module_code in explicit_grants or module_code in role_modules:
            return current_user

        raise ForbiddenError(f"User is not entitled to access module '{module_code}'.")

    return _dependency


def require_security_context(
    permission_code: str,
    module_code: str | None = None,
    tenant_header_name: str = "X-Tenant-ID",
) -> Callable:
    """Factory creating a FastAPI dependency that verifies module entitlement AND atomic RBAC
    permission, returning an active SecurityContext with resolved data scoping for queries."""

    mod_code = module_code or permission_code.split(":")[0]

    async def _dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db),
        rbac_service: RBACService = Depends(lambda: RBACService()),
    ) -> SecurityContext:
        # Resolve active tenant
        tenant_id: uuid.UUID | None = getattr(request.state, "tenant_id", None)
        if not tenant_id:
            hdr = request.headers.get(tenant_header_name)
            if hdr:
                try:
                    tenant_id = uuid.UUID(hdr)
                except ValueError:
                    pass

        if not tenant_id:
            stmt = (
                select(TenantMember.tenant_id)
                .where(
                    TenantMember.user_id == current_user.id,
                    TenantMember.status == TenantMemberStatus.ACTIVE,
                )
                .limit(1)
            )
            tenant_id = (await session.execute(stmt)).scalar_one_or_none()

        if not tenant_id and not current_user.is_super_admin:
            raise BadRequestError("Active tenant context required. Please provide X-Tenant-ID header.")

        # Super admin platform bypass
        if current_user.is_super_admin:
            return SecurityContext(
                user=current_user,
                tenant_id=tenant_id or uuid.UUID("00000000-0000-0000-0000-000000000000"),
                module=mod_code,
                permission=permission_code,
                scope="ORGANIZATION",
                user_department_id=None,
            )

        # 1. Tier 1: Check Tenant Module Activation
        tm_stmt = (
            select(TenantModule.id)
            .where(
                TenantModule.tenant_id == tenant_id,
                TenantModule.module_id == mod_code,
                TenantModule.is_active.is_(True),
                TenantModule.deleted_at.is_(None),
            )
        )
        tm_exists = (await session.execute(tm_stmt)).scalar_one_or_none()
        if not tm_exists:
            raise ForbiddenError(f"Module '{mod_code}' is not activated for this tenant.")

        # 2. Check Atomic Permission
        has_perm = await rbac_service.has_permission(
            session=session,
            user_id=current_user.id,
            permission_code=permission_code,
            tenant_id=tenant_id,
        )
        if not has_perm:
            raise ForbiddenError(f"Permission '{permission_code}' required.")

        # 3. Resolve effective scope & user's department
        user_roles = await rbac_service.get_user_roles(session, current_user.id, tenant_id)
        is_owner_or_admin = any(r.code in ("owner", "admin", "super_admin") for r in user_roles)

        effective_scope = "ORGANIZATION" if is_owner_or_admin else "OWN"
        user_dept_id: uuid.UUID | None = None

        if not is_owner_or_admin:
            user_perms = await rbac_service.get_user_permissions(session, current_user.id, tenant_id)
            for p in user_perms:
                if p["code"] == permission_code:
                    effective_scope = p.get("scope", "OWN")
                    break

            # Find department from UserRole
            ur_stmt = (
                select(UserRole.department_id)
                .where(
                    UserRole.user_id == current_user.id,
                    UserRole.tenant_id == tenant_id,
                    UserRole.department_id.is_not(None),
                )
                .limit(1)
            )
            user_dept_id = (await session.execute(ur_stmt)).scalar_one_or_none()

        return SecurityContext(
            user=current_user,
            tenant_id=tenant_id,
            module=mod_code,
            permission=permission_code,
            scope=effective_scope,
            user_department_id=user_dept_id,
        )

    return _dependency
