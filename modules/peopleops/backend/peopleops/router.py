"""PeopleOps HTTP Router."""

from fastapi import APIRouter, Depends, status
from pydantic import ConfigDict, Field

from kernel.auth.dependencies import require_module
from kernel.core.schemas import BaseSchema

from peopleops.attendance.router import router as attendance_router
from peopleops.core.router import router as core_router
from peopleops.expenses.router import router as expenses_router
from peopleops.leave.router import router as leave_router
from peopleops.masters.router import router as masters_router
from peopleops.offboarding.router import router as offboarding_router
from peopleops.payroll.router import router as payroll_router

router = APIRouter(prefix="/peopleops", tags=["PeopleOps"])
api_router = APIRouter(dependencies=[Depends(require_module("peopleops"))])

# Mount sub-feature routers under authenticated api_router
api_router.include_router(masters_router)
api_router.include_router(core_router)
api_router.include_router(attendance_router)
api_router.include_router(leave_router)
api_router.include_router(payroll_router)
api_router.include_router(expenses_router)
api_router.include_router(offboarding_router)


class PeopleOpsInfoResponse(BaseSchema):
    """Information schema for PeopleOps module."""

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
        default="phase_0_anchor_ready",
        description="Operational readiness status of module.",
        examples=["phase_0_anchor_ready"],
    )
    sub_features: list[str] = Field(
        default=[
            "dashboard",
            "masters",
            "core",
            "attendance",
            "leave",
            "payroll",
            "expenses",
            "offboarding",
        ],
        description="List of functional sub-features supported by module.",
        examples=[[
            "dashboard",
            "masters",
            "core",
            "attendance",
            "leave",
            "payroll",
            "expenses",
            "offboarding",
        ]],
    )
    description: str = Field(
        default="People operations, employee directory, leaves, attendance, payroll, expenses, and offboarding",
        description="Module functional overview.",
        examples=["People operations, employee directory, leaves, attendance, payroll, expenses, and offboarding"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "peopleops",
                    "name": "PeopleOps",
                    "version": "0.1.0",
                    "status": "phase_0_anchor_ready",
                    "sub_features": [
                        "dashboard",
                        "masters",
                        "core",
                        "attendance",
                        "leave",
                        "payroll",
                        "expenses",
                        "offboarding",
                    ],
                    "description": "People operations, employee directory, leaves, attendance, payroll, expenses, and offboarding",
                }
            ]
        }
    )


@router.get(
    "/info",
    response_model=PeopleOpsInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get PeopleOps module metadata and anchor readiness",
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

__all__ = ["router", "api_router"]
