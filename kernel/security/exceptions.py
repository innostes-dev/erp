"""Security Exceptions for Innostes ERP Kernel."""


class SecurityError(Exception):
    """Base exception for all kernel security errors."""
    pass


class TokenError(SecurityError):
    """Base exception for token operations."""
    pass


class TokenExpiredError(TokenError):
    """Raised when a JWT has expired."""
    pass


class InvalidTokenError(TokenError):
    """Raised when a JWT is malformed, has an invalid signature, or fails validation."""
    pass


class TokenTypeMismatchError(InvalidTokenError):
    """Raised when a token's type ('access' or 'refresh') does not match the expected type."""
    pass
