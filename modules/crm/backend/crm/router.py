"""CRM HTTP Router."""

from typing import Any
from fastapi import APIRouter, status
from pydantic import ConfigDict, Field

from kernel.core.schemas import BaseSchema

router = APIRouter(prefix="/crm", tags=["CRM"])


class CrmInfoResponse(BaseSchema):
    """Information schema for CRM scaffold module."""

    id: str = Field(
        default="crm",
        description="Unique package identifier string.",
        examples=["crm"],
    )
    name: str = Field(
        default="CRM",
        description="Human-readable module title.",
        examples=["CRM"],
    )
    version: str = Field(
        default="0.1.0",
        description="Semver version string.",
        examples=["0.1.0"],
    )
    status: str = Field(
        default="scaffold_ready",
        description="Operational readiness status of module.",
        examples=["scaffold_ready"],
    )
    sub_features: list[str] = Field(
        default=["leads", "deals", "pipeline", "contacts"],
        description="List of functional sub-features supported by module.",
        examples=[["leads", "deals", "pipeline", "contacts"]],
    )
    description: str = Field(
        default="Customer relationship management and sales pipeline",
        description="Module functional overview.",
        examples=["Customer relationship management and sales pipeline"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "crm",
                    "name": "CRM",
                    "version": "0.1.0",
                    "status": "scaffold_ready",
                    "sub_features": ["leads", "deals", "pipeline", "contacts"],
                    "description": "Customer relationship management and sales pipeline",
                }
            ]
        }
    )


@router.get(
    "/info",
    response_model=CrmInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get CRM module metadata and scaffold status",
    operation_id="crm_get_info",
    openapi_extra={"security": []},
)
async def get_crm_info() -> CrmInfoResponse:
    """Return CRM module metadata and scaffold status.

    Public endpoint. Returns scaffold readiness status and available features.
    \f
    Returns:
        CrmInfoResponse with package status.
    """
    return CrmInfoResponse()
