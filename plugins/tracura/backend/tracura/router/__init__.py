"""Tracura Master HTTP Router & Sub-Router Registrations."""

from typing import Any
from fastapi import APIRouter, status
from pydantic import ConfigDict, Field

from kernel.core.schemas import BaseSchema
from tracura.router.analytics import router as analytics_router
from tracura.router.ingest import router as ingest_router
from tracura.router.keys import router as keys_router
from tracura.router.logs import router as logs_router
from tracura.router.projects import router as projects_router
from tracura.router.settings import router as settings_router

# Master canonical router mounted under /plugins/tracura
router = APIRouter(prefix="/plugins/tracura", tags=["Tracura"])


class TracuraInfoResponse(BaseSchema):
    """Information schema for Tracura plugin."""

    id: str = Field(
        default="tracura",
        description="Unique plugin identifier string.",
        examples=["tracura"],
    )
    name: str = Field(
        default="Tracura",
        description="Human-readable plugin title.",
        examples=["Tracura"],
    )
    version: str = Field(
        default="0.1.0",
        description="Semver version string.",
        examples=["0.1.0"],
    )
    status: str = Field(
        default="active",
        description="Operational readiness status of plugin.",
        examples=["active"],
    )
    type: str = Field(
        default="plugin",
        description="Package type classification.",
        examples=["plugin"],
    )
    features: list[str] = Field(
        default=["universal_telemetry", "scoped_api_keys", "pii_redaction", "async_buffer", "explorer", "analytics"],
        description="List of telemetry features provided by plugin.",
        examples=[["universal_telemetry", "scoped_api_keys", "pii_redaction", "async_buffer", "explorer", "analytics"]],
    )
    endpoints: list[dict[str, Any]] = Field(
        default=[
            {"method": "GET", "path": "/plugins/tracura/info", "description": "Get plugin metadata and operational status"},
            {"method": "POST", "path": "/tracura/v1/ingest", "description": "Ingest single telemetry record (X-API-Key)"},
            {"method": "POST", "path": "/tracura/v1/ingest/batch", "description": "Batch ingest up to 250 telemetry records"},
            {"method": "GET", "path": "/plugins/tracura/v1/projects", "description": "List all telemetry projects for tenant"},
            {"method": "POST", "path": "/plugins/tracura/v1/projects", "description": "Create new telemetry project with environments"},
            {"method": "GET", "path": "/plugins/tracura/v1/keys", "description": "List scoped ingestion API keys"},
            {"method": "POST", "path": "/plugins/tracura/v1/keys", "description": "Generate new scoped ingestion API key"},
            {"method": "DELETE", "path": "/plugins/tracura/v1/keys/{key_id}", "description": "Revoke ingestion API key"},
            {"method": "GET", "path": "/plugins/tracura/v1/settings", "description": "Get effective retention & scrubbing policy"},
            {"method": "PATCH", "path": "/plugins/tracura/v1/settings", "description": "Update retention, sampling, or PII scrubbing"},
            {"method": "GET", "path": "/plugins/tracura/v1/logs", "description": "Query and filter telemetry logs"},
            {"method": "GET", "path": "/plugins/tracura/v1/analytics/dashboard", "description": "Analytics KPIs, charts, and top errors"},
        ],
        description="Summary catalog of available Tracura API endpoints.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "tracura",
                    "name": "Tracura",
                    "version": "0.1.0",
                    "status": "active",
                    "type": "plugin",
                    "features": ["universal_telemetry", "scoped_api_keys", "pii_redaction", "async_buffer", "explorer", "analytics"],
                    "endpoints": [
                        {"method": "GET", "path": "/plugins/tracura/info", "description": "Get plugin metadata and operational status"}
                    ],
                }
            ]
        }
    )


# Backwards compatibility alias
ApiLoggerInfoResponse = TracuraInfoResponse


@router.get(
    "/info",
    response_model=TracuraInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Tracura plugin metadata and status",
    operation_id="tracura_get_info",
    openapi_extra={"security": []},
)
async def get_tracura_info() -> TracuraInfoResponse:
    """Return Tracura plugin metadata and status."""
    return TracuraInfoResponse()


get_api_logger_info = get_tracura_info

# Include feature sub-routers under master router
router.include_router(ingest_router)
router.include_router(projects_router)
router.include_router(keys_router)
router.include_router(settings_router)
router.include_router(logs_router)
router.include_router(analytics_router)

# External canonical router for `/tracura/v1/ingest`
external_ingest_router = APIRouter(prefix="/tracura", tags=["Tracura - Ingestion"])
external_ingest_router.include_router(ingest_router)

# External alias router for `/api-logger/v1/ingest` (legacy fallback)
external_ingest_alias_router = APIRouter(prefix="/api-logger", tags=["Tracura - Ingestion"], include_in_schema=False)
external_ingest_alias_router.include_router(ingest_router)

# Legacy alias router for `/plugins/api-logger`
legacy_api_logger_router = APIRouter(prefix="/plugins/api-logger", tags=["Tracura"], include_in_schema=False)
legacy_api_logger_router.include_router(ingest_router)
legacy_api_logger_router.include_router(projects_router)
legacy_api_logger_router.include_router(keys_router)
legacy_api_logger_router.include_router(settings_router)
legacy_api_logger_router.include_router(logs_router)
legacy_api_logger_router.include_router(analytics_router)


@legacy_api_logger_router.get(
    "/info",
    response_model=TracuraInfoResponse,
    status_code=status.HTTP_200_OK,
    operation_id="api_logger_get_info",
    openapi_extra={"security": []},
    include_in_schema=False,
)
async def get_legacy_api_logger_info() -> TracuraInfoResponse:
    return TracuraInfoResponse()


__all__ = [
    "ApiLoggerInfoResponse",
    "TracuraInfoResponse",
    "analytics_router",
    "external_ingest_alias_router",
    "external_ingest_router",
    "get_api_logger_info",
    "get_tracura_info",
    "ingest_router",
    "keys_router",
    "legacy_api_logger_router",
    "logs_router",
    "projects_router",
    "router",
    "settings_router",
]
