"""API Logger Ingestion Key Pydantic Schemas."""

from datetime import datetime
import uuid
from pydantic import Field

from kernel.core.schemas import BaseSchema


class ApiKeyCreate(BaseSchema):
    """Payload to generate a new scoped ingestion API key."""

    name: str = Field(..., min_length=1, max_length=128, description="Key name / label", examples=["Prod Cluster Ingestion Key"])
    project_id: uuid.UUID | None = Field(default=None, description="Scope to a specific project. If None, permitted across all tenant projects.")
    allowed_environments: list[str] = Field(default=["*"], description="Allowed environments, e.g. ['production'] or ['*']")
    ip_allowlist: list[str] | None = Field(default=None, description="Optional list of permitted client CIDRs or IPs")
    allowed_origins: list[str] | None = Field(default=None, description="Optional list of permitted HTTP Origin headers")
    rate_limit_rpm: int = Field(default=1200, ge=60, le=120000, description="Rate limit requests per minute")
    expires_in_days: int | None = Field(default=None, ge=1, le=365, description="Key expiry in days from creation")


class ApiKeyCreatedResponse(BaseSchema):
    """Returned ONLY ONCE upon key generation, containing the raw plaintext secret."""

    id: uuid.UUID
    name: str
    key_prefix: str
    raw_key: str = Field(..., description="Plaintext secret key. Store this securely; it cannot be retrieved again.", examples=["inno_log_live_a1b2c3d4e5..."])
    project_id: uuid.UUID | None
    allowed_environments: list[str]
    ip_allowlist: list[str] | None
    rate_limit_rpm: int
    expires_at: datetime | None
    created_at: datetime


class ApiKeyRead(BaseSchema):
    """Public metadata for an API key (secret is never returned)."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    key_prefix: str
    status: str
    project_id: uuid.UUID | None
    project_name: str | None = None
    allowed_environments: list[str]
    ip_allowlist: list[str] | None
    allowed_origins: list[str] | None
    rate_limit_rpm: int
    expires_at: datetime | None
    last_used_at: datetime | None
    created_at: datetime
