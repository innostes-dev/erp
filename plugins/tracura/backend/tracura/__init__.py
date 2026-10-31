"""Tracura Extensible Plugin for Innostes ERP & External Services."""

from typing import Any
from fastapi import FastAPI

from kernel.core.module import BaseModule
from tracura.middleware.buffer import log_buffer
from tracura.middleware.capture import ApiLoggerCaptureMiddleware, TracuraCaptureMiddleware
from tracura.router import (
    external_ingest_alias_router,
    external_ingest_router,
    legacy_api_logger_router,
    router,
)


class TracuraPlugin(BaseModule):
    """Universal centralized API telemetry, secret scrubbing, and observability engine."""

    name: str = "tracura"
    version: str = "0.1.0"
    description: str = "Universal API request telemetry, secret scrubbing, and observability engine"
    router = router
    openapi_tags: list[dict[str, Any]] = [
        {"name": "Tracura", "description": "Tracura plugin status and runtime diagnostics."},
        {"name": "Tracura - Ingestion", "description": "High-throughput log ingestion endpoints (X-API-Key)."},
        {"name": "Tracura - Projects", "description": "Project and deployment environment lifecycle management."},
        {"name": "Tracura - API Keys", "description": "Google developer-style scoped ingestion key management."},
        {"name": "Tracura - Settings", "description": "Sampling, retention, and multi-vector PII scrubbing policies."},
        {"name": "Tracura - Explorer", "description": "Telemetry query filters, search, and drawer inspection."},
        {"name": "Tracura - Analytics", "description": "High-level KPIs, error rates, and timeseries aggregations."},
    ]

    def configure(self, app: FastAPI) -> None:
        """Register the external /tracura router, legacy aliases, and ASGI auto-capture middleware."""
        # Mount the /tracura canonical router
        app.include_router(external_ingest_router)
        # Mount the /api-logger root alias router for backwards compatibility
        app.include_router(external_ingest_alias_router)
        app.include_router(legacy_api_logger_router)
        # Register ASGI request capture middleware
        app.add_middleware(TracuraCaptureMiddleware)

    async def on_startup(self, app: FastAPI) -> None:
        """Start the background async log batch buffer worker."""
        log_buffer.start()

    async def on_shutdown(self, app: FastAPI) -> None:
        """Gracefully drain the memory queue and flush pending logs to PostgreSQL."""
        await log_buffer.stop()

    async def health_check(self) -> dict[str, Any]:
        """Plugin health diagnostic check."""
        return {
            "status": "HEALTHY",
            "plugin": self.name,
            "version": self.version,
            "buffer_driver": log_buffer.driver,
            "buffer_queue_size": await log_buffer.get_queue_size(),
        }


# Canonical export
plugin = TracuraPlugin()
ApiLoggerPlugin = TracuraPlugin

__all__ = [
    "ApiLoggerPlugin",
    "TracuraCaptureMiddleware",
    "TracuraPlugin",
    "plugin",
    "router",
]
