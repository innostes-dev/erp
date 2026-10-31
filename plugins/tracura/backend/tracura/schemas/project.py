"""API Logger Project & Environment Pydantic Schemas."""

from datetime import datetime
import uuid
from pydantic import Field

from kernel.core.schemas import AuditReadSchema, BaseSchema


class ProjectCreate(BaseSchema):
    """Payload to create a new telemetry project."""

    name: str = Field(..., min_length=1, max_length=255, description="Project display name", examples=["Payment Gateway"])
    slug: str = Field(..., min_length=1, max_length=63, pattern=r"^[a-z0-9-]+$", description="URL/slug identifier", examples=["payment-gateway"])
    description: str | None = Field(default=None, description="Optional description of the project")


class ProjectUpdate(BaseSchema):
    """Payload to update an existing project."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class EnvironmentCreate(BaseSchema):
    """Payload to add a deployment environment to a project."""

    name: str = Field(..., min_length=1, max_length=64, description="Environment display name", examples=["Production"])
    slug: str = Field(..., min_length=1, max_length=32, pattern=r"^[a-z0-9-]+$", description="Slug identifier", examples=["production"])
    color_badge: str = Field(default="blue", max_length=16, description="Badge color in UI", examples=["emerald", "blue", "amber"])


class EnvironmentUpdate(BaseSchema):
    """Payload to update an environment."""

    name: str | None = None
    color_badge: str | None = None
    is_active: bool | None = None


class EnvironmentRead(AuditReadSchema):
    """Environment details."""

    project_id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    slug: str
    color_badge: str
    is_active: bool


class ProjectRead(AuditReadSchema):
    """Project details with associated environments."""

    tenant_id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    is_active: bool
    environments: list[EnvironmentRead] = []
