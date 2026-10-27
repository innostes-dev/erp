"""FastAPI dependencies for user authentication and authorization."""

from collections.abc import Callable
import uuid

from fastapi import Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.services import AccountSuspendedError, InvalidTokenError
from kernel.core.database import get_db
from kernel.core.security.jwt import decode_token
from kernel.user.models.user import User, UserStatus
from kernel.user.services import RBACService, UserService

_bearer_scheme = HTTPBearer(
    auto_error=True,
    scheme_name="BearerAuth",
    description="JWT Bearer access token issued by POST /auth/login.",
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db),
    user_service: UserService = Depends(lambda: UserService()),
) -> User:
    """Validate JWT access token and return active User instance."""
    raw_token = credentials.credentials
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
