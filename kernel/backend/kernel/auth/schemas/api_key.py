"""Schemas for API Key management and creation."""

from datetime import datetime
import uuid

from pydantic import Field

from kernel.core.schemas import BaseSchema


class CreateApiKeyRequest(BaseSchema):
    """Payload to generate a new API key."""

    name: str = Field(min_length=1, max_length=128, description="Descriptive identifier for the API key", examples=["Zapier CRM Sync"])
    expires_in_days: int | None = Field(default=None, ge=1, le=365, description="Lifespan in days. None for perpetual.")
    scopes: list[str] = Field(default=["*"], description="Authorized permission scopes, e.g. ['hrms:read', 'crm:write'] or ['*']")


class ApiKeyRead(BaseSchema):
    """Safe public representation of an API key without secret hash."""

    id: uuid.UUID
    name: str
    key_prefix: str
    scopes: list[str]
    expires_at: datetime | None
    last_used_at: datetime | None
    is_revoked: bool
    created_at: datetime


class ApiKeyCreatedResponse(ApiKeyRead):
    """Returned exclusively on key creation. The raw_key will never be shown again."""

    raw_key: str = Field(
        description="The plaintext secret API token (e.g. inno_live_...). Copy this immediately as it cannot be recovered.",
        examples=["inno_live_xK9pL2mQ7vR1wE5tY8uI0oP3aS6dF4gH"],
    )


class ApiKeyListResponse(BaseSchema):
    """List of all API keys for tenant."""

    items: list[ApiKeyRead]
