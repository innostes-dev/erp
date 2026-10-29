"""User request and response schemas."""

from typing import Any
import uuid

from pydantic import ConfigDict, EmailStr, Field

from kernel.core.schemas import AuditReadSchema, BaseSchema
from kernel.user.models.user import UserStatus


class AdminUserCreate(BaseSchema):
    """Administrator credentials and profile collected during first-run setup."""

    first_name: str = Field(
        min_length=1,
        max_length=100,
        description="Administrator given name.",
        examples=["Priya"],
    )
    last_name: str | None = Field(
        default=None,
        max_length=100,
        description="Administrator family name.",
        examples=["Shah"],
    )
    email: EmailStr = Field(
        description="Primary administrative email address used for root login.",
        examples=["priya.shah@northwind.example"],
    )
    password: str = Field(
        min_length=8,
        max_length=128,
        description="Strong administrative root password.",
        examples=["AdminSecurePassword2026!"],
    )
    mobile: str | None = Field(
        default=None,
        max_length=32,
        description="Administrative mobile telephone number.",
        examples=["+919876543210"],
    )


# Backward-compatible alias for existing imports
AdminUserInput = AdminUserCreate


class UserCreate(BaseSchema):
    """Payload to create a new user account."""

    first_name: str = Field(
        min_length=1,
        max_length=100,
        description="User given name.",
        examples=["Arjun"],
    )
    last_name: str | None = Field(
        default=None,
        max_length=100,
        description="User family name.",
        examples=["Mehta"],
    )
    email: EmailStr = Field(
        description="Primary user account email address.",
        examples=["arjun.mehta@northwind.example"],
    )
    password: str = Field(
        min_length=8,
        max_length=128,
        description="Initial account password.",
        examples=["UserSecurePassword2026!"],
    )
    mobile: str | None = Field(
        default=None,
        max_length=32,
        description="User mobile telephone number.",
        examples=["+919876543211"],
    )
    is_super_admin: bool = Field(
        default=False,
        description="Flag granting platform-wide super administrator privileges.",
        examples=[False],
    )


class UserUpdate(BaseSchema):
    """Payload to update an existing user."""

    first_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Updated given name.",
        examples=["Arjun"],
    )
    last_name: str | None = Field(
        default=None,
        max_length=100,
        description="Updated family name.",
        examples=["Mehta"],
    )
    status: UserStatus | None = Field(
        default=None,
        description="Account lifecycle status.",
        examples=[UserStatus.ACTIVE],
    )
    must_change_password: bool | None = Field(
        default=None,
        description="Flag forcing user to reset credentials upon subsequent login.",
        examples=[False],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "first_name": "Arjun",
                    "last_name": "Mehta",
                    "status": "active",
                    "must_change_password": False,
                }
            ]
        }
    )


class UserRead(AuditReadSchema):
    """User identity record as returned by the API (with decrypted email and mobile)."""

    first_name: str = Field(
        description="User given name.",
        examples=["Priya"],
    )
    last_name: str | None = Field(
        default=None,
        description="User family name.",
        examples=["Shah"],
    )
    email: str = Field(
        description="Decrypted primary user email address.",
        examples=["priya.shah@northwind.example"],
    )
    mobile: str | None = Field(
        default=None,
        description="Decrypted mobile telephone number.",
        examples=["+919876543210"],
    )
    status: UserStatus = Field(
        description="Account lifecycle status.",
        examples=[UserStatus.ACTIVE],
    )
    is_super_admin: bool = Field(
        description="Whether the user holds platform-wide super administrator privileges.",
        examples=[True],
    )
    token_version: int = Field(
        description="Monotonically increasing token generation counter used for instant session invalidation.",
        examples=[1],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "first_name": "Priya",
                    "last_name": "Shah",
                    "email": "priya.shah@northwind.example",
                    "mobile": "+919876543210",
                    "status": "active",
                    "is_super_admin": True,
                    "token_version": 1,
                    "created_at": "2026-10-29T10:00:00Z",
                    "created_by": None,
                    "updated_at": "2026-10-29T10:00:00Z",
                    "updated_by": None,
                    "deleted_at": None,
                    "deleted_by": None,
                }
            ]
        }
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() if self.last_name else self.first_name
