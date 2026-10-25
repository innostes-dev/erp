"""Enterprise PostgreSQL Database Layer.

Provides:
- AsyncEngine with tuned connection pooling (pre-ping, recycle, overflow limits)
- AsyncSession factory and FastAPI get_db dependency
- Declarative Base with standard PostgreSQL naming conventions and audit timestamps
- Lightweight health check probe (SELECT 1 ping + pool diagnostics)
"""

import asyncio
from collections.abc import AsyncGenerator
from datetime import date, datetime
import time
from typing import Any
import uuid

from sqlalchemy import DateTime, MetaData, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import AsyncAdaptedQueuePool

from app.kernel.config import get_settings

settings = get_settings()

# Standard PostgreSQL naming convention for safe migrations
POSTGRES_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


# ==============================================================================
# 1. Base ORM Models
# ==============================================================================
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


# ==============================================================================
# 2. Connection Engine & Session Factory
# ==============================================================================
engine = create_async_engine(
    url=settings.db.async_url,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=settings.db.pool_size,
    max_overflow=settings.db.max_overflow,
    pool_timeout=settings.db.pool_timeout,
    pool_recycle=settings.db.pool_recycle,
    pool_pre_ping=settings.db.pool_pre_ping,
    echo=settings.db.echo_sql,
    connect_args={
        "server_settings": {
            "application_name": "erp-api-server",
            "timezone": "UTC",
            "search_path": settings.db.schema_name,
        }
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ==============================================================================
# 3. Session Dependency & Lifecycle Utilities
# ==============================================================================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for database sessions.

    Automatically commits on success, rolls back on exception,
    and returns the connection cleanly to the pool.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db() -> None:
    """Gracefully dispose connection pool on application shutdown."""
    await engine.dispose()


async def ping_db(timeout: float = 3.0) -> dict[str, Any]:
    """Execute 'SELECT 1' to verify connection and report pool health."""
    pool = engine.pool
    pool_stats = {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
    }

    try:
        start_time = time.perf_counter()
        async with asyncio.timeout(timeout):
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))

        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "status": "HEALTHY",
            "latency_ms": round(latency_ms, 2),
            "pool": pool_stats,
            "error": None,
        }
    except Exception as exc:
        return {
            "status": "UNHEALTHY",
            "latency_ms": None,
            "pool": pool_stats,
            "error": exc.__class__.__name__,
        }
