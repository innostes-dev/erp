"""Login, token refresh, logout, password flows and the current user's profile."""

from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import string
from urllib.parse import quote
import uuid

import jwt
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.errors import (
    AccountLockedError,
    AccountSuspendedError,
    DeviceWipedError,
    InvalidCredentialsError,
    InvalidTokenError,
    PasswordRecentlyUsedError,
    TemporaryPasswordExpiredError,
)
from kernel.auth.schemas import (
    AccessibleModuleSummary,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    ModuleRoleSummary,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
    TenantSummary,
    TokenResponse,
    UserProfileResponse,
)
from kernel.auth.services.email_service import EmailService, get_email_service
from kernel.core.config import get_settings
from kernel.core.crypto import BlindIndex
from kernel.core.security.jwt import create_access_token, decode_token
from kernel.user.models.device import DeviceStatus, UserDevice
from kernel.user.models.password_history import PasswordHistory
from kernel.user.models.rbac import Permission, Role
from kernel.user.models.security import UserSecurity
from kernel.user.models.session import UserSession
from kernel.user.models.user import User, UserStatus
from kernel.user.schemas import UserDeviceCreate
from kernel.user.services import DeviceService, RBACService, UserService, hash_password, verify_password

# Verified against when the account doesn't exist, so a wrong email takes as long as a wrong password.
DUMMY_BCRYPT_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lew.6K2f2D3z8S6mK"

ADMIN_ROLE_CODES = ("owner", "admin", "super_admin")
SCOPES_WIDEST_FIRST = ("ORGANIZATION", "DEPARTMENT", "TEAM", "OWN")

# Display names for modules in the /auth/me response; unknown modules get a generated name.
MODULE_TITLES = {
    "salesflow": ("SalesFlow CRM", "High-velocity pipelines, quote-to-cash & revenue forecasting."),
    "peopleops": ("PeopleOps HRMS", "Workforce directory, attendance & leave approvals."),
    "tracura": ("Tracura Telemetry", "Universal API telemetry, distributed tracing & request logging."),
    "ledgerflow": ("LedgerFlow Finance", "General ledger, multi-currency accounts & tax filing."),
    "docflow": ("DocFlow Documents", "Compliant document generation & e-signature pipelines."),
    "stockflow": ("StockFlow Inventory", "Real-time inventory, purchase orders & barcode tracking."),
    "hireflow": ("HireFlow Recruiting", "Candidate pipeline, applicant tracking & scorecards."),
    "sprintflow": ("SprintFlow Agile", "Agile sprint boards, backlog management & issue tracking."),
}


def generate_secure_temp_password(length: int = 16) -> str:
    """Random password with at least two upper, lower, digit and symbol characters."""
    groups = [string.ascii_uppercase, string.ascii_lowercase, string.digits, "!@#$%^&*()-_=+"]
    chars = [secrets.choice(group) for group in groups for _ in range(2)]
    chars += [secrets.choice("".join(groups)) for _ in range(length - len(chars))]
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


