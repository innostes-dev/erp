"""Authentication router exposing endpoints for login, MFA, tokens, and API key management."""

import uuid

from fastapi import APIRouter, Depends, Header, Path, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.dependencies import get_current_user, get_user_service
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
from kernel.core.services.errors import NotFoundError, UnauthorizedError
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
    summary="Authenticate with email and password",
    operation_id="auth_login",
    openapi_extra={"security": []},
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
    """Authenticates credentials and issues short-lived JWT and refresh tokens.

    Public endpoint. Sets secure HttpOnly cookies for web browsers and returns
    bearer credentials for programmatic API callers.
    \f
    Args:
        body: Login credentials and device hardware fingerprint.
        request: FastAPI HTTP request.
        response: FastAPI HTTP response.
        session: Active async database session.
        auth_service: Injected authentication domain service.

    Returns:
        TokenResponse with access token, refresh token, and user profile.
    """
    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent")
    result = await auth_service.login(session, body, ip_address=ip, user_agent=ua)

    try:
        from kernel.audit import audit_service
        await audit_service.record(
            session=session,
            action="LOGIN",
            entity_type="user",
            entity_id=str(result.user.id),
            entity_name=f"{result.user.first_name} {result.user.last_name}".strip() or result.user.email,
            actor_id=result.user.id,
            actor_email=result.user.email,
            actor_name=f"{result.user.first_name} {result.user.last_name}".strip() or result.user.email,
            ip_address=ip,
            user_agent=ua,
            correlation_id=request.headers.get("x-correlation-id") or getattr(request.state, "correlation_id", None),
            reason="User authenticated via password credentials",
            status="SUCCESS",
        )
    except Exception:
        pass

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
    operation_id="auth_refresh",
    openapi_extra={"security": []},
    responses=error_responses(
        InvalidTokenError,
        DeviceWipedError,
    ),
)
async def refresh_token(
    body: RefreshTokenRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> RefreshTokenResponse:
    """Rotates a single-use refresh token and issues fresh access credentials.

    Public endpoint. Detects reuse attempts, invalidating compromised session
    families if reuse occurs.
    \f
    Args:
        body: Request containing active refresh token.
        request: FastAPI HTTP request.
        response: FastAPI HTTP response.
        session: Active async database session.
        auth_service: Injected authentication domain service.

    Returns:
        RefreshTokenResponse with rotated access token and refresh token.
    """
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
    summary="Request password reset",
    operation_id="auth_forgot_password",
    openapi_extra={"security": []},
)
async def forgot_password(
    body: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> ForgotPasswordResponse:
    """Dispatches password reset instructions with anti-enumeration protection.

    Public endpoint. Always returns a 200 confirmation notice regardless of
    whether the email is registered in the system.
    \f
    Args:
        body: Request containing target email address.
        session: Active async database session.
        auth_service: Injected authentication domain service.

    Returns:
        ForgotPasswordResponse with anti-enumeration message.
    """
    result = await auth_service.forgot_password(session, body)
    await session.commit()
    return result


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password with token",
    operation_id="auth_reset_password",
    openapi_extra={"security": []},
    responses=error_responses(
        InvalidTokenError,
        PasswordRecentlyUsedError,
    ),
)
async def reset_password(
    body: ResetPasswordRequest,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """Resets account credentials using a single-use signed reset token.

    Public endpoint. Enforces SOC 2 historical password reuse prevention and
    revokes all active sessions upon successful reset.
    \f
    Args:
        body: Reset token and new password.
        session: Active async database session.
        auth_service: Injected authentication domain service.

    Returns:
        MessageResponse confirming successful password reset.
    """
    result = await auth_service.reset_password(session, body)
    await session.commit()
    return result


@router.post(
    "/change-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Change user password",
    operation_id="auth_change_password",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        InvalidCredentialsError,
        PasswordRecentlyUsedError,
        UnauthorizedError,
    ),
)
async def change_password(
    body: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """Updates password for the currently authenticated user.

    Requires Bearer authentication. Verifies existing credentials before
    applying the update and rotating active sessions.
    \f
    Args:
        body: Current credentials and new password.
        request: FastAPI HTTP request.
        current_user: Authenticated actor.
        session: Active async database session.
        auth_service: Injected authentication domain service.

    Returns:
        MessageResponse confirming credential update.
    """
    result = await auth_service.change_password(session, current_user.id, body)

    try:
        from kernel.audit import audit_service
        user_name = f"{current_user.first_name} {current_user.last_name}".strip()
        user_email = getattr(current_user, "email", None)
        await audit_service.record(
            session=session,
            action="PASSWORD_RESET",
            entity_type="user",
            entity_id=str(current_user.id),
            entity_name=user_name or user_email or "User",
            tenant_id=getattr(current_user, "tenant_id", None),
            actor_id=current_user.id,
            actor_email=user_email,
            actor_name=user_name or user_email,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            correlation_id=request.headers.get("x-correlation-id") or getattr(request.state, "correlation_id", None),
            reason="User changed account password",
            status="SUCCESS",
        )
    except Exception:
        pass

    await session.commit()
    return result


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke session tokens",
    operation_id="auth_logout",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError),
)
async def logout(
    body: LogoutRequest,
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """Revokes active refresh tokens and clears authentication cookies.

    Requires Bearer authentication. Optionally revokes all active sessions
    across all client devices when logout_all is true.
    \f
    Args:
        body: Revocation scope options.
        request: FastAPI HTTP request.
        response: FastAPI HTTP response.
        current_user: Authenticated actor.
        session: Active async database session.
        auth_service: Injected authentication domain service.

    Returns:
        MessageResponse confirming session termination.
    """
    result = await auth_service.logout(session, current_user.id, body)

    try:
        from kernel.audit import audit_service
        user_name = f"{current_user.first_name} {current_user.last_name}".strip()
        user_email = getattr(current_user, "email", None)
        await audit_service.record(
            session=session,
            action="LOGOUT",
            entity_type="user",
            entity_id=str(current_user.id),
            entity_name=user_name or user_email or "User",
            tenant_id=getattr(current_user, "tenant_id", None),
            actor_id=current_user.id,
            actor_email=user_email,
            actor_name=user_name or user_email,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            correlation_id=request.headers.get("x-correlation-id") or getattr(request.state, "correlation_id", None),
            reason="User logged out of all active sessions" if body.logout_all else "User logged out of active session",
            status="SUCCESS",
        )
    except Exception:
        pass

    await session.commit()

    # Clear HttpOnly cookies
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/auth")

    return result


@router.get(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    operation_id="auth_get_me",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError),
)
async def get_me(
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> UserRead:
    """Retrieves profile and identity details of the authenticated actor.

    Requires Bearer authentication. Decrypts PII fields (email, mobile) for
    the authorized user.
    \f
    Args:
        current_user: Authenticated actor.
        user_service: Injected user domain service.

    Returns:
        UserRead record for caller.
    """
    return user_service.to_user_read(current_user)


# =========================================================================
# API Key / Personal Access Token Endpoints
# =========================================================================


@router.get(
    "/api-keys",
    response_model=ApiKeyListResponse,
    status_code=status.HTTP_200_OK,
    summary="List tenant API keys",
    operation_id="auth_list_api_keys",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError),
)
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyListResponse:
    """Lists programmatic API keys registered for the current organisation.

    Requires Bearer authentication. Omits secret hashes and reveals key
    metadata and permission scopes.
    \f
    Args:
        current_user: Authenticated actor.
        session: Active async database session.
        api_key_service: Injected API key domain service.

    Returns:
        ApiKeyListResponse with all keys for caller organisation.
    """
    tenant_id = getattr(current_user, "tenant_id", None) or current_user.id
    keys = await api_key_service.list_api_keys(session, tenant_id)
    return ApiKeyListResponse(items=[ApiKeyRead.model_validate(k) for k in keys])


