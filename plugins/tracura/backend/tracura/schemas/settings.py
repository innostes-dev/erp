"""API Logger Settings & Policy Pydantic Schemas."""

from datetime import datetime
import uuid
from pydantic import Field

from kernel.core.schemas import AuditReadSchema, BaseSchema


class SettingsUpdate(BaseSchema):
    """Payload to update retention, sampling, or scrubbing rules."""

    retention_days: int | None = Field(default=None, ge=1, le=730, description="Log retention period in days")
    max_body_size_bytes: int | None = Field(default=None, ge=512, le=65536, description="Max body capture bytes before truncation")
    sampling_rate: float | None = Field(default=None, ge=0.01, le=1.00, description="Sampling rate from 0.01 (1%) to 1.00 (100%)")
    capture_headers: bool | None = None
    capture_body: bool | None = None
    log_errors_only: bool | None = None
    excluded_paths: list[str] | None = None
    sensitive_headers: list[str] | None = None
    sensitive_body_fields: list[str] | None = None
    mask_client_ip: bool | None = None


class SettingsRead(BaseSchema):
    """API Logger settings details."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    project_id: uuid.UUID | None
    environment_id: uuid.UUID | None
    retention_days: int
    max_body_size_bytes: int
    sampling_rate: float
    capture_headers: bool
    capture_body: bool
    log_errors_only: bool
    excluded_paths: list[str]
    sensitive_headers: list[str]
    sensitive_body_fields: list[str]
    mask_client_ip: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
