"""Tenant request and response schemas.

Field descriptions and examples here are shown in the API docs.
"""

from pydantic import ConfigDict, Field

from kernel.core.schemas import AuditReadSchema, BaseSchema

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"

_DESCRIPTIONS = {
    "name": "Display name of the organisation.",
    "slug": "Short unique identifier used in URLs: lowercase letters, digits, and hyphens (e.g. `northwind-traders`).",
    "country": "ISO 3166-1 alpha-2 country code.",
    "timezone": "IANA time zone name.",
    "language": "BCP 47 language tag for default language.",
    "date_format": "Preferred date display format.",
}


class TenantCreate(BaseSchema):
    """Body for creating a customer organisation (tenant)."""

    name: str = Field(
        min_length=1,
        max_length=255,
        description=_DESCRIPTIONS["name"],
        examples=["Northwind Traders Pvt Ltd"],
    )
    slug: str = Field(
        min_length=1,
        max_length=63,
        pattern=SLUG_PATTERN,
        description=_DESCRIPTIONS["slug"],
        examples=["northwind-traders"],
    )
    country: str | None = Field(
        default=None,
        min_length=2,
        max_length=2,
        description=_DESCRIPTIONS["country"],
        examples=["IN"],
    )
    timezone: str | None = Field(
        default=None,
        max_length=64,
        description=_DESCRIPTIONS["timezone"],
        examples=["Asia/Kolkata"],
    )
    language: str | None = Field(
        default=None,
        max_length=16,
        description=_DESCRIPTIONS["language"],
        examples=["en-IN"],
    )
    date_format: str | None = Field(
        default=None,
        max_length=20,
        description=_DESCRIPTIONS["date_format"],
        examples=["DD/MM/YYYY"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Northwind Traders Pvt Ltd",
                    "slug": "northwind-traders",
                    "country": "IN",
                    "timezone": "Asia/Kolkata",
                    "language": "en-IN",
                    "date_format": "DD/MM/YYYY",
                }
            ]
        }
    )


class TenantUpdate(BaseSchema):
    """Body for updating a tenant organisation. Send only the fields you wish to modify."""

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
        description=_DESCRIPTIONS["name"],
        examples=["Northwind Traders India Pvt Ltd"],
    )
    slug: str | None = Field(
        default=None,
        min_length=1,
        max_length=63,
        pattern=SLUG_PATTERN,
        description=_DESCRIPTIONS["slug"],
        examples=["northwind-traders-india"],
    )
    country: str | None = Field(
        default=None,
        min_length=2,
        max_length=2,
        description=_DESCRIPTIONS["country"],
        examples=["IN"],
    )
    timezone: str | None = Field(
        default=None,
        max_length=64,
        description=_DESCRIPTIONS["timezone"],
        examples=["Asia/Kolkata"],
    )
    language: str | None = Field(
        default=None,
        max_length=16,
        description=_DESCRIPTIONS["language"],
        examples=["en-IN"],
    )
    date_format: str | None = Field(
        default=None,
        max_length=20,
        description=_DESCRIPTIONS["date_format"],
        examples=["DD/MM/YYYY"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Northwind Traders India Pvt Ltd",
                    "country": "IN",
                    "timezone": "Asia/Kolkata",
                }
            ]
        }
    )


class TenantRead(AuditReadSchema):
    """A tenant organisation as returned by the API (includes common audit trail fields)."""

    name: str = Field(
        description=_DESCRIPTIONS["name"],
        examples=["Northwind Traders Pvt Ltd"],
    )
    slug: str = Field(
        description=_DESCRIPTIONS["slug"],
        examples=["northwind-traders"],
    )
    country: str | None = Field(
        default=None,
        description=_DESCRIPTIONS["country"],
        examples=["IN"],
    )
    timezone: str | None = Field(
        default=None,
        description=_DESCRIPTIONS["timezone"],
        examples=["Asia/Kolkata"],
    )
    language: str | None = Field(
        default=None,
        description=_DESCRIPTIONS["language"],
        examples=["en-IN"],
    )
    date_format: str | None = Field(
        default=None,
        description=_DESCRIPTIONS["date_format"],
        examples=["DD/MM/YYYY"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "name": "Northwind Traders Pvt Ltd",
                    "slug": "northwind-traders",
                    "country": "IN",
                    "timezone": "Asia/Kolkata",
                    "language": "en-IN",
                    "date_format": "DD/MM/YYYY",
                    "created_at": "2026-10-26T10:15:00Z",
                    "created_by": "9b2e4c71-0a3d-4f5e-8b6c-1d2e3f4a5b6c",
                    "updated_at": "2026-10-26T10:15:00Z",
                    "updated_by": "9b2e4c71-0a3d-4f5e-8b6c-1d2e3f4a5b6c",
                    "deleted_at": None,
                    "deleted_by": None,
                }
            ]
        }
    )
