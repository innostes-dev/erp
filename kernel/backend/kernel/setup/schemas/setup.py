"""First-run setup request and response schemas."""

from datetime import datetime

from pydantic import Field

from kernel.core.schemas import BaseSchema
from kernel.tenancy.schemas import TenantCreate, TenantRead


class SetupStatus(BaseSchema):
    """Public answer to "does the UI need to show setup?". Nothing else is revealed."""

    installed: bool = Field(description="True once first-run setup has been completed.")

    model_config = {"json_schema_extra": {"examples": [{"installed": False}, {"installed": True}]}}


class SetupChecks(BaseSchema):
    """Pre-install diagnostics, only for holders of the setup token."""

    database_connected: bool = Field(description="True when the database is reachable.")
    migrations_pending: int = Field(description="Number of database migrations setup will apply.", ge=0)

    model_config = {"json_schema_extra": {"examples": [{"database_connected": True, "migrations_pending": 2}]}}


class SetupRequest(BaseSchema):
    """Everything collected by the setup wizard."""

    organization: TenantCreate = Field(description="The first organisation (tenant) to create.")

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
                    }
                }
            ]
        }
    }


class SetupResult(BaseSchema):
    """What setup created."""

    tenant: TenantRead = Field(description="The organisation created during setup.")
    installed_at: datetime = Field(description="When setup was completed (UTC).")
