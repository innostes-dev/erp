"""Tenant request and response schemas.

Field descriptions and examples here are shown in the API docs.
"""

from pydantic import ConfigDict, Field

from kernel.core.schemas import AuditReadSchema, BaseSchema

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"

_DESCRIPTIONS = {
    "name": "Display name of the organisation.",
    "slug": "Short unique id used in URLs: lowercase letters, digits and dashes (e.g. `acme`).",
    "country": "ISO 3166-1 alpha-2 country code.",
    "timezone": "IANA time zone name.",
    "language": "BCP 47 language tag for the default language.",
    "date_format": "Preferred date format.",
}


class TenantCreate(BaseSchema):
    """Body for creating a tenant."""

    name: str = Field(min_length=1, max_length=255, description=_DESCRIPTIONS["name"], examples=["Acme Corporation"])
    slug: str = Field(
        min_length=1, max_length=63, pattern=SLUG_PATTERN, description=_DESCRIPTIONS["slug"], examples=["acme"]
    )
    country: str | None = Field(
        default=None, min_length=2, max_length=2, description=_DESCRIPTIONS["country"], examples=["IN"]
    )
    timezone: str | None = Field(
        default=None, max_length=64, description=_DESCRIPTIONS["timezone"], examples=["Asia/Kolkata"]
    )
    language: str | None = Field(
        default=None, max_length=16, description=_DESCRIPTIONS["language"], examples=["en-IN"]
    )
    date_format: str | None = Field(
        default=None, max_length=20, description=_DESCRIPTIONS["date_format"], examples=["DD/MM/YYYY"]
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Acme Corporation",
                    "slug": "acme",
                    "country": "IN",
                    "timezone": "Asia/Kolkata",
                    "language": "en-IN",
                    "date_format": "DD/MM/YYYY",
                }
            ]
        }
    )


class TenantUpdate(BaseSchema):
    """Body for updating a tenant. Send only the fields you want to change."""

    name: str | None = Field(default=None, min_length=1, max_length=255, description=_DESCRIPTIONS["name"])
    slug: str | None = Field(
        default=None, min_length=1, max_length=63, pattern=SLUG_PATTERN, description=_DESCRIPTIONS["slug"]
    )
    country: str | None = Field(default=None, min_length=2, max_length=2, description=_DESCRIPTIONS["country"])
    timezone: str | None = Field(default=None, max_length=64, description=_DESCRIPTIONS["timezone"])
    language: str | None = Field(default=None, max_length=16, description=_DESCRIPTIONS["language"])
    date_format: str | None = Field(default=None, max_length=20, description=_DESCRIPTIONS["date_format"])

    model_config = ConfigDict(json_schema_extra={"examples": [{"name": "Acme Corp Ltd"}]})


class TenantRead(AuditReadSchema):
    """A tenant as returned by the API (includes the common record fields)."""

    name: str = Field(description=_DESCRIPTIONS["name"])
    slug: str = Field(description=_DESCRIPTIONS["slug"])
    country: str | None = Field(default=None, description=_DESCRIPTIONS["country"])
    timezone: str | None = Field(default=None, description=_DESCRIPTIONS["timezone"])
    language: str | None = Field(default=None, description=_DESCRIPTIONS["language"])
    date_format: str | None = Field(default=None, description=_DESCRIPTIONS["date_format"])

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "3f6c1a52-8d5e-4b8e-9c1a-2f6d3e7b9a10",
                    "name": "Acme Corporation",
                    "slug": "acme",
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
