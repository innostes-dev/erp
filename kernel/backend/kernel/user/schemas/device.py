"""User device schemas."""

from datetime import datetime
import uuid

from pydantic import Field

from kernel.core.schemas import AuditReadSchema, BaseSchema
from kernel.user.models.device import DeviceStatus, DeviceType


class UserDeviceCreate(BaseSchema):
    device_fingerprint: str = Field(min_length=16, max_length=128)
    device_name: str = Field(min_length=1, max_length=255)
    device_type: DeviceType = Field(default=DeviceType.DESKTOP)
    os_name: str | None = Field(default=None, max_length=64)
    os_version: str | None = Field(default=None, max_length=32)
    client_name: str | None = Field(default=None, max_length=64)
    client_version: str | None = Field(default=None, max_length=32)
    push_token: str | None = Field(default=None)


class UserDeviceRead(AuditReadSchema):
    user_id: uuid.UUID
    device_fingerprint: str
    device_name: str
    device_type: DeviceType
    os_name: str | None = None
    os_version: str | None = None
    client_name: str | None = None
    client_version: str | None = None
    is_trusted: bool
    is_corporate_managed: bool
    status: DeviceStatus
    wipe_requested_at: datetime | None = None
    first_seen_at: datetime
    last_seen_at: datetime
    last_ip: str | None = None


class DeviceWipeRequest(BaseSchema):
    device_id: uuid.UUID
    reason: str | None = Field(default=None)
