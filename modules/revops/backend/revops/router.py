"""RevOps HTTP Router."""

from typing import Any
from fastapi import APIRouter, status
from pydantic import ConfigDict, Field

from kernel.core.schemas import BaseSchema

router = APIRouter(prefix="/revops", tags=["RevOps"])


class RevOpsInfoResponse(BaseSchema):
    """Information schema for RevOps scaffold module."""

    id: str = Field(
        default="revops",
        description="Unique package identifier string.",
        examples=["revops"],
    )
    name: str = Field(
        default="RevOps",
        description="Human-readable module title.",
        examples=["RevOps"],
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
        default="Revenue operations, customer pipeline, deals, and accounts",
        description="Module functional overview.",
        examples=["Revenue operations, customer pipeline, deals, and accounts"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "revops",
                    "name": "RevOps",
                    "version": "0.1.0",
                    "status": "scaffold_ready",
                    "sub_features": ["leads", "deals", "pipeline", "contacts"],
                    "description": "Revenue operations, customer pipeline, deals, and accounts",
                }
            ]
        }
    )


@router.get(
    "/info",
    response_model=RevOpsInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get RevOps module metadata and scaffold status",
    operation_id="revops_get_info",
    openapi_extra={"security": []},
)
async def get_revops_info() -> RevOpsInfoResponse:
    """Return RevOps module metadata and scaffold status.

    Public endpoint. Returns scaffold readiness status and available features.
    \f
    Returns:
        RevOpsInfoResponse with package status.
    """
    return RevOpsInfoResponse()
