"""PeopleOps HTTP Router."""

from typing import Any
from fastapi import APIRouter, Depends, status
from pydantic import ConfigDict, Field

from kernel.auth.dependencies import require_module
from kernel.core.schemas import BaseSchema

router = APIRouter(prefix="/peopleops", tags=["PeopleOps"])
api_router = APIRouter(dependencies=[Depends(require_module("peopleops"))])


class PeopleOpsInfoResponse(BaseSchema):
    """Information schema for PeopleOps scaffold module."""

    id: str = Field(
        default="peopleops",
        description="Unique package identifier string.",
        examples=["peopleops"],
    )
    name: str = Field(
        default="PeopleOps",
        description="Human-readable module title.",
        examples=["PeopleOps"],
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
        default="People operations, employee directory, leaves, and payroll",
        description="Module functional overview.",
        examples=["People operations, employee directory, leaves, and payroll"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "peopleops",
                    "name": "PeopleOps",
                    "version": "0.1.0",
                    "status": "scaffold_ready",
                    "sub_features": ["employees", "leave", "payroll", "attendance"],
                    "description": "People operations, employee directory, leaves, and payroll",
                }
            ]
        }
    )


@router.get(
    "/info",
    response_model=PeopleOpsInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get PeopleOps module metadata and scaffold status",
    operation_id="peopleops_get_info",
    openapi_extra={"security": []},
)
async def get_peopleops_info() -> PeopleOpsInfoResponse:
    """Return PeopleOps module metadata and scaffold status.

    Public endpoint. Returns scaffold readiness status and available features.
    \f
    Returns:
        PeopleOpsInfoResponse with package status.
    """
    return PeopleOpsInfoResponse()


# Include authenticated business router
router.include_router(api_router)
