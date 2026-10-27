"""First-run setup request and response schemas."""

from datetime import datetime

from pydantic import Field

from kernel.core.schemas import BaseSchema
from kernel.tenancy.schemas import TenantCreate, TenantRead
from kernel.user.schemas import AdminUserInput, UserRead


class SetupStatus(BaseSchema):
    """Public answer to "does the UI need to show setup?". Nothing else is revealed."""

    installed: bool = Field(description="True once first-run setup has been completed.")

    model_config = {"json_schema_extra": {"examples": [{"installed": False}, {"installed": True}]}}


class SetupChecks(BaseSchema):
    """Pre-install diagnostics, only for holders of the setup token."""

    database_connected: bool = Field(description="True when the database is reachable.")
    migrations_pending: int = Field(description="Number of database migrations setup will apply.", ge=0)

    model_config = {"json_schema_extra": {"examples": [{"database_connected": True, "migrations_pending": 2}]}}


class SetupBrandingInput(BaseSchema):
    """Optional branding preferences collected during first-run setup."""

    theme: str = Field(default="system", description="Theme mode: light | dark | system")
    primary_color: str = Field(default="#2563EB", description="Hex brand primary color")
    logo_url: str | None = Field(default=None, description="Public logo URL")


class SetupRequest(BaseSchema):
    """Everything collected by the setup wizard."""

    organization: TenantCreate = Field(description="The first organisation (tenant) to create.")
    admin: AdminUserInput = Field(
        default_factory=lambda: AdminUserInput(
            first_name="Admin",
            email="admin@example.com",
            password="InnostesAdmin123!",
        ),
        description="The root super administrator credentials.",
    )
    branding: SetupBrandingInput | None = Field(
        default=None,
        description="Optional branding customization. Set to null if skipped.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "organization": {
                        "name": "Acme Corporation",
                        "slug": "acme",
                        "country": "IN",
                        "timezone": "Asia/Kolkata",
                        "language": "en-IN",
                        "date_format": "DD/MM/YYYY",
                    },
                    "admin": {
                        "first_name": "Sai",
                        "last_name": "Krishna",
                        "email": "admin@acme.com",
                        "password": "StrongPassword123!",
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
    """What setup created."""

    tenant: TenantRead = Field(description="The organisation created during setup.")
    admin: UserRead | None = Field(default=None, description="The root super administrator created during setup.")
    installed_at: datetime = Field(description="When setup was completed (UTC).")
