"""User device inventory and remote wipe table."""

from datetime import datetime, timezone
from enum import Enum
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class DeviceType(str, Enum):
    """Classification of client devices."""

    DESKTOP = "desktop"
    MOBILE = "mobile"
    TABLET = "tablet"
    SCANNER = "scanner"
    KIOSK = "kiosk"


class DeviceStatus(str, Enum):
    """Device authorization state."""

    ACTIVE = "active"
    PENDING_APPROVAL = "pending_approval"
    BLOCKED = "blocked"
    WIPED = "wiped"


class UserDevice(BaseModel):
    """Physical hardware device registry for Zero-Trust access and remote wipe (table `user_devices`)."""

    __tablename__ = "user_devices"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    device_fingerprint: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    device_name: Mapped[str] = mapped_column(String(255), nullable=False)
    device_type: Mapped[DeviceType] = mapped_column(
        ENUM(DeviceType, name="device_type_enum", create_type=False),
        default=DeviceType.DESKTOP,
        nullable=False,
    )

    os_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    os_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    client_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    client_version: Mapped[str | None] = mapped_column(String(32), nullable=True)

    push_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_trusted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_corporate_managed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    status: Mapped[DeviceStatus] = mapped_column(
        ENUM(DeviceStatus, name="device_status_enum", create_type=False),
        default=DeviceStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    wipe_requested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)

    user = relationship("User", back_populates="devices")
    sessions = relationship("UserSession", back_populates="device", cascade="all, delete-orphan")
