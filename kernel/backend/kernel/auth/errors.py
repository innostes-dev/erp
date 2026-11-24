"""Errors raised by the auth service."""

from kernel.core.services import ConflictError, ErrorCode, ForbiddenError, UnauthorizedError


class InvalidCredentialsError(UnauthorizedError):
    code = ErrorCode.INVALID_CREDENTIALS

    def __init__(self, message: str = "Invalid email or password") -> None:
        super().__init__(message)


class AccountLockedError(UnauthorizedError):
    code = ErrorCode.ACCOUNT_LOCKED

    def __init__(self, retry_after: int = 900) -> None:
        super().__init__(
            "Account is temporarily locked due to too many failed login attempts. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )


class AccountSuspendedError(ForbiddenError):
    code = ErrorCode.ACCOUNT_SUSPENDED

    def __init__(self) -> None:
        super().__init__("Account has been suspended or deactivated. Contact your administrator.")


class TemporaryPasswordExpiredError(UnauthorizedError):
    code = ErrorCode.TEMPORARY_PASSWORD_EXPIRED

    def __init__(self) -> None:
        super().__init__("Temporary password has expired. Please request a new password reset.")


class DeviceWipedError(ForbiddenError):
    code = ErrorCode.DEVICE_WIPED

    def __init__(self) -> None:
        super().__init__("This device has been remotely wiped. Access is blocked.")


class InvalidTokenError(UnauthorizedError):
    code = ErrorCode.INVALID_TOKEN

    def __init__(self, message: str = "Invalid or expired token") -> None:
        super().__init__(message)


class PasswordRecentlyUsedError(ConflictError):
    code = ErrorCode.PASSWORD_RECENTLY_USED

    def __init__(self) -> None:
        super().__init__("Cannot reuse a recently used password. Please choose a different password.")
