"""FastAPI Application Entry Point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Response, status

from app.core.config import get_settings
from app.core.database import close_db, ping_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan managing database pool shutdown."""
    yield
    # Clean up and dispose connection pool on shutdown
    await close_db()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)


@app.get("/", tags=["General"])
def root() -> dict[str, str]:
    """Root endpoint returning service identity."""
    return {
        "service": settings.app_name,
        "environment": settings.app_env,
        "status": "online",
    }


@app.get("/health", tags=["Observability"])
async def health(response: Response) -> dict[str, Any]:
    """Health probe reporting API status and PostgreSQL connection pool health."""
    db_report = await ping_db(timeout=3.0)
    is_healthy = db_report["status"] == "HEALTHY"

    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "pass" if is_healthy else "fail",
        "environment": settings.app_env,
        "database": db_report,
    }
