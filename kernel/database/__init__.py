"""Database Core Package for Innostes ERP Kernel."""

from typing import Any
from kernel.database.base import POSTGRES_NAMING_CONVENTION, Base, BaseModel
from kernel.database.connection import close_db, ping_db
from kernel.database.db_settings import PostgresSettings
from kernel.database.session import get_db

__all__ = [
    "Base",
    "BaseModel",
    "POSTGRES_NAMING_CONVENTION",
    "PostgresSettings",
    "engine",
    "AsyncSessionLocal",
    "get_db",
    "close_db",
    "ping_db",
]


def __getattr__(name: str) -> Any:
    if name == "engine":
        from kernel.database.connection import get_engine
        return get_engine()
    if name == "AsyncSessionLocal":
        from kernel.database.session import get_sessionmaker
        return get_sessionmaker()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
