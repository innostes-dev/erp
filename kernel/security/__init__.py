"""Security Package for Innostes ERP Kernel."""

from kernel.security.dependencies import (
    bearer_scheme,
    get_current_subject,
    get_current_token_payload_model,
    get_token_payload,
    require_token_type,
)
from kernel.security.exceptions import (
    InvalidTokenError,
    SecurityError,
    TokenError,
    TokenExpiredError,
    TokenTypeMismatchError,
)
from kernel.security.jwt import (
    create_access_token,
    create_refresh_token,
    create_token,
    create_token_pair,
    decode_token,
    parse_token_payload,
    verify_token,
)
from kernel.security.password import hash_password, verify_password
from kernel.security.schemas import TokenPair, TokenPayload, TokenType
from kernel.security.security_settings import SecuritySettings

__all__ = [
    # Password
    "hash_password",
    "verify_password",
    # JWT
    "create_token",
    "create_access_token",
    "create_refresh_token",
    "create_token_pair",
    "decode_token",
    "verify_token",
    "parse_token_payload",
    # Schemas & Settings
    "TokenType",
    "TokenPair",
    "TokenPayload",
    "SecuritySettings",
    # Exceptions
    "SecurityError",
    "TokenError",
    "TokenExpiredError",
    "InvalidTokenError",
    "TokenTypeMismatchError",
    # Dependencies
    "bearer_scheme",
    "get_token_payload",
    "get_current_subject",
    "get_current_token_payload_model",
    "require_token_type",
]
