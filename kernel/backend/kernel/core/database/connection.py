"""PostgreSQL Engine Connection, Pool Configuration, and Health Diagnostics."""

import asyncio
import time
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import AsyncAdaptedQueuePool

_engine: AsyncEngine | None = None


def get_engine() -> AsyncEngine:
    """Return the cached async database engine instance, creating it on first access."""
    global _engine
    if _engine is None:
        from kernel.core.config import get_settings

        settings = get_settings()
        _engine = create_async_engine(
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
    return _engine


def __getattr__(name: str) -> Any:
    if name == "engine":
        return get_engine()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


async def close_db() -> None:
    """Gracefully dispose connection pool on application shutdown."""
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


async def ping_db(timeout: float = 3.0) -> dict[str, Any]:
    """Execute 'SELECT 1' to verify connection and report pool health."""
    engine = get_engine()
    pool = engine.pool
    pool_stats = {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
    }

    try:
        start_time = time.perf_counter()

        async def _ping() -> None:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))

        if hasattr(asyncio, "timeout"):
            async with asyncio.timeout(timeout):
                await _ping()
        else:
            await asyncio.wait_for(_ping(), timeout=timeout)

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
