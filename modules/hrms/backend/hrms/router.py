"""HRMS HTTP Router."""

from typing import Any
from fastapi import APIRouter, status

from kernel.core.schemas import BaseSchema

router = APIRouter(prefix="/hrms", tags=["HRMS"])


class HrmsInfoResponse(BaseSchema):
    """Information schema for HRMS scaffold module."""

    id: str = "hrms"
    name: str = "HRMS"
    version: str = "0.1.0"
    status: str = "scaffold_ready"
    sub_features: list[str] = ["employees", "leave", "payroll", "attendance"]
    description: str = "People and human resources management"


@router.get(
    "/info",
    response_model=HrmsInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get HRMS module metadata and scaffold status",
    operation_id="hrms_get_info",
)
async def get_hrms_info() -> HrmsInfoResponse:
    """Return HRMS module metadata and scaffold status."""
    return HrmsInfoResponse()
