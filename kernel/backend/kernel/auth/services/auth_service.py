"""Enterprise Authentication Service handling login, sessions, forgot password, and reset flows."""

from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import string
from urllib.parse import quote
import uuid

import jwt
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
    TokenResponse,
)
from kernel.auth.services.email_service import EmailService, get_email_service
from kernel.core.config import get_settings
from kernel.core.crypto import BlindIndex, FieldCipher
from kernel.core.security.jwt import create_access_token, decode_token
from kernel.core.services import (
    ConflictError,
    ForbiddenError,
    UnauthorizedError,
)
from kernel.user.models.device import DeviceStatus, DeviceType, UserDevice
from kernel.user.models.password_history import PasswordHistory
from kernel.user.models.security import UserSecurity
from kernel.user.models.session import UserSession
from kernel.user.models.user import User, UserStatus
from kernel.user.schemas import UserDeviceCreate
from kernel.user.services import (
    DeviceService,
    UserService,
    hash_password,
    verify_password,
)

# Standard pre-computed bcrypt hash used to neutralize timing attacks on user lookups
DUMMY_BCRYPT_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lew.6K2f2D3z8S6mK"


class InvalidCredentialsError(UnauthorizedError):
    """Raised when email or password verification fails."""

    def __init__(self, message: str = "Invalid email or password") -> None:
        super().__init__(message)


class AccountLockedError(UnauthorizedError):
    """Raised when an account is temporarily locked due to too many failed attempts."""

    def __init__(self, retry_after: int = 900) -> None:
        super().__init__(
            "Account is temporarily locked due to too many failed login attempts. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )


class AccountSuspendedError(ForbiddenError):
    """Raised when account is inactive or administratively suspended."""

    def __init__(self) -> None:
        super().__init__("Account has been suspended or deactivated. Contact your administrator.")


class TemporaryPasswordExpiredError(UnauthorizedError):
    """Raised when temporary password has passed its validity window."""

    def __init__(self) -> None:
        super().__init__("Temporary password has expired. Please request a new password reset.")


class DeviceWipedError(ForbiddenError):
    """Raised when a hardware device has been remotely wiped."""

    def __init__(self) -> None:
        super().__init__("This device has been remotely wiped. Access is blocked.")


class InvalidTokenError(UnauthorizedError):
    """Raised when JWT or refresh token validation fails."""

    def __init__(self, message: str = "Invalid or expired token") -> None:
        super().__init__(message)


class PasswordRecentlyUsedError(ConflictError):
    """Raised when new password matches recently used passwords (SOC 2)."""

    def __init__(self) -> None:
        super().__init__("Cannot reuse a recently used password. Please choose a different password.")


def generate_secure_temp_password(length: int = 16) -> str:
    """Generate a cryptographically strong temporary password."""
    upper = string.ascii_uppercase
    lower = string.ascii_lowercase
    digits = string.digits
    symbols = "!@#$%^&*()-_=+"

    # Guarantee at least 2 of each category
    password_chars = [
        secrets.choice(upper),
        secrets.choice(upper),
        secrets.choice(lower),
        secrets.choice(lower),
        secrets.choice(digits),
        secrets.choice(digits),
        secrets.choice(symbols),
        secrets.choice(symbols),
    ]

    all_chars = upper + lower + digits + symbols
    for _ in range(length - len(password_chars)):
        password_chars.append(secrets.choice(all_chars))

    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)


