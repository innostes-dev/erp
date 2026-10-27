"""Authentication HTTP endpoints."""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.dependencies import get_current_user
from kernel.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
    TokenResponse,
)
from kernel.auth.services import (
    AccountLockedError,
    AccountSuspendedError,
    AuthService,
    DeviceWipedError,
    InvalidCredentialsError,
    InvalidTokenError,
    PasswordRecentlyUsedError,
    TemporaryPasswordExpiredError,
)
from kernel.core.database import get_db
from kernel.core.schemas import error_responses
from kernel.user.models.user import User
from kernel.user.schemas import UserRead
from kernel.user.services import UserService

TAG = "Authentication"
router = APIRouter(prefix="/auth", tags=[TAG])


def get_auth_service() -> AuthService:
    return AuthService()


def get_client_ip(request: Request) -> str | None:
    """Extract client IP from X-Forwarded-For or socket address."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate and issue tokens",
    description="Authenticates credentials, evaluates device trust, and issues short-lived JWT and single-use refresh token.",
    responses=error_responses(
        InvalidCredentialsError,
        AccountLockedError,
        AccountSuspendedError,
        TemporaryPasswordExpiredError,
        DeviceWipedError,
    ),
)
async def login(
    body: LoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent")
    result = await auth_service.login(session, body, ip_address=ip, user_agent=ua)
    await session.commit()
    return result


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token",
    description="Rotates a single-use refresh token, detecting reuse attempts, and returns fresh tokens.",
    responses=error_responses(InvalidTokenError, DeviceWipedError),
)
async def refresh_token(
    body: RefreshTokenRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> RefreshTokenResponse:
    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent")
    result = await auth_service.refresh_token(session, body, ip_address=ip, user_agent=ua)
    await session.commit()
    return result


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Request password reset & temporary password",
    description="Dispatches email containing temporary password and one-click reset link. Anti-enumeration protected.",
)
async def forgot_password(
    body: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> ForgotPasswordResponse:
    result = await auth_service.forgot_password(session, body)
    await session.commit()
    return result


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password with email link token",
    description="Consumes single-use signed reset token, checks SOC 2 password history, and sets new password.",
    responses=error_responses(InvalidTokenError, PasswordRecentlyUsedError),
)
async def reset_password(
    body: ResetPasswordRequest,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    result = await auth_service.reset_password_with_token(session, body)
    await session.commit()
    return result


@router.post(
    "/change-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Change password",
    description="Changes password for authenticated user (required on first login or after temporary password usage).",
    responses=error_responses(InvalidCredentialsError, PasswordRecentlyUsedError),
)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    result = await auth_service.change_password(session, current_user.id, body)
    await session.commit()
    return result


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke session tokens",
    description="Revokes current session refresh token or all active sessions across all devices.",
)
async def logout(
    body: LogoutRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    result = await auth_service.logout(session, current_user.id, body)
    await session.commit()
    return result


@router.get(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Current authenticated user profile",
    description="Returns the profile and identity details of the authenticated actor.",
)
async def get_me(
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(lambda: UserService()),
) -> UserRead:
    return user_service.to_user_read(current_user)
