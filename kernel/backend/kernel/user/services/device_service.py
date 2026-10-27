"""User device management service."""

from datetime import datetime, timezone
import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.services import NotFoundError
from kernel.user.models.device import DeviceStatus, DeviceType, UserDevice
from kernel.user.models.session import UserSession
from kernel.user.schemas.device import UserDeviceCreate


class DeviceNotFoundError(NotFoundError):
    """Raised when device is not found."""

    def __init__(self, device_id: uuid.UUID) -> None:
        super().__init__(f"Device '{device_id}' not found.")


class DeviceService:
    """Service governing device inventory and remote wipe."""

    async def register_or_touch_device(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        device_data: UserDeviceCreate,
        ip_address: str | None = None,
    ) -> UserDevice:
        """Register a new device or update last seen timestamp for existing device."""
        stmt = select(UserDevice).where(
            UserDevice.user_id == user_id,
            UserDevice.device_fingerprint == device_data.device_fingerprint,
            UserDevice.deleted_at.is_(None),
        )
        res = await session.execute(stmt)
        device = res.scalar_one_or_none()
        now_utc = datetime.now(timezone.utc)

        if device:
            device.device_name = device_data.device_name
            device.device_type = device_data.device_type
            device.os_name = device_data.os_name
            device.os_version = device_data.os_version
            device.client_name = device_data.client_name
            device.client_version = device_data.client_version
            if device_data.push_token:
                device.push_token = device_data.push_token
            device.last_seen_at = now_utc
            device.last_ip = ip_address
            await session.flush()
            return device

        device = UserDevice(
            user_id=user_id,
            device_fingerprint=device_data.device_fingerprint,
            device_name=device_data.device_name,
            device_type=device_data.device_type,
            os_name=device_data.os_name,
            os_version=device_data.os_version,
            client_name=device_data.client_name,
            client_version=device_data.client_version,
            push_token=device_data.push_token,
            status=DeviceStatus.ACTIVE,
            first_seen_at=now_utc,
            last_seen_at=now_utc,
            last_ip=ip_address,
        )
        session.add(device)
        await session.flush()
        return device

    async def wipe_device(
        self,
        session: AsyncSession,
        device_id: uuid.UUID,
    ) -> UserDevice:
        """Issue remote wipe order for hardware device and invalidate active sessions."""
        stmt = select(UserDevice).where(UserDevice.id == device_id, UserDevice.deleted_at.is_(None))
        res = await session.execute(stmt)
        device = res.scalar_one_or_none()
        if not device:
            raise DeviceNotFoundError(device_id)

        now_utc = datetime.now(timezone.utc)
        device.status = DeviceStatus.WIPED
        device.wipe_requested_at = now_utc

        # Invalidate all active user sessions bound to this device
        revoke_stmt = (
            update(UserSession)
            .where(
                UserSession.device_id == device_id,
                UserSession.revoked_at.is_(None),
            )
            .values(revoked_at=now_utc)
        )
        await session.execute(revoke_stmt)
        await session.flush()
        return device
