"""User profile personalization schemas."""

from typing import Any
import uuid

from pydantic import Field

from kernel.core.schemas import AuditReadSchema, BaseSchema


class UserProfileUpdate(BaseSchema):
    """Payload to update personal presentation preferences."""

    preferred_language: str | None = Field(default=None, max_length=16)
    timezone: str | None = Field(default=None, max_length=64)
    date_format: str | None = Field(default=None, max_length=20)
    time_format: str | None = Field(default=None, max_length=10)
    avatar_url: str | None = Field(default=None, max_length=512)
    bio: str | None = Field(default=None)
    ui_preferences: dict[str, Any] | None = Field(default=None)


class UserProfileRead(AuditReadSchema):
    """User profile record representation."""

    user_id: uuid.UUID
    preferred_language: str
    timezone: str
    date_format: str
    time_format: str
    avatar_url: str | None = None
    bio: str | None = None
    ui_preferences: dict[str, Any] = Field(default_factory=dict)
