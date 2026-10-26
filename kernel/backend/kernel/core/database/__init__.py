"""Database Core Package for Innostes ERP Kernel."""

from typing import Any
from kernel.core.database.base import POSTGRES_NAMING_CONVENTION, Base, BaseModel
from kernel.core.database.connection import close_db, ping_db
from kernel.core.database.db_settings import PostgresSettings
from kernel.core.database.mixins import (
    AuditMixin,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)
from kernel.core.database.migrations import (
    apply_migrations,
    auto_migrate,
    pending_migrations,
    run_migrations,
)
from kernel.core.database.session import get_db

__all__ = [
    "Base",
    "BaseModel",
    "POSTGRES_NAMING_CONVENTION",
    "UUIDPrimaryKeyMixin",
    "TimestampMixin",
    "AuditMixin",
    "SoftDeleteMixin",
    "PostgresSettings",
    "engine",
    "AsyncSessionLocal",
    "get_db",
    "close_db",
    "ping_db",
    "apply_migrations",
    "auto_migrate",
    "run_migrations",
    "pending_migrations",
]


def __getattr__(name: str) -> Any:
    if name == "engine":
        from kernel.core.database.connection import get_engine
        return get_engine()
    if name == "AsyncSessionLocal":
        from kernel.core.database.session import get_sessionmaker
        return get_sessionmaker()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
