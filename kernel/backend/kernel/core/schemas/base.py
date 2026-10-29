"""Base Pydantic schemas shared by every feature.

Every read schema inherits `AuditReadSchema`, so all API responses expose
the common columns the same way. Field descriptions here appear in the
API docs (`/docs`, `/redoc`).
"""

from datetime import datetime
from typing import Generic, TypeVar
import uuid

from pydantic import BaseModel as PydanticModel
from pydantic import ConfigDict, Field


class BaseSchema(PydanticModel):
    """Base for all request/response schemas.

    `from_attributes=True` lets a schema be built straight from an ORM
    object: `TenantRead.model_validate(tenant)`.
    """

    model_config = ConfigDict(from_attributes=True)


class AuditReadSchema(BaseSchema):
    """Common fields present on every record (mirrors `kernel.core.database.BaseModel`).

    Read schemas inherit this and only add their own fields.
    """

    id: uuid.UUID = Field(
        description="Unique identifier of the record in UUID v4 format.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    )
    created_at: datetime = Field(
        description="Timestamp when the record was created in ISO 8601 UTC format.",
        examples=["2026-10-29T10:00:00Z"],
    )
    created_by: uuid.UUID | None = Field(
        default=None,
        description="Unique identifier of the user who created the record. Null for automated system actions.",
        examples=["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"],
    )
    updated_at: datetime = Field(
        description="Timestamp when the record was last modified in ISO 8601 UTC format.",
        examples=["2026-10-29T10:30:00Z"],
    )
    updated_by: uuid.UUID | None = Field(
        default=None,
        description="Unique identifier of the user who last modified the record. Null for automated system actions.",
        examples=["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"],
    )
    deleted_at: datetime | None = Field(
        default=None,
        description="Timestamp when the record was soft-deleted in ISO 8601 UTC format. Null while active.",
        examples=[None],
    )
    deleted_by: uuid.UUID | None = Field(
        default=None,
        description="Unique identifier of the user who soft-deleted the record. Null while active.",
        examples=[None],
    )


ItemT = TypeVar("ItemT")


class Page(BaseSchema, Generic[ItemT]):
    """One page of a paginated list.

    Attributes:
        items: Records on this page.
        total: Number of matching records across all pages.
        offset: How many records were skipped.
        limit: Maximum records per page.
    """

    items: list[ItemT] = Field(description="Records on this page.", examples=[[]])
    total: int = Field(description="Number of matching records across all pages.", ge=0, examples=[42])
    offset: int = Field(description="How many records were skipped.", ge=0, examples=[0])
    limit: int = Field(description="Maximum records per page.", ge=1, le=200, examples=[20])
