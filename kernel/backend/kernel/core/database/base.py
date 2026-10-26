"""Database Declarative Base and Abstract Base Model."""

from datetime import date, datetime
from typing import Any
import uuid

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

from kernel.core.database.mixins import (
    AuditMixin,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

# Standard PostgreSQL naming convention for safe migrations
POSTGRES_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Declarative Base with standard constraint naming conventions."""

    metadata = MetaData(naming_convention=POSTGRES_NAMING_CONVENTION)


class BaseModel(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    AuditMixin,
    SoftDeleteMixin,
    Base,
):
    """Abstract base for every table.

    Common columns: id, created_at, created_by, updated_at, updated_by,
    deleted_at, deleted_by. Subclasses only add their own columns.
    """

    __abstract__ = True

    def __init__(self, **kwargs: Any) -> None:
        kwargs.setdefault("id", uuid.uuid4())
        super().__init__(**kwargs)

    def to_dict(self) -> dict[str, Any]:
        """Convert model column attributes into a plain dictionary."""
        result: dict[str, Any] = {}
        for col in self.__table__.columns:
            val = getattr(self, col.name)
            if isinstance(val, (datetime, date)):
                result[col.name] = val.isoformat()
            elif isinstance(val, uuid.UUID):
                result[col.name] = str(val)
            else:
                result[col.name] = val
        return result