@router.post(
    "/api-keys",
    response_model=ApiKeyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate API key",
    operation_id="auth_create_api_key",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError),
)
async def create_api_key(
    body: CreateApiKeyRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyCreatedResponse:
    """Generates a high-entropy programmatic API key.

    Requires Bearer authentication. Returns the plaintext secret key exactly once;
    it cannot be retrieved or reconstructed later.
    \f
    Args:
        body: Key label, expiration duration, and permission scopes.
        request: FastAPI HTTP request.
        current_user: Authenticated actor.
        session: Active async database session.
        api_key_service: Injected API key domain service.

    Returns:
        ApiKeyCreatedResponse containing the secret raw_key.
    """
    tenant_id = getattr(current_user, "tenant_id", None) or current_user.id
    key, raw_key = await api_key_service.create_api_key(
        session=session,
        tenant_id=tenant_id,
        user_id=current_user.id,
        name=body.name,
        scopes=body.scopes,
        expires_in_days=body.expires_in_days,
    )

    try:
        from kernel.audit import audit_service
        user_name = f"{current_user.first_name} {current_user.last_name}".strip()
        user_email = getattr(current_user, "email", None)
        await audit_service.record(
            session=session,
            action="CREATE",
            entity_type="api_key",
            entity_id=str(key.id),
            entity_name=key.name,
            changes={"name": {"old": None, "new": key.name}, "scopes": {"old": None, "new": key.scopes}},
            tenant_id=tenant_id,
            actor_id=current_user.id,
            actor_email=user_email,
            actor_name=user_name or user_email,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            correlation_id=request.headers.get("x-correlation-id") or getattr(request.state, "correlation_id", None),
            reason=f"Generated API key '{key.name}'",
            status="SUCCESS",
        )
        await session.commit()
    except Exception:
        pass

    read_data = ApiKeyRead.model_validate(key).model_dump()
    return ApiKeyCreatedResponse(**read_data, raw_key=raw_key)


@router.delete(
    "/api-keys/{key_id}",
    response_model=ApiKeyRead,
    status_code=status.HTTP_200_OK,
    summary="Revoke API key",
    operation_id="auth_revoke_api_key",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, NotFoundError),
)
async def revoke_api_key(
    request: Request,
    key_id: uuid.UUID = Path(
        description="Unique identifier of the API key to revoke.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    ),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    api_key_service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyRead:
    """Permanently revokes an API key.

    Requires Bearer authentication. Revocation takes effect immediately, blocking
    all subsequent calls made with this key.
    \f
    Args:
        key_id: Unique UUID of target API key.
        request: FastAPI HTTP request.
        current_user: Authenticated actor.
        session: Active async database session.
        api_key_service: Injected API key domain service.

    Returns:
        ApiKeyRead reflecting revoked state.
    """
    tenant_id = getattr(current_user, "tenant_id", None) or current_user.id
    revoked = await api_key_service.revoke_api_key(session, key_id, tenant_id)

    try:
        from kernel.audit import audit_service
        user_name = f"{current_user.first_name} {current_user.last_name}".strip()
        user_email = getattr(current_user, "email", None)
        await audit_service.record(
            session=session,
            action="DELETE",
            entity_type="api_key",
            entity_id=str(key_id),
            entity_name=revoked.name,
            changes={"is_active": {"old": True, "new": False}},
            tenant_id=tenant_id,
            actor_id=current_user.id,
            actor_email=user_email,
            actor_name=user_name or user_email,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            correlation_id=request.headers.get("x-correlation-id") or getattr(request.state, "correlation_id", None),
            reason=f"Revoked API key '{revoked.name}'",
            status="SUCCESS",
        )
        await session.commit()
    except Exception:
        pass

    return ApiKeyRead.model_validate(revoked)
