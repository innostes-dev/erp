"""Pydantic schemas for PeopleOps Leave."""

from typing import Any
from pydantic import ConfigDict, Field
from kernel.core.schemas import BaseSchema


class LeaveBaseResponse(BaseSchema):
    """Standard success schema for leave operations."""

    status: str = Field(default="ok", description="Operation status string.")
    message: str = Field(default="Operation completed successfully.", description="Status narrative.")
    data: dict[str, Any] = Field(default_factory=dict, description="Payload data mapping.")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "status": "ok",
                    "message": "Operation completed successfully.",
                    "data": {},
                }
            ]
        }
    )
