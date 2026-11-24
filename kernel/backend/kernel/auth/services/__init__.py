"""Auth services and the errors they raise."""

from kernel.auth.errors import (
    AccountLockedError,
    AccountSuspendedError,
    DeviceWipedError,
    InvalidCredentialsError,
    InvalidTokenError,
    PasswordRecentlyUsedError,
    TemporaryPasswordExpiredError,
)
from kernel.auth.services.api_key_service import ApiKeyService
from kernel.auth.services.auth_service import AuthService, generate_secure_temp_password
from kernel.auth.services.email_service import (
    EmailService,
    InMemoryEmailService,
    SMTPEmailService,
    SentEmail,
    get_email_service,
)

__all__ = [
    "ApiKeyService",
    "AuthService",
    "EmailService",
    "InMemoryEmailService",
    "SMTPEmailService",
    "SentEmail",
    "get_email_service",
    "InvalidCredentialsError",
    "AccountLockedError",
    "AccountSuspendedError",
    "TemporaryPasswordExpiredError",
    "DeviceWipedError",
    "InvalidTokenError",
    "PasswordRecentlyUsedError",
    "generate_secure_temp_password",
]
