"""Innostes ERP Kernel: Core Infrastructure and Modular Foundation."""

from kernel.config import PostgresSettings, Settings, get_settings
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

# Convenience alias for db
import kernel.database as db

__all__ = [
    "Settings",
    "PostgresSettings",
    "get_settings",
    "Base",
    "BaseModel",
    "POSTGRES_NAMING_CONVENTION",
    "engine",
    "AsyncSessionLocal",
    "get_db",
    "close_db",
    "ping_db",
    "BaseModule",
    "ModuleRegistry",
    "db",
]
