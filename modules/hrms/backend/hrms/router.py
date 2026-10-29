"""HRMS HTTP Router."""

from typing import Any
from fastapi import APIRouter, status
from pydantic import ConfigDict, Field

from kernel.core.schemas import BaseSchema

router = APIRouter(prefix="/hrms", tags=["HRMS"])


class HrmsInfoResponse(BaseSchema):
    """Information schema for HRMS scaffold module."""

    id: str = Field(
        default="hrms",
        description="Unique package identifier string.",
        examples=["hrms"],
    )
    name: str = Field(
        default="HRMS",
        description="Human-readable module title.",
        examples=["HRMS"],
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
        default=["employees", "leave", "payroll", "attendance"],
        description="List of functional sub-features supported by module.",
        examples=[["employees", "leave", "payroll", "attendance"]],
    )
    description: str = Field(
        default="People and human resources management",
        description="Module functional overview.",
        examples=["People and human resources management"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "hrms",
                    "name": "HRMS",
                    "version": "0.1.0",
                    "status": "scaffold_ready",
                    "sub_features": ["employees", "leave", "payroll", "attendance"],
                    "description": "People and human resources management",
                }
            ]
        }
    )


@router.get(
    "/info",
    response_model=HrmsInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get HRMS module metadata and scaffold status",
    operation_id="hrms_get_info",
    openapi_extra={"security": []},
)
async def get_hrms_info() -> HrmsInfoResponse:
    """Return HRMS module metadata and scaffold status.

    Public endpoint. Returns scaffold readiness status and available features.
    \f
    Returns:
        HrmsInfoResponse with package status.
    """
    return HrmsInfoResponse()