class AuthService:
    """Enterprise authentication service handling credentials, tokens, and recovery."""

    def __init__(
        self,
        user_service: UserService | None = None,
        device_service: DeviceService | None = None,
        email_service: EmailService | None = None,
        blind_index: BlindIndex | None = None,
    ) -> None:
        self.user_service = user_service or UserService()
        self.device_service = device_service or DeviceService()
        self.email_service = email_service or get_email_service()
        self.blind_index = blind_index or BlindIndex()

    def _hash_refresh_token(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def create_password_reset_token(self, user: User) -> str:
        """Create signed, single-use JWT for password reset link."""
        settings = get_settings()
        now = datetime.now(timezone.utc)
        exp = now + timedelta(minutes=settings.password_reset_token_expire_minutes)

        payload = {
            "sub": str(user.id),
            "type": "password_reset",
            "token_version": user.token_version,
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
        }
        return jwt.encode(
            payload,
            settings.jwt_secret_key.get_secret_value(),
            algorithm=settings.jwt_algorithm,
        )

    async def check_password_history(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        new_password: str,
        limit: int = 5,
    ) -> None:
        """Enforce password history: reject if new password matches any of the last N passwords."""
        stmt = (
            select(PasswordHistory)
            .where(PasswordHistory.user_id == user_id)
            .order_by(PasswordHistory.created_at.desc())
            .limit(limit)
        )
        res = await session.execute(stmt)
        histories = res.scalars().all()
        for hist in histories:
            if verify_password(new_password, hist.password_hash):
                raise PasswordRecentlyUsedError()

    async def login(
        self,
        session: AsyncSession,
        data: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        """Authenticate user credentials, register device, and issue JWT/refresh token."""
        now_utc = datetime.now(timezone.utc)
        settings = get_settings()

        user = await self.user_service.get_by_email(session, data.email)

        # Neutralize account enumeration side-channel timing attacks
        if not user:
            verify_password(data.password, DUMMY_BCRYPT_HASH)
            raise InvalidCredentialsError()

        # Check account lockout
        if user.is_blocked:
            if user.status == UserStatus.SUSPENDED:
                raise AccountSuspendedError()
            retry_seconds = 900
            if user.blocked_until:
                blocked_tz = user.blocked_until if user.blocked_until.tzinfo else user.blocked_until.replace(tzinfo=timezone.utc)
                retry_seconds = max(1, int((blocked_tz - now_utc).total_seconds()))
            raise AccountLockedError(retry_after=retry_seconds)

        if user.status != UserStatus.ACTIVE:
            raise AccountSuspendedError()

        # Check password
        is_valid_pw = verify_password(data.password, user.password_hash)
        if not is_valid_pw:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= settings.max_failed_login_attempts:
                user.blocked_until = now_utc + timedelta(minutes=settings.account_lockout_minutes)
            await session.flush()
            raise InvalidCredentialsError()

        # Check temporary password expiration
        if user.must_change_password and user.temp_password_expires_at:
            exp_tz = (
                user.temp_password_expires_at
                if user.temp_password_expires_at.tzinfo
                else user.temp_password_expires_at.replace(tzinfo=timezone.utc)
            )
            if exp_tz < now_utc:
                raise TemporaryPasswordExpiredError()

        # Reset failed attempts on success
        user.failed_login_attempts = 0
        user.blocked_until = None

        # Register or update device
        device_data = UserDeviceCreate(
            device_fingerprint=data.device_fingerprint,
            device_name=data.device_name or "Web Client",
            device_type=data.device_type,
        )
        device = await self.device_service.register_or_touch_device(
            session=session,
            user_id=user.id,
            device_data=device_data,
            ip_address=ip_address,
        )
        if device.status == DeviceStatus.WIPED:
            raise DeviceWipedError()

        # Update UserSecurity state
        sec_stmt = select(UserSecurity).where(UserSecurity.user_id == user.id)
        sec_res = await session.execute(sec_stmt)
        security = sec_res.scalar_one_or_none()
        if security:
            security.last_login_at = now_utc
            security.last_login_ip = ip_address

        # Generate tokens
        decrypted_email = self.user_service.decrypt_email(user)
        access_token_payload = {
            "sub": str(user.id),
            "email": decrypted_email,
            "token_version": user.token_version,
            "is_super_admin": user.is_super_admin,
        }
        access_token = create_access_token(access_token_payload)

        raw_refresh_token = secrets.token_urlsafe(48)
        refresh_token_hash = self._hash_refresh_token(raw_refresh_token)
        refresh_expires_at = now_utc + timedelta(days=settings.refresh_token_expire_days)

        user_session = UserSession(
            user_id=user.id,
            device_id=device.id,
            refresh_token_hash=refresh_token_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=refresh_expires_at,
        )
        session.add(user_session)
        await session.flush()

        user_read = self.user_service.to_user_read(user)
        expires_in = settings.access_token_expire_minutes * 60

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh_token,
            token_type="bearer",
            expires_in=expires_in,
            must_change_password=bool(user.must_change_password),
            user=user_read,
        )

    async def refresh_token(
        self,
        session: AsyncSession,
        data: RefreshTokenRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> RefreshTokenResponse:
        """Rotate refresh token: revoke current token, issue fresh pair."""
        now_utc = datetime.now(timezone.utc)
        settings = get_settings()
        token_hash = self._hash_refresh_token(data.refresh_token)

        stmt = select(UserSession).where(UserSession.refresh_token_hash == token_hash)
        res = await session.execute(stmt)
        user_session = res.scalar_one_or_none()

        if not user_session:
            raise InvalidTokenError("Invalid refresh token")

        # Reuse Detection: If already revoked, possible token theft!
        if user_session.revoked_at is not None:
            # Invalidate all active sessions for this user as a safeguard
            revoke_all = (
                update(UserSession)
                .where(
                    UserSession.user_id == user_session.user_id,
                    UserSession.revoked_at.is_(None),
                )
                .values(revoked_at=now_utc)
            )
            await session.execute(revoke_all)
            await session.flush()
            raise InvalidTokenError("Refresh token was previously revoked. All active sessions invalidated.")

        session_exp = (
            user_session.expires_at
            if user_session.expires_at.tzinfo
            else user_session.expires_at.replace(tzinfo=timezone.utc)
        )
        if session_exp < now_utc:
            user_session.revoked_at = now_utc
            await session.flush()
            raise InvalidTokenError("Refresh token expired")

        user = await self.user_service.get_by_id(session, user_session.user_id)
        if not user or user.status != UserStatus.ACTIVE or user.is_blocked:
            user_session.revoked_at = now_utc
            await session.flush()
            raise InvalidTokenError("User account inactive or locked")

        # Verify device status if linked
        if user_session.device_id:
            dev_stmt = select(UserDevice).where(UserDevice.id == user_session.device_id)
            dev_res = await session.execute(dev_stmt)
            device = dev_res.scalar_one_or_none()
            if device and device.status == DeviceStatus.WIPED:
                raise DeviceWipedError()

        # Revoke old session (Rotation)
        user_session.revoked_at = now_utc

        # Issue new refresh token
        new_raw_refresh = secrets.token_urlsafe(48)
        new_hash = self._hash_refresh_token(new_raw_refresh)
        new_expires = now_utc + timedelta(days=settings.refresh_token_expire_days)

        new_session = UserSession(
            user_id=user.id,
            device_id=user_session.device_id,
            refresh_token_hash=new_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=new_expires,
        )
        session.add(new_session)
        await session.flush()

        decrypted_email = self.user_service.decrypt_email(user)
        access_token = create_access_token({
            "sub": str(user.id),
            "email": decrypted_email,
            "token_version": user.token_version,
            "is_super_admin": user.is_super_admin,
        })

        return RefreshTokenResponse(
            access_token=access_token,
            refresh_token=new_raw_refresh,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )

    async def forgot_password(
        self,
        session: AsyncSession,
        data: ForgotPasswordRequest,
    ) -> ForgotPasswordResponse:
        """Trigger temporary credentials and password reset link with anti-enumeration protection."""
        now_utc = datetime.now(timezone.utc)
        settings = get_settings()

        user = await self.user_service.get_by_email(session, data.email)

        # If user does not exist or suspended, execute fake timing and return generic response
        if not user or user.status != UserStatus.ACTIVE:
            verify_password("dummy-password", DUMMY_BCRYPT_HASH)
            return ForgotPasswordResponse()

        # 1. Generate strong temporary password
        temp_password = generate_secure_temp_password(16)
        user.password_hash = hash_password(temp_password)
        user.must_change_password = True
        user.temp_password_expires_at = now_utc + timedelta(hours=settings.temp_password_expire_hours)

        # 2. Invalidate existing sessions and bump token version
        user.token_version += 1
        revoke_all = (
            update(UserSession)
            .where(
                UserSession.user_id == user.id,
                UserSession.revoked_at.is_(None),
            )
            .values(revoked_at=now_utc)
        )
        await session.execute(revoke_all)

        # 3. Generate signed single-use reset token
        reset_token = self.create_password_reset_token(user)
        decrypted_email = self.user_service.decrypt_email(user)
        encoded_email = quote(decrypted_email)
        reset_link = f"{settings.frontend_url}/reset-password?token={reset_token}&email={encoded_email}"

        # 4. Dispatch Email
        await self.email_service.send_password_reset_email(
            recipient=decrypted_email,
            recipient_name=user.full_name,
            temp_password=temp_password,
            reset_link=reset_link,
            temp_password_hours=settings.temp_password_expire_hours,
            reset_link_minutes=settings.password_reset_token_expire_minutes,
        )

        await session.flush()
        return ForgotPasswordResponse()

    async def reset_password_with_token(
        self,
        session: AsyncSession,
        data: ResetPasswordRequest,
    ) -> MessageResponse:
        """Reset password using verified single-use signed reset token."""
        now_utc = datetime.now(timezone.utc)

        try:
            payload = decode_token(data.token)
        except Exception:
            raise InvalidTokenError("Password reset link is invalid or has expired.")

        if payload.get("type") != "password_reset":
            raise InvalidTokenError("Invalid token type")

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise InvalidTokenError("Invalid subject claim")

        user = await self.user_service.get_by_id(session, uuid.UUID(user_id_str))
        if not user or user.status != UserStatus.ACTIVE:
            raise InvalidTokenError("User account not found or inactive")

        # Single-use check: token version must match
        if user.token_version != payload.get("token_version"):
            raise InvalidTokenError("This password reset link has already been used.")

        # Check password reuse prevention (SOC 2)
        await self.check_password_history(session, user.id, data.new_password)

        new_hash = hash_password(data.new_password)
        user.password_hash = new_hash
        user.must_change_password = False
        user.temp_password_expires_at = None
        user.token_version += 1  # Invalidate reset token and any remaining access tokens

        # Record history
        session.add(PasswordHistory(user_id=user.id, password_hash=new_hash))

        # Update security
        sec_stmt = select(UserSecurity).where(UserSecurity.user_id == user.id)
        sec_res = await session.execute(sec_stmt)
        security = sec_res.scalar_one_or_none()
        if security:
            security.password_changed_at = now_utc

        await session.flush()
        return MessageResponse(message="Password has been successfully reset. You can now log in.")

    async def change_password(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        data: ChangePasswordRequest,
    ) -> MessageResponse:
        """Authenticated change password (or first-login mandatory password change)."""
        now_utc = datetime.now(timezone.utc)

        user = await self.user_service.get_by_id(session, user_id)
        if not user or user.status != UserStatus.ACTIVE:
            raise InvalidCredentialsError("User account not found or inactive.")

        # Verify current or temporary password
        if not verify_password(data.current_password, user.password_hash):
            raise InvalidCredentialsError("Current password is incorrect.")

        # Check SOC 2 password reuse history
        await self.check_password_history(session, user.id, data.new_password)

        new_hash = hash_password(data.new_password)
        user.password_hash = new_hash
        user.must_change_password = False
        user.temp_password_expires_at = None
        user.token_version += 1

        session.add(PasswordHistory(user_id=user.id, password_hash=new_hash))

        sec_stmt = select(UserSecurity).where(UserSecurity.user_id == user.id)
        sec_res = await session.execute(sec_stmt)
        security = sec_res.scalar_one_or_none()
        if security:
            security.password_changed_at = now_utc

        await session.flush()
        return MessageResponse(message="Password has been changed successfully.")

    async def logout(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        data: LogoutRequest,
    ) -> MessageResponse:
        """Revoke session refresh tokens."""
        now_utc = datetime.now(timezone.utc)

        if data.logout_all:
            revoke_stmt = (
                update(UserSession)
                .where(
                    UserSession.user_id == user_id,
                    UserSession.revoked_at.is_(None),
                )
                .values(revoked_at=now_utc)
            )
            await session.execute(revoke_stmt)
            # Bump token version so any in-flight access tokens are invalidated immediately
            user = await self.user_service.get_by_id(session, user_id)
            if user:
                user.token_version += 1
        elif data.refresh_token:
            token_hash = self._hash_refresh_token(data.refresh_token)
            revoke_stmt = (
                update(UserSession)
                .where(
                    UserSession.user_id == user_id,
                    UserSession.refresh_token_hash == token_hash,
                )
                .values(revoked_at=now_utc)
            )
            await session.execute(revoke_stmt)

        await session.flush()
        return MessageResponse(message="Logged out successfully.")
