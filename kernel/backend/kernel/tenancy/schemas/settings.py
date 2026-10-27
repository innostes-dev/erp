"""Tenant scoped settings schemas."""

from typing import Any
import uuid

from pydantic import ConfigDict, Field

from kernel.core.schemas import AuditReadSchema, BaseSchema


class TenantSettingUpsert(BaseSchema):
    """Payload to create or update a namespace configuration block."""

    namespace: str = Field(min_length=1, max_length=64, description="Namespace domain partition (e.g. branding, auth)")
    config: dict[str, Any] = Field(description="Structured settings payload for the namespace")


class TenantSettingRead(AuditReadSchema):
    """Tenant setting representation as returned by the API."""

    tenant_id: uuid.UUID = Field(description="Organization ID")
    namespace: str = Field(description="Namespace domain partition")
    config: dict[str, Any] = Field(description="Settings configuration payload")
    version: int = Field(description="Schema revision version")


class BrandingSettings(BaseSchema):
    """Strongly typed structure for 'branding' namespace."""

    theme: str = Field(default="system", description="light | dark | system")
    primary_color: str = Field(default="#2563EB", description="Hex brand color")
    accent_color: str = Field(default="#4F46E5", description="Secondary accent hex color")
    company_display_name: str | None = Field(default=None, description="Branded display name")
    logo_url: str | None = Field(default=None, description="Public logo URL")
    favicon_url: str | None = Field(default=None, description="Favicon URL")


class AuthSettings(BaseSchema):
    """Strongly typed structure for 'auth' namespace."""

    mfa_enforced: bool = Field(default=False)
    session_idle_timeout_minutes: int = Field(default=60)
    max_login_attempts: int = Field(default=5)


class LocalizationSettings(BaseSchema):
    """Strongly typed structure for 'localization' namespace."""

    timezone: str = Field(default="UTC")
    language: str = Field(default="en-US")
    date_format: str = Field(default="YYYY-MM-DD")
    time_format: str = Field(default="24h")
    currency: str = Field(default="USD")
