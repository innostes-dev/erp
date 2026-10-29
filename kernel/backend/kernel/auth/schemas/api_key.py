"""Schemas for API Key management and creation."""

from datetime import datetime
import uuid

from pydantic import Field

from kernel.core.schemas import BaseSchema


class CreateApiKeyRequest(BaseSchema):
    """Payload to generate a new API key."""

    name: str = Field(
        min_length=1,
        max_length=128,
        description="Descriptive identifier for the API key.",
        examples=["Zapier CRM Sync"],
    )
    expires_in_days: int | None = Field(
        default=None,
        ge=1,
        le=365,
        description="Lifespan in days. Null for perpetual key.",
        examples=[30],
    )
    scopes: list[str] = Field(
        default=["*"],
        description="Authorized permission scopes, e.g. ['hrms:read', 'crm:write'] or ['*'].",
        examples=[["crm:read", "hrms:read"]],
    )


class ApiKeyRead(BaseSchema):
    """Safe public representation of an API key without secret hash."""

    id: uuid.UUID = Field(
        description="Unique identifier of the API key.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    )
    name: str = Field(
        description="Human-readable label for the API key.",
        examples=["Zapier CRM Sync"],
    )
    key_prefix: str = Field(
        description="Public prefix used to identify the token key (e.g. inno_live_...).",
        examples=["inno_live_xK9p"],
    )
    scopes: list[str] = Field(
        description="Authorized permission scopes granted to this key.",
        examples=[["crm:read", "hrms:read"]],
    )
    expires_at: datetime | None = Field(
        default=None,
        description="Expiration timestamp in ISO 8601 UTC format. Null for perpetual keys.",
        examples=["2026-11-28T10:00:00Z"],
    )
    last_used_at: datetime | None = Field(
        default=None,
        description="Timestamp when key was last presented in an authenticated request.",
        examples=["2026-10-29T10:15:00Z"],
    )
    is_revoked: bool = Field(
        description="Flag indicating whether this API key has been revoked.",
        examples=[False],
    )
    created_at: datetime = Field(
        description="Timestamp when key was created.",
        examples=["2026-10-29T09:00:00Z"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "name": "Zapier CRM Sync",
                    "key_prefix": "inno_live_xK9p",
                    "scopes": ["crm:read", "hrms:read"],
                    "expires_at": "2026-11-28T10:00:00Z",
                    "last_used_at": "2026-10-29T10:15:00Z",
                    "is_revoked": False,
                    "created_at": "2026-10-29T09:00:00Z",
                }
            ]
        }
    }


class ApiKeyCreatedResponse(ApiKeyRead):
    """Returned exclusively on key creation. The raw_key will never be shown again."""

    raw_key: str = Field(
        description="The plaintext secret API token (e.g. inno_live_...). Copy this immediately as it cannot be recovered.",
        examples=["inno_live_xK9pL2mQ7vR1wE5tY8uI0oP3aS6dF4gH"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "name": "Zapier CRM Sync",
                    "key_prefix": "inno_live_xK9p",
                    "scopes": ["crm:read", "hrms:read"],
                    "expires_at": "2026-11-28T10:00:00Z",
                    "last_used_at": None,
                    "is_revoked": False,
                    "created_at": "2026-10-29T09:00:00Z",
                    "raw_key": "inno_live_xK9pL2mQ7vR1wE5tY8uI0oP3aS6dF4gH",
                }
            ]
        }
    }


class ApiKeyListResponse(BaseSchema):
    """List of all API keys for tenant."""

    items: list[ApiKeyRead] = Field(
        description="List of all personal access tokens and programmatic API keys for the current organization.",
        examples=[
            [
                {
                    "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "name": "Zapier CRM Sync",
                    "key_prefix": "inno_live_xK9p",
                    "scopes": ["crm:read", "hrms:read"],
                    "expires_at": "2026-11-28T10:00:00Z",
                    "last_used_at": "2026-10-29T10:15:00Z",
                    "is_revoked": False,
                    "created_at": "2026-10-29T09:00:00Z",
                }
            ]
        ],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "items": [
                        {
                            "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                            "name": "Zapier CRM Sync",
                            "key_prefix": "inno_live_xK9p",
                            "scopes": ["crm:read", "hrms:read"],
                            "expires_at": "2026-11-28T10:00:00Z",
                            "last_used_at": "2026-10-29T10:15:00Z",
                            "is_revoked": False,
                            "created_at": "2026-10-29T09:00:00Z",
                        }
                    ]
                }
            ]
        }
    }
