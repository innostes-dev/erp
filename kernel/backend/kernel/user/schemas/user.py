"""User request and response schemas."""

from typing import Any
import uuid

from pydantic import ConfigDict, EmailStr, Field

from kernel.core.schemas import AuditReadSchema, BaseSchema
from kernel.user.models.user import UserStatus


class AdminUserInput(BaseSchema):
    """Administrator credentials and profile collected during first-run setup."""

    first_name: str = Field(min_length=1, max_length=100, description="Admin given name", examples=["Admin"])
    last_name: str | None = Field(default=None, max_length=100, description="Admin family name", examples=["Owner"])
    email: EmailStr = Field(description="Primary administrative email (used for login)", examples=["admin@example.com"])
    password: str = Field(min_length=8, max_length=128, description="Strong administrative password")
    mobile: str | None = Field(default=None, max_length=32, description="Admin mobile telephone", examples=["+1234567890"])


class UserCreate(BaseSchema):
    """Payload to create a new user account."""

    first_name: str = Field(min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: EmailStr = Field()
    password: str = Field(min_length=8, max_length=128)
    mobile: str | None = Field(default=None, max_length=32)
    is_super_admin: bool = Field(default=False)


class UserUpdate(BaseSchema):
    """Payload to update an existing user."""

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    status: UserStatus | None = Field(default=None)
    must_change_password: bool | None = Field(default=None)


class UserRead(AuditReadSchema):
    """User identity record as returned by the API (with decrypted email and mobile)."""

    first_name: str
    last_name: str | None = None
    email: str
    mobile: str | None = None
    status: UserStatus
    is_super_admin: bool
    token_version: int

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() if self.last_name else self.first_name
