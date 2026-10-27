"""Enterprise Authentication & Session Management Module."""

from kernel.auth.dependencies import (
    get_current_user,
    require_permission,
    require_super_admin,
)
from kernel.auth.router import TAG, router
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
    EmailService,
    InMemoryEmailService,
    InvalidCredentialsError,
    InvalidTokenError,
    PasswordRecentlyUsedError,
    SMTPEmailService,
    SentEmail,
    TemporaryPasswordExpiredError,
    generate_secure_temp_password,
    get_email_service,
)
from kernel.core.module import BaseModule


class AuthModule(BaseModule):
    """Plugs authentication, login, refresh rotation, and forgot-password recovery into the API server."""

    name = "auth"
    version = "0.1.0"
    description = "Enterprise Authentication, Sessions, and Password Recovery"
    router = router
    openapi_tags = [
        {
            "name": TAG,
            "description": "User login, refresh token rotation, anti-enumeration forgot-password, and credential updates.",
        }
    ]


module = AuthModule()

__all__ = [
    "AuthModule",
    "module",
    "AuthService",
    "EmailService",
    "InMemoryEmailService",
    "SMTPEmailService",
    "SentEmail",
    "get_email_service",
    "get_current_user",
    "require_permission",
    "require_super_admin",
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "RefreshTokenResponse",
    "ForgotPasswordRequest",
    "ForgotPasswordResponse",
    "ResetPasswordRequest",
    "ChangePasswordRequest",
    "LogoutRequest",
    "MessageResponse",
    "InvalidCredentialsError",
    "AccountLockedError",
    "AccountSuspendedError",
    "TemporaryPasswordExpiredError",
    "DeviceWipedError",
    "InvalidTokenError",
    "PasswordRecentlyUsedError",
    "generate_secure_temp_password",
]
