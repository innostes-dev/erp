"""Innostes ERP Kernel: Core Infrastructure and Modular Foundation."""

from kernel.config import (
    PostgresSettings,
    SecuritySettings,
    Settings,
    get_settings,
)
from kernel.database import (
    POSTGRES_NAMING_CONVENTION,
    AsyncSessionLocal,
    Base,
    BaseModel,
    close_db,
    engine,
    get_db,
    ping_db,
)
from kernel.module import BaseModule, ModuleRegistry
from kernel.security import (
    InvalidTokenError,
    TokenExpiredError,
    TokenPair,
    TokenPayload,
    TokenType,
    TokenTypeMismatchError,
    create_access_token,
    create_refresh_token,
    create_token,
    create_token_pair,
    decode_token,
    get_current_subject,
    get_token_payload,
    hash_password,
    verify_password,
    verify_token,
)

# Convenience aliases
import kernel.database as db
import kernel.security as security

__all__ = [
    # Config
    "Settings",
    "PostgresSettings",
    "SecuritySettings",
    "get_settings",
    # Database
    "Base",
    "BaseModel",
    "POSTGRES_NAMING_CONVENTION",
    "engine",
    "AsyncSessionLocal",
    "get_db",
    "close_db",
    "ping_db",
    "db",
    # Module
    "BaseModule",
    "ModuleRegistry",
    # Security
    "security",
    "create_token",
    "create_access_token",
    "create_refresh_token",
    "create_token_pair",
    "decode_token",
    "verify_token",
    "hash_password",
    "verify_password",
    "TokenPair",
    "TokenPayload",
    "TokenType",
    "TokenExpiredError",
    "InvalidTokenError",
    "TokenTypeMismatchError",
    "get_token_payload",
    "get_current_subject",
]
