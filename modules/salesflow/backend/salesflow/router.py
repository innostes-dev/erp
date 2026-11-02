"""SalesFlow HTTP Router."""

from typing import Any
from fastapi import APIRouter, status
from pydantic import ConfigDict, Field

from kernel.core.schemas import BaseSchema

router = APIRouter(prefix="/salesflow", tags=["SalesFlow"])


class SalesFlowInfoResponse(BaseSchema):
    """Information schema for SalesFlow scaffold module."""

    id: str = Field(
        default="salesflow",
        description="Unique package identifier string.",
        examples=["salesflow"],
    )
    name: str = Field(
        default="SalesFlow",
        description="Human-readable module title.",
        examples=["SalesFlow"],
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
        default="SalesFlow sales pipeline, customer leads, deals, and accounts",
        description="Module functional overview.",
        examples=["SalesFlow sales pipeline, customer leads, deals, and accounts"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "salesflow",
                    "name": "SalesFlow",
                    "version": "0.1.0",
                    "status": "scaffold_ready",
                    "sub_features": ["leads", "deals", "pipeline", "contacts"],
                    "description": "SalesFlow sales pipeline, customer leads, deals, and accounts",
                }
            ]
        }
    )


@router.get(
    "/info",
    response_model=SalesFlowInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get SalesFlow module metadata and scaffold status",
    operation_id="salesflow_get_info",
    openapi_extra={"security": []},
)
async def get_salesflow_info() -> SalesFlowInfoResponse:
    """Return SalesFlow module metadata and scaffold status.

    Public endpoint. Returns scaffold readiness status and available features.
    \f
    Returns:
        SalesFlowInfoResponse with package status.
    """
    return SalesFlowInfoResponse()
