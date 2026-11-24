"""Auth endpoints: login, tokens, passwords, the current user and API keys."""

import uuid

from fastapi import APIRouter, Depends, Header, Path, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.audit.services import actor_fields, audit_request
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
    UserProfileResponse,
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
from kernel.core.http import client_ip
from kernel.core.schemas import error_responses
from kernel.core.services.errors import NotFoundError, UnauthorizedError
from kernel.user.models.user import User

TAG = "Authentication"
router = APIRouter(prefix="/auth", tags=[TAG])

ACCESS_COOKIE_MAX_AGE = 900
REFRESH_COOKIE_MAX_AGE = 7 * 86400
PUBLIC = {"security": []}
BEARER = {"security": [{"BearerAuth": []}]}


def get_auth_service() -> AuthService:
    return AuthService()


def get_api_key_service() -> ApiKeyService:
    return ApiKeyService()


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        "access_token", access_token, httponly=True, secure=False, samesite="lax", path="/", max_age=ACCESS_COOKIE_MAX_AGE
    )
    response.set_cookie(
        "refresh_token", refresh_token, httponly=True, secure=False, samesite="lax", path="/auth",
        max_age=REFRESH_COOKIE_MAX_AGE,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/auth")


# ---- login and refresh ------------------------------------------------


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate with email and password",
    operation_id="auth_login",
    openapi_extra=PUBLIC,
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
    """
    result = await auth_service.login(
        session, body, ip_address=client_ip(request), user_agent=request.headers.get("User-Agent")
    )

    actor = actor_fields(result.user)
    await audit_request(
        session, request, action="LOGIN", entity_type="user", entity_id=str(result.user.id),
        entity_name=actor["actor_name"], reason="User authenticated via password credentials", **actor,
    )
    await session.commit()

    _set_auth_cookies(response, result.access_token, result.refresh_token)
    return result


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token",
    operation_id="auth_refresh",
    openapi_extra=PUBLIC,
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
    """
    token = body.refresh_token or request.cookies.get("refresh_token")  # browsers send it as a cookie
    if not token:
        raise InvalidTokenError("Refresh token missing.")

    result = await auth_service.refresh_token(
        session,
        RefreshTokenRequest(refresh_token=token),
        ip_address=client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    await session.commit()

    _set_auth_cookies(response, result.access_token, result.refresh_token)
    return result


# ---- passwords ---------------------------------------------------------------


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    operation_id="auth_forgot_password",
    openapi_extra=PUBLIC,
)
async def forgot_password(
    body: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> ForgotPasswordResponse:
    """Dispatches password reset instructions with anti-enumeration protection.

    Public endpoint. Always returns a 200 confirmation notice regardless of
    whether the email is registered in the system.
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
    openapi_extra=PUBLIC,
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
    """
    result = await auth_service.reset_password_with_token(session, body)
    await session.commit()
    return result


@router.post(
    "/change-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Change user password",
    operation_id="auth_change_password",
    openapi_extra=BEARER,
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
    """
    result = await auth_service.change_password(session, current_user.id, body)

    actor = actor_fields(current_user)
    await audit_request(
        session, request, action="PASSWORD_RESET", entity_type="user", entity_id=str(current_user.id),
        entity_name=actor["actor_name"] or "User", tenant_id=getattr(current_user, "tenant_id", None),
        reason="User changed account password", **actor,
    )
    await session.commit()
    return result


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke session tokens",
    operation_id="auth_logout",
    openapi_extra=BEARER,
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
    """
    result = await auth_service.logout(session, current_user.id, body)

    actor = actor_fields(current_user)
    await audit_request(
        session, request, action="LOGOUT", entity_type="user", entity_id=str(current_user.id),
        entity_name=actor["actor_name"] or "User", tenant_id=getattr(current_user, "tenant_id", None),
        reason="User logged out of all active sessions" if body.logout_all else "User logged out of active session",
        **actor,
    )
    await session.commit()

    _clear_auth_cookies(response)
    return result


# ---- current user -------------------------------------------------------------


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    operation_id="auth_get_me",
    openapi_extra=BEARER,
    responses=error_responses(UnauthorizedError),
)
async def get_me(
    response: Response,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
    session: AsyncSession = Depends(get_db),
    x_tenant_id: uuid.UUID | None = Header(
        default=None,
        alias="X-Tenant-ID",
        description="Active tenant context override.",
    ),
    if_none_match: str | None = Header(
        default=None,
        alias="If-None-Match",
        description="ETag token version for conditional revalidation.",
    ),
) -> UserProfileResponse | Response:
    """Retrieves profile, tenancy context, and entitled business modules for the authenticated actor.

    Requires Bearer authentication. Decrypts PII fields (email, mobile) for
    the authorized user. Supports ETag conditional validation with 304 Not Modified.
    """
    # token_version changes on every password change or logout-all, which is when the profile can change.
    etag = f'"{current_user.token_version}"'
    if if_none_match and if_none_match.strip() == etag:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)

    profile = await auth_service.get_user_profile(session=session, user=current_user, tenant_id=x_tenant_id)
    response.headers["ETag"] = etag
    return profile


# ---- API keys -------------------------------------------------------------------


def _key_tenant(user: User) -> uuid.UUID:
    """Tenant the user's API keys belong to (falls back to the user id when there is no tenant)."""
    return getattr(user, "tenant_id", None) or user.id


@router.get(
    "/api-keys",
    response_model=ApiKeyListResponse,
    status_code=status.HTTP_200_OK,
    summary="List tenant API keys",
    operation_id="auth_list_api_keys",
    openapi_extra=BEARER,
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
    """
    keys = await api_key_service.list_api_keys(session, _key_tenant(current_user))
    return ApiKeyListResponse(items=[ApiKeyRead.model_validate(k) for k in keys])


@router.post(
    "/api-keys",
    response_model=ApiKeyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate API key",
    operation_id="auth_create_api_key",
    openapi_extra=BEARER,
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
    """
    tenant_id = _key_tenant(current_user)
    key, raw_key = await api_key_service.create_api_key(
        session=session,
        tenant_id=tenant_id,
        user_id=current_user.id,
        name=body.name,
        scopes=body.scopes,
        expires_in_days=body.expires_in_days,
    )

    await audit_request(
        session, request, action="CREATE", entity_type="api_key", entity_id=str(key.id), entity_name=key.name,
        changes={"name": {"old": None, "new": key.name}, "scopes": {"old": None, "new": key.scopes}},
        tenant_id=tenant_id, reason=f"Generated API key '{key.name}'", **actor_fields(current_user),
    )
    await session.commit()

    return ApiKeyCreatedResponse(**ApiKeyRead.model_validate(key).model_dump(), raw_key=raw_key)


@router.delete(
    "/api-keys/{key_id}",
    response_model=ApiKeyRead,
    status_code=status.HTTP_200_OK,
    summary="Revoke API key",
    operation_id="auth_revoke_api_key",
    openapi_extra=BEARER,
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
    """
    tenant_id = _key_tenant(current_user)
    revoked = await api_key_service.revoke_api_key(session, key_id, tenant_id)

    await audit_request(
        session, request, action="DELETE", entity_type="api_key", entity_id=str(key_id), entity_name=revoked.name,
        changes={"is_active": {"old": True, "new": False}},
        tenant_id=tenant_id, reason=f"Revoked API key '{revoked.name}'", **actor_fields(current_user),
    )
    await session.commit()

    return ApiKeyRead.model_validate(revoked)
