"""API Logger Plugin HTTP Router."""

from typing import Any
from fastapi import APIRouter, status

from kernel.core.schemas import BaseSchema

router = APIRouter(prefix="/plugins/api-logger", tags=["API Logger"])


class ApiLoggerInfoResponse(BaseSchema):
    """Information schema for API Logger plugin."""

    id: str = "api-logger"
    name: str = "API Logger"
    version: str = "0.1.0"
    status: str = "scaffold_ready"
    type: str = "plugin"
    features: list[str] = ["requests", "webhooks", "analytics", "filters"]
    description: str = "API request logging, webhook inspection, and debugging"


@router.get(
    "/info",
    response_model=ApiLoggerInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get API Logger plugin metadata and status",
    operation_id="api_logger_get_info",
)
async def get_api_logger_info() -> ApiLoggerInfoResponse:
    """Return API Logger plugin metadata and status."""
    return ApiLoggerInfoResponse()
