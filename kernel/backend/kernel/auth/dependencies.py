"""FastAPI dependencies for user authentication and authorization."""

from collections.abc import Callable
import uuid

from fastapi import Depends, Header, Request
from fastapi.params import Depends as DependsParam
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.services import AccountSuspendedError, ApiKeyService, InvalidTokenError
from kernel.core.database import get_db
from kernel.core.security.jwt import decode_token
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
