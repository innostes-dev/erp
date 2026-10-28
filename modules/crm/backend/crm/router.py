"""CRM HTTP Router."""

from typing import Any
from fastapi import APIRouter, status

from kernel.core.schemas import BaseSchema

router = APIRouter(prefix="/crm", tags=["CRM"])


class CrmInfoResponse(BaseSchema):
    """Information schema for CRM scaffold module."""

    id: str = "crm"
    name: str = "CRM"
    version: str = "0.1.0"
    status: str = "scaffold_ready"
    sub_features: list[str] = ["leads", "deals", "pipeline", "contacts"]
    description: str = "Customer relationship management and sales pipeline"


@router.get(
    "/info",
    response_model=CrmInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get CRM module metadata and scaffold status",
    operation_id="crm_get_info",
)
async def get_crm_info() -> CrmInfoResponse:
    """Return CRM module metadata and scaffold status."""
    return CrmInfoResponse()
