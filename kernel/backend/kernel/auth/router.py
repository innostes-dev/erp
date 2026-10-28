"""Authentication router exposing endpoints for login, MFA, tokens, and API key management."""

import uuid

from fastapi import APIRouter, Depends, Header, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.dependencies import get_current_user
from kernel.auth.schemas import (
    ApiKeyCreatedResponse,
    ApiKeyListResponse,
    ApiKeyRead,
    ChangePasswordRequest,
    CreateApiKeyRequest,
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
    ApiKeyService,
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


def get_api_key_service() -> ApiKeyService:
    return ApiKeyService()


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
    description="Authenticates credentials, evaluates device trust, issues JWT/refresh tokens, and sets secure HttpOnly cookies.",
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
    response: Response,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent")
    result = await auth_service.login(session, body, ip_address=ip, user_agent=ua)
    await session.commit()

    # Set secure HttpOnly cookies for web browsers (XSS & CSRF protection)
    response.set_cookie(
        key="access_token",
        value=result.access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=900,
    )
    response.set_cookie(
        key="refresh_token",
        value=result.refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/auth",
        max_age=7 * 86400,
    )

    return result


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token",
    description="Rotates a single-use refresh token, detecting reuse attempts, and returns fresh tokens & updated cookies.",
    responses=error_responses(InvalidTokenError, DeviceWipedError),
)
async def refresh_token(
    body: RefreshTokenRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> RefreshTokenResponse:
    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent")

    # Fall back to cookie if request body is blank
    token_str = body.refresh_token or request.cookies.get("refresh_token") or ""
    if not token_str:
        raise InvalidTokenError("Refresh token missing.")

    effective_body = RefreshTokenRequest(refresh_token=token_str)
    result = await auth_service.refresh_token(session, effective_body, ip_address=ip, user_agent=ua)
    await session.commit()

    response.set_cookie(
        key="access_token",
        value=result.access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=900,
    )
    response.set_cookie(
        key="refresh_token",
        value=result.refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/auth",
        max_age=7 * 86400,
    )

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
    summary="Reset password via single-use token",
    description="Consumes single-use reset token and assigns new password with SOC 2 historical reuse prevention.",
    responses=error_responses(InvalidTokenError, PasswordRecentlyUsedError),
)
async def reset_password(
    body: ResetPasswordRequest,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    result = await auth_service.reset_password(session, body)
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
    description="Revokes current session refresh token or all active sessions across all devices, and clears cookies.",
)
async def logout(
    body: LogoutRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    result = await auth_service.logout(session, current_user.id, body)
    await session.commit()

    # Clear HttpOnly cookies
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/auth")

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


# =========================================================================
# API Key / Personal Access Token Endpoints
# =========================================================================


@router.get(
    "/api-keys",
    response_model=ApiKeyListResponse,
    status_code=status.HTTP_200_OK,
    summary="List tenant API keys",
    description="Lists all personal access tokens and programmatic API keys for the current organization.",
)
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyListResponse:
    tenant_id = getattr(current_user, "tenant_id", None) or current_user.id
    keys = await api_key_service.list_api_keys(session, tenant_id)
    return ApiKeyListResponse(items=[ApiKeyRead.model_validate(k) for k in keys])


@router.post(
    "/api-keys",
    response_model=ApiKeyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate API key",
    description="Generates a cryptographically secure, high-entropy API key. Raw secret is returned once and cannot be retrieved again.",
)
async def create_api_key(
    body: CreateApiKeyRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyCreatedResponse:
    tenant_id = getattr(current_user, "tenant_id", None) or current_user.id
    key, raw_key = await api_key_service.create_api_key(
        session=session,
        tenant_id=tenant_id,
        user_id=current_user.id,
        name=body.name,
        scopes=body.scopes,
        expires_in_days=body.expires_in_days,
    )
    read_data = ApiKeyRead.model_validate(key).model_dump()
    return ApiKeyCreatedResponse(**read_data, raw_key=raw_key)


@router.delete(
    "/api-keys/{key_id}",
    response_model=ApiKeyRead,
    status_code=status.HTTP_200_OK,
    summary="Revoke API key",
    description="Immediately and permanently revokes an API key, preventing any future programmatic access.",
)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyRead:
    tenant_id = getattr(current_user, "tenant_id", None) or current_user.id
    revoked = await api_key_service.revoke_api_key(session, key_id, tenant_id)
    return ApiKeyRead.model_validate(revoked)
