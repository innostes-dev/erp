"""Database Declarative Base and Abstract Base Model."""

from datetime import date, datetime
from typing import Any
import uuid

from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

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


class BaseModel(Base):
    """Abstract enterprise base entity.

    All domain tables inherit UUID primary key and UTC audit timestamps.
    """

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

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