def _utc(value: datetime) -> datetime:
    """Treat naive datetimes from the database as UTC."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


class AuthService:
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

    # ---- login, refresh, logout ----------------------------------------

    async def login(
        self,
        session: AsyncSession,
        data: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        now = datetime.now(timezone.utc)
        user = await self.user_service.get_by_email(session, data.email)
        if not user:
            verify_password(data.password, DUMMY_BCRYPT_HASH)
            raise InvalidCredentialsError()

        self._ensure_can_sign_in(user, now)
        await self._check_password(session, user, data.password, now)
        if user.must_change_password and user.temp_password_expires_at and _utc(user.temp_password_expires_at) < now:
            raise TemporaryPasswordExpiredError()

        user.failed_login_attempts = 0
        user.blocked_until = None

        device = await self.device_service.register_or_touch_device(
            session=session,
            user_id=user.id,
            device_data=UserDeviceCreate(
                device_fingerprint=data.device_fingerprint,
                device_name=data.device_name or "Web Client",
                device_type=data.device_type,
            ),
            ip_address=ip_address,
        )
        if device.status == DeviceStatus.WIPED:
            raise DeviceWipedError()

        security = await self._security(session, user.id)
        if security:
            security.last_login_at = now
            security.last_login_ip = ip_address

        access_token = self._access_token(user)
        refresh_token = await self._open_session(session, user.id, device.id, ip_address, user_agent, now)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=get_settings().access_token_expire_minutes * 60,
            must_change_password=bool(user.must_change_password),
            user=self.user_service.to_user_read(user),
        )

    async def refresh_token(
        self,
        session: AsyncSession,
        data: RefreshTokenRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> RefreshTokenResponse:
        """Swap a refresh token for a new pair. Each refresh token works once."""
        now = datetime.now(timezone.utc)
        stmt = select(UserSession).where(UserSession.refresh_token_hash == self._hash_refresh_token(data.refresh_token))
        user_session = (await session.execute(stmt)).scalar_one_or_none()
        if not user_session:
            raise InvalidTokenError("Invalid refresh token")

        if user_session.revoked_at is not None:
            # A used token came back: assume it was stolen and end every session of this user.
            await self._revoke_all_sessions(session, user_session.user_id, now)
            await session.flush()
            raise InvalidTokenError("Refresh token was previously revoked. All active sessions invalidated.")

        if _utc(user_session.expires_at) < now:
            user_session.revoked_at = now
            await session.flush()
            raise InvalidTokenError("Refresh token expired")

        user = await self.user_service.get_by_id(session, user_session.user_id)
        if not user or user.status != UserStatus.ACTIVE or user.is_blocked:
            user_session.revoked_at = now
            await session.flush()
            raise InvalidTokenError("User account inactive or locked")

        if user_session.device_id:
            device = (
                await session.execute(select(UserDevice).where(UserDevice.id == user_session.device_id))
            ).scalar_one_or_none()
            if device and device.status == DeviceStatus.WIPED:
                raise DeviceWipedError()

        user_session.revoked_at = now
        refresh_token = await self._open_session(session, user.id, user_session.device_id, ip_address, user_agent, now)

        return RefreshTokenResponse(
            access_token=self._access_token(user),
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=get_settings().access_token_expire_minutes * 60,
        )

    async def logout(self, session: AsyncSession, user_id: uuid.UUID, data: LogoutRequest) -> MessageResponse:
        now = datetime.now(timezone.utc)
        if data.logout_all:
            await self._revoke_all_sessions(session, user_id, now)
            user = await self.user_service.get_by_id(session, user_id)
            if user:
                user.token_version += 1  # also kills access tokens that are still valid
        elif data.refresh_token:
            await session.execute(
                update(UserSession)
                .where(
                    UserSession.user_id == user_id,
                    UserSession.refresh_token_hash == self._hash_refresh_token(data.refresh_token),
                )
                .values(revoked_at=now)
            )
        await session.flush()
        return MessageResponse(message="Logged out successfully.")

    # ---- passwords ------------------------------------------------------

    async def forgot_password(self, session: AsyncSession, data: ForgotPasswordRequest) -> ForgotPasswordResponse:
        """Email a temporary password and a reset link. Same response whether or not the account exists."""
        settings = get_settings()
        now = datetime.now(timezone.utc)
        user = await self.user_service.get_by_email(session, data.email)
        if not user or user.status != UserStatus.ACTIVE:
            verify_password("dummy-password", DUMMY_BCRYPT_HASH)
            return ForgotPasswordResponse()

        temp_password = generate_secure_temp_password(16)
        await self.user_service.credentials.set_password_hash(session, user, hash_password(temp_password))
        user.must_change_password = True
        user.temp_password_expires_at = now + timedelta(hours=settings.temp_password_expire_hours)
        user.token_version += 1
        await self._revoke_all_sessions(session, user.id, now)

        email = self.user_service.decrypt_email(user)
        reset_link = (
            f"{settings.frontend_url}/reset-password"
            f"?token={self.create_password_reset_token(user)}&email={quote(email)}"
        )
        await self.email_service.send_password_reset_email(
            recipient=email,
            recipient_name=user.full_name,
            temp_password=temp_password,
            reset_link=reset_link,
            temp_password_hours=settings.temp_password_expire_hours,
            reset_link_minutes=settings.password_reset_token_expire_minutes,
        )
        await session.flush()
        return ForgotPasswordResponse()

    async def reset_password_with_token(self, session: AsyncSession, data: ResetPasswordRequest) -> MessageResponse:
        try:
            payload = decode_token(data.token)
        except Exception:
            raise InvalidTokenError("Password reset link is invalid or has expired.")
        if payload.get("type") != "password_reset":
            raise InvalidTokenError("Invalid token type")
        if not payload.get("sub"):
            raise InvalidTokenError("Invalid subject claim")

        user = await self.user_service.get_by_id(session, uuid.UUID(payload["sub"]))
        if not user or user.status != UserStatus.ACTIVE:
            raise InvalidTokenError("User account not found or inactive")
        # The link is single-use: setting a password bumps token_version.
        if user.token_version != payload.get("token_version"):
            raise InvalidTokenError("This password reset link has already been used.")

        await self._set_new_password(session, user, data.new_password)
        await session.flush()
        return MessageResponse(message="Password has been successfully reset. You can now log in.")

    async def change_password(
        self, session: AsyncSession, user_id: uuid.UUID, data: ChangePasswordRequest
    ) -> MessageResponse:
        user = await self.user_service.get_by_id(session, user_id)
        if not user or user.status != UserStatus.ACTIVE:
            raise InvalidCredentialsError("User account not found or inactive.")

        current_hash = await self.user_service.credentials.get_password_hash(session, user)
        if not current_hash or not verify_password(data.current_password, current_hash):
            raise InvalidCredentialsError("Current password is incorrect.")

        await self._set_new_password(session, user, data.new_password)
        await session.flush()
        return MessageResponse(message="Password has been changed successfully.")

    def create_password_reset_token(self, user: User) -> str:
        settings = get_settings()
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user.id),
            "type": "password_reset",
            "token_version": user.token_version,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=settings.password_reset_token_expire_minutes)).timestamp()),
        }
        return jwt.encode(payload, settings.jwt_secret_key.get_secret_value(), algorithm=settings.jwt_algorithm)

    async def check_password_history(
        self, session: AsyncSession, user_id: uuid.UUID, new_password: str, limit: int = 5
    ) -> None:
        """Reject a password that matches one of the user's last `limit` passwords."""
        stmt = (
            select(PasswordHistory)
            .where(PasswordHistory.user_id == user_id)
            .order_by(PasswordHistory.created_at.desc())
            .limit(limit)
        )
        for old in (await session.execute(stmt)).scalars().all():
            if verify_password(new_password, old.password_hash):
                raise PasswordRecentlyUsedError()

    # ---- profile (/auth/me) ---------------------------------------------

    async def get_user_profile(
        self, session: AsyncSession, user: User, tenant_id: uuid.UUID | None = None
    ) -> UserProfileResponse:
        """The user plus the tenants they can open and the modules they can use in the active tenant."""
        user_fields = self.user_service.to_user_read(user).model_dump()
        tenants = await self._accessible_tenants(session, user)
        active = next((t for t in tenants if t.id == tenant_id), tenants[0] if tenants else None)
        if active is None:
            return UserProfileResponse(**user_fields, active_tenant=None, accessible_tenants=[], accessible_modules=[])

        return UserProfileResponse(
            **user_fields,
            active_tenant=active,
            accessible_tenants=tenants,
            accessible_modules=await self._accessible_modules(session, user, active.id),
        )

    async def _accessible_tenants(self, session: AsyncSession, user: User) -> list[TenantSummary]:
        # Imported here because kernel.tenancy imports kernel.auth.
        from kernel.tenancy.models import Tenant, TenantMember, TenantMemberStatus

        stmt = select(Tenant).where(Tenant.deleted_at.is_(None)).order_by(Tenant.created_at.asc())
        if not user.is_super_admin:
            stmt = stmt.join(TenantMember, TenantMember.tenant_id == Tenant.id).where(
                TenantMember.user_id == user.id,
                TenantMember.status == TenantMemberStatus.ACTIVE,
            )
        tenants = (await session.execute(stmt)).scalars().all()
        return [TenantSummary(id=t.id, name=t.name, slug=t.slug) for t in tenants]

    async def _accessible_modules(
        self, session: AsyncSession, user: User, tenant_id: uuid.UUID
    ) -> list[AccessibleModuleSummary]:
        """Modules switched on for the tenant that this user is entitled to (admins get all of them)."""
        from kernel.tenancy.models import TenantModule

        rbac = RBACService()
        active_stmt = select(TenantModule.module_id).where(
            TenantModule.tenant_id == tenant_id,
            TenantModule.is_active.is_(True),
            TenantModule.deleted_at.is_(None),
        )
        active_modules = set((await session.execute(active_stmt)).scalars().all())
        roles = await rbac.get_user_roles(session, user.id, tenant_id)
        permissions = await rbac.get_user_permissions(session, user.id, tenant_id)
        is_admin = user.is_super_admin or any(r.code in ADMIN_ROLE_CODES for r in roles)

        if is_admin:
            entitled = active_modules
        else:
            grants = set(await rbac.get_user_module_grants(session, user.id, tenant_id))
            entitled = grants | {r.module_code for r in roles if r.module_code}

        return [
            await self._module_summary(session, code, user, roles, permissions, is_admin)
            for code in sorted(active_modules & entitled)
        ]

    async def _module_summary(
        self,
        session: AsyncSession,
        code: str,
        user: User,
        roles: list[Role],
        permissions: list[dict],
        is_admin: bool,
    ) -> AccessibleModuleSummary:
        title, description = MODULE_TITLES.get(code, (code.capitalize(), f"{code.capitalize()} business module."))

        module_perms = [p for p in permissions if p.get("module") == code]
        codes = [p["code"] for p in module_perms]
        if is_admin and not codes:
            all_codes = await session.execute(select(Permission.code).where(Permission.module == code))
            codes = list(all_codes.scalars().all())

        if is_admin:
            scope = "ORGANIZATION"
        else:
            granted = {p.get("scope", "OWN") for p in module_perms}
            scope = next((s for s in SCOPES_WIDEST_FIRST if s in granted), "OWN")

        return AccessibleModuleSummary(
            id=code,
            code=code,
            name=title,
            description=description,
            role=self._module_role(code, user, roles),
            data_scope=scope,
            permissions=codes,
        )

    @staticmethod
    def _module_role(code: str, user: User, roles: list[Role]) -> ModuleRoleSummary:
        """The user's role in a module: a module role if they have one, otherwise their tenant-wide role."""
        module_role = next((r for r in roles if r.module_code == code), None)
        if module_role:
            return ModuleRoleSummary(
                code=module_role.code, name=module_role.name, hierarchy_level=module_role.hierarchy_level
            )
        if user.is_super_admin:
            return ModuleRoleSummary(code="super_admin", name="Super Administrator", hierarchy_level=100)
        if any(r.code == "owner" for r in roles):
            return ModuleRoleSummary(code="owner", name="Organization Owner", hierarchy_level=80)
        if any(r.code == "admin" for r in roles):
            return ModuleRoleSummary(code="admin", name="Administrator", hierarchy_level=50)
        return ModuleRoleSummary(code="member", name="Member", hierarchy_level=10)

    # ---- helpers ----------------------------------------------------------

    @staticmethod
    def _ensure_can_sign_in(user: User, now: datetime) -> None:
        if user.is_blocked:
            if user.status == UserStatus.SUSPENDED:
                raise AccountSuspendedError()
            retry_after = max(1, int((_utc(user.blocked_until) - now).total_seconds())) if user.blocked_until else 900
            raise AccountLockedError(retry_after=retry_after)
        if user.status != UserStatus.ACTIVE:
            raise AccountSuspendedError()

    async def _check_password(self, session: AsyncSession, user: User, password: str, now: datetime) -> None:
        """Verify the password; count a failure and lock the account at the limit."""
        password_hash = await self.user_service.credentials.get_password_hash(session, user)
        # Always run one bcrypt check (dummy hash if the user has no password) so timing stays the same.
        if verify_password(password, password_hash or DUMMY_BCRYPT_HASH) and password_hash is not None:
            return

        settings = get_settings()
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= settings.max_failed_login_attempts:
            user.blocked_until = now + timedelta(minutes=settings.account_lockout_minutes)
        await session.flush()
        raise InvalidCredentialsError()

    async def _set_new_password(self, session: AsyncSession, user: User, new_password: str) -> None:
        """Store a new password and invalidate every token issued before it."""
        await self.check_password_history(session, user.id, new_password)
        new_hash = hash_password(new_password)
        await self.user_service.credentials.set_password_hash(session, user, new_hash, actor_id=user.id)
        user.must_change_password = False
        user.temp_password_expires_at = None
        user.token_version += 1
        session.add(PasswordHistory(user_id=user.id, password_hash=new_hash))

        security = await self._security(session, user.id)
        if security:
            security.password_changed_at = datetime.now(timezone.utc)

    async def _open_session(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        device_id: uuid.UUID | None,
        ip_address: str | None,
        user_agent: str | None,
        now: datetime,
    ) -> str:
        """Create a session row and return its raw refresh token (only the hash is stored)."""
        refresh_token = secrets.token_urlsafe(48)
        session.add(
            UserSession(
                user_id=user_id,
                device_id=device_id,
                refresh_token_hash=self._hash_refresh_token(refresh_token),
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=now + timedelta(days=get_settings().refresh_token_expire_days),
            )
        )
        await session.flush()
        return refresh_token

    def _access_token(self, user: User) -> str:
        return create_access_token({
            "sub": str(user.id),
            "email": self.user_service.decrypt_email(user),
            "token_version": user.token_version,
            "is_super_admin": user.is_super_admin,
        })

    @staticmethod
    async def _revoke_all_sessions(session: AsyncSession, user_id: uuid.UUID, now: datetime) -> None:
        await session.execute(
            update(UserSession)
            .where(UserSession.user_id == user_id, UserSession.revoked_at.is_(None))
            .values(revoked_at=now)
        )

    @staticmethod
    async def _security(session: AsyncSession, user_id: uuid.UUID) -> UserSecurity | None:
        stmt = select(UserSecurity).where(UserSecurity.user_id == user_id)
        return (await session.execute(stmt)).scalar_one_or_none()

    @staticmethod
    def _hash_refresh_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()
