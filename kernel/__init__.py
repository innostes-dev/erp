"""Innostes ERP Kernel: Core Infrastructure and Modular Foundation."""

from typing import Any
from kernel.config import PostgresSettings, Settings, get_settings
from kernel.database import (
    POSTGRES_NAMING_CONVENTION,
    Base,
    BaseModel,
    close_db,
    get_db,
    ping_db,
)
from kernel.module import BaseModule, ModuleRegistry
from kernel.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)

# Convenience aliases
import kernel.database as db
import kernel.security as security

__all__ = [
    # Config
    "Settings",
    "PostgresSettings",
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
    "create_access_token",
    "create_refresh_token",
    "decode_token",
]


def __getattr__(name: str) -> Any:
    if name in ("engine", "AsyncSessionLocal"):
        import kernel.database as _db
        return getattr(_db, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
