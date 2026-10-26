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

    id: uuid.UUID = Field(description="Unique id of the record.")
    created_at: datetime = Field(description="When the record was created (UTC).")
    created_by: uuid.UUID | None = Field(
        default=None, description="User who created the record. Null for system actions."
    )
    updated_at: datetime = Field(description="When the record was last changed (UTC).")
    updated_by: uuid.UUID | None = Field(
        default=None, description="User who last changed the record. Null for system actions."
    )
    deleted_at: datetime | None = Field(
        default=None, description="When the record was soft-deleted. Null if active."
    )
    deleted_by: uuid.UUID | None = Field(
        default=None, description="User who soft-deleted the record. Null if active."
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

    items: list[ItemT] = Field(description="Records on this page.")
    total: int = Field(description="Number of matching records across all pages.", ge=0)
    offset: int = Field(description="How many records were skipped.", ge=0)
    limit: int = Field(description="Maximum records per page.", ge=1)
