"""First-run setup request and response schemas."""

from datetime import datetime

from pydantic import Field

from kernel.core.schemas import BaseSchema
from kernel.tenancy.schemas import TenantCreate, TenantRead
from kernel.user.schemas import AdminUserCreate, UserRead


class SetupStatus(BaseSchema):
    """Public answer to whether the UI needs to display the first-run setup wizard."""

    installed: bool = Field(
        description="True once first-run setup has been completed.",
        examples=[False],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"installed": False},
                {"installed": True},
            ]
        }
    }


class SetupChecks(BaseSchema):
    """Pre-install diagnostics for holders of the one-time setup token."""

    database_connected: bool = Field(
        description="True when the database connection pool is healthy and reachable.",
        examples=[True],
    )
    migrations_pending: int = Field(
        description="Number of database schema migrations that setup will apply.",
        ge=0,
        examples=[0],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "database_connected": True,
                    "migrations_pending": 0,
                }
            ]
        }
    }


class SetupBrandingCreate(BaseSchema):
    """Optional branding preferences collected during first-run setup."""

    theme: str = Field(
        default="system",
        description="Default interface theme mode: light, dark, or system.",
        examples=["system"],
    )
    primary_color: str = Field(
        default="#2563EB",
        description="Hexadecimal brand primary accent color code.",
        examples=["#2563EB"],
    )
    logo_url: str | None = Field(
        default=None,
        description="Public URL pointing to corporate logo asset.",
        examples=["https://cdn.northwind.example/logo.svg"],
    )


# Backward-compatible alias
SetupBrandingInput = SetupBrandingCreate


class SetupRequest(BaseSchema):
    """System configuration parameters collected by the setup wizard."""

    organization: TenantCreate = Field(
        description="The primary root customer organisation (tenant) to provision.",
        examples=[{"name": "Northwind Traders Pvt Ltd", "slug": "northwind-traders", "country": "IN"}],
    )
    admin: AdminUserCreate = Field(
        default_factory=lambda: AdminUserCreate(
            first_name="Priya",
            last_name="Shah",
            email="priya.shah@northwind.example",
            password="AdminSecurePassword2026!",
        ),
        description="The root super administrator credentials.",
        examples=[{"first_name": "Priya", "last_name": "Shah", "email": "priya.shah@northwind.example"}],
    )
    branding: SetupBrandingCreate | None = Field(
        default=None,
        description="Optional branding customization. Set to null if skipped.",
        examples=[{"theme": "system", "primary_color": "#2563EB"}],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "organization": {
                        "name": "Northwind Traders Pvt Ltd",
                        "slug": "northwind-traders",
                        "country": "IN",
                        "timezone": "Asia/Kolkata",
                        "language": "en-IN",
                        "date_format": "DD/MM/YYYY",
                    },
                    "admin": {
                        "first_name": "Priya",
                        "last_name": "Shah",
                        "email": "priya.shah@northwind.example",
                        "password": "AdminSecurePassword2026!",
                        "mobile": "+919876543210",
                    },
                    "branding": {
                        "theme": "system",
                        "primary_color": "#2563EB",
                        "logo_url": None,
                    },
                }
            ]
        }
    }


class SetupResult(BaseSchema):
    """Resources created during successful first-run installation."""

    tenant: TenantRead = Field(
        description="The primary organisation created during setup.",
        examples=[{"id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f", "name": "Northwind Traders Pvt Ltd", "slug": "northwind-traders"}],
    )
    admin: UserRead | None = Field(
        default=None,
        description="The root super administrator created during setup.",
        examples=[{"id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "email": "priya.shah@northwind.example"}],
    )
    installed_at: datetime = Field(
        description="Timestamp in ISO 8601 UTC when setup was completed.",
        examples=["2026-10-29T10:00:00Z"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tenant": {
                        "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                        "name": "Northwind Traders Pvt Ltd",
                        "slug": "northwind-traders",
                        "country": "IN",
                        "timezone": "Asia/Kolkata",
                        "language": "en-IN",
                        "date_format": "DD/MM/YYYY",
                        "created_at": "2026-10-29T10:00:00Z",
                        "created_by": None,
                        "updated_at": "2026-10-29T10:00:00Z",
                        "updated_by": None,
                        "deleted_at": None,
                        "deleted_by": None,
                    },
                    "admin": {
                        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
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
                    },
                    "installed_at": "2026-10-29T10:00:00Z",
                }
            ]
        }
    }
