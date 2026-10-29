"""API Logger Plugin HTTP Router."""

from typing import Any
from fastapi import APIRouter, status
from pydantic import ConfigDict, Field

from kernel.core.schemas import BaseSchema

router = APIRouter(prefix="/plugins/api-logger", tags=["API logger"])


class ApiLoggerInfoResponse(BaseSchema):
    """Information schema for API Logger plugin."""

    id: str = Field(
        default="api-logger",
        description="Unique plugin identifier string.",
        examples=["api-logger"],
    )
    name: str = Field(
        default="API Logger",
        description="Human-readable plugin title.",
        examples=["API Logger"],
    )
    version: str = Field(
        default="0.1.0",
        description="Semver version string.",
        examples=["0.1.0"],
    )
    status: str = Field(
        default="scaffold_ready",
        description="Operational readiness status of plugin.",
        examples=["scaffold_ready"],
    )
    type: str = Field(
        default="plugin",
        description="Package type classification.",
        examples=["plugin"],
    )
    features: list[str] = Field(
        default=["requests", "webhooks", "analytics", "filters"],
        description="List of telemetry features provided by plugin.",
        examples=[["requests", "webhooks", "analytics", "filters"]],
    )
    description: str = Field(
        default="API request logging, webhook inspection, and debugging",
        description="Plugin functional overview.",
        examples=["API request logging, webhook inspection, and debugging"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "api-logger",
                    "name": "API Logger",
                    "version": "0.1.0",
                    "status": "scaffold_ready",
                    "type": "plugin",
                    "features": ["requests", "webhooks", "analytics", "filters"],
                    "description": "API request logging, webhook inspection, and debugging",
                }
            ]
        }
    )


@router.get(
    "/info",
    response_model=ApiLoggerInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get API logger plugin metadata and status",
    operation_id="api_logger_get_info",
    openapi_extra={"security": []},
)
async def get_api_logger_info() -> ApiLoggerInfoResponse:
    """Return API Logger plugin metadata and status.

    Public endpoint. Returns scaffold readiness status and available features.
    \f
    Returns:
        ApiLoggerInfoResponse with telemetry plugin metadata.
    """
    return ApiLoggerInfoResponse()
