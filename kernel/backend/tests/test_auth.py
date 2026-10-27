"""Comprehensive test suite for Enterprise Auth: Login, Sessions, Device Trust, Forgot Password, and SOC 2 History."""

from datetime import datetime, timedelta, timezone
import unittest
from unittest.mock import AsyncMock, MagicMock
import uuid

from kernel.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
)
from kernel.auth.services import (
    AccountLockedError,
    AccountSuspendedError,
    AuthService,
    DeviceWipedError,
    InMemoryEmailService,
    InvalidCredentialsError,
    InvalidTokenError,
    PasswordRecentlyUsedError,
    TemporaryPasswordExpiredError,
)
from kernel.core.config import get_settings
from kernel.core.crypto import BlindIndex, FieldCipher
from kernel.user.models.device import DeviceStatus, DeviceType, UserDevice
from kernel.user.models.password_history import PasswordHistory
from kernel.user.models.security import UserSecurity
from kernel.user.models.session import UserSession
from kernel.user.models.user import User, UserStatus
from kernel.user.schemas import UserCreate
from kernel.user.services import DeviceService, UserService, hash_password, verify_password


def mock_session_factory():
    """Mock async session simulating database operations for auth tests."""
    session = MagicMock()
    items = []

    def mock_add(obj):
        if not getattr(obj, "id", None):
            obj.id = uuid.uuid4()
        if hasattr(obj, "created_at") and obj.created_at is None:
            obj.created_at = datetime.now(timezone.utc)
        if hasattr(obj, "updated_at") and obj.updated_at is None:
            obj.updated_at = datetime.now(timezone.utc)
        items.append(obj)

    session.add = MagicMock(side_effect=mock_add)
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    async def mock_execute(stmt):
        lookup = MagicMock()
        lookup.scalar_one_or_none.return_value = None
        lookup.scalars.return_value.all.return_value = []
        return lookup

    session.execute = AsyncMock(side_effect=mock_execute)

    async def mock_refresh(obj):
        pass

    session.refresh = AsyncMock(side_effect=mock_refresh)
    session._items = items
    return session


class TestEnterpriseAuth(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        key_32 = b"01234567890123456789012345678901"
        self.cipher = FieldCipher(keyring={1: key_32}, current_version=1)
        self.blind_index = BlindIndex(pepper="test-pepper-secret")
        self.user_service = UserService(cipher=self.cipher, blind_index=self.blind_index)
        self.device_service = DeviceService()
        self.email_service = InMemoryEmailService()
        self.auth_service = AuthService(
            user_service=self.user_service,
            device_service=self.device_service,
            email_service=self.email_service,
            blind_index=self.blind_index,
        )

    async def create_test_user(
        self,
        session,
        email="employee@acme.com",
        password="InitialPassword123!",
        is_super_admin=False,
    ) -> User:
        user_input = UserCreate(
            first_name="Jane",
            last_name="Doe",
            email=email,
            password=password,
            is_super_admin=is_super_admin,
        )
        return await self.user_service.create_user(session, user_input, is_super_admin=is_super_admin)

    async def test_login_success_issues_jwt_and_session(self) -> None:
        session = mock_session_factory()
        user = await self.create_test_user(session, email="alice@acme.com", password="SecretPassword123!")

        # Mock user lookup returning created user
        async def mock_exec(stmt):
            res = MagicMock()
            res.scalar_one_or_none.return_value = user
            res.scalars.return_value.all.return_value = []
            return res

        session.execute = AsyncMock(side_effect=mock_exec)

        login_req = LoginRequest(
            email="alice@acme.com",
            password="SecretPassword123!",
            device_fingerprint="fp-macbook-pro-1",
            device_name="Work Laptop",
        )
        response = await self.auth_service.login(session, login_req, ip_address="10.0.0.1")

        self.assertIsNotNone(response.access_token)
        self.assertIsNotNone(response.refresh_token)
        self.assertEqual(response.token_type, "bearer")
        self.assertFalse(response.must_change_password)
        self.assertEqual(response.user.email, "alice@acme.com")

        # Session was persisted
        sessions = [o for o in session._items if isinstance(o, UserSession)]
        self.assertEqual(len(sessions), 1)
        self.assertEqual(sessions[0].user_id, user.id)

    async def test_login_invalid_password_tracks_failures(self) -> None:
        session = mock_session_factory()
        user = await self.create_test_user(session, email="bob@acme.com", password="CorrectPassword123!")

        async def mock_exec(stmt):
            res = MagicMock()
            res.scalar_one_or_none.return_value = user
            return res

        session.execute = AsyncMock(side_effect=mock_exec)

        login_req = LoginRequest(
            email="bob@acme.com",
            password="WrongPassword!",
        )

        with self.assertRaises(InvalidCredentialsError):
            await self.auth_service.login(session, login_req)

        self.assertEqual(user.failed_login_attempts, 1)

    async def test_login_account_lockout_after_max_failed_attempts(self) -> None:
        session = mock_session_factory()
        user = await self.create_test_user(session, email="charlie@acme.com", password="RealPassword123!")
        user.failed_login_attempts = 4

        async def mock_exec(stmt):
            res = MagicMock()
            res.scalar_one_or_none.return_value = user
            return res

        session.execute = AsyncMock(side_effect=mock_exec)

        login_req = LoginRequest(email="charlie@acme.com", password="WrongPassword!")

        # 5th failed attempt causes lockout
        with self.assertRaises(InvalidCredentialsError):
            await self.auth_service.login(session, login_req)

        self.assertEqual(user.failed_login_attempts, 5)
        self.assertIsNotNone(user.blocked_until)

        # 6th attempt is blocked with AccountLockedError
        with self.assertRaises(AccountLockedError):
            await self.auth_service.login(session, login_req)

    async def test_login_temporary_password_expired(self) -> None:
        session = mock_session_factory()
        user = await self.create_test_user(session, email="david@acme.com", password="TempPass123!")
        user.must_change_password = True
        user.temp_password_expires_at = datetime.now(timezone.utc) - timedelta(hours=1)

        async def mock_exec(stmt):
            res = MagicMock()
            res.scalar_one_or_none.return_value = user
            return res

        session.execute = AsyncMock(side_effect=mock_exec)

        login_req = LoginRequest(email="david@acme.com", password="TempPass123!")

        with self.assertRaises(TemporaryPasswordExpiredError):
            await self.auth_service.login(session, login_req)

    async def test_forgot_password_anti_enumeration(self) -> None:
        session = mock_session_factory()

        # Non-existent email returns same generic message
        req = ForgotPasswordRequest(email="unknown-user@nonexistent.com")
        res = await self.auth_service.forgot_password(session, req)
        self.assertIn("If an account exists", res.message)
        self.assertEqual(len(self.email_service.sent_emails), 0)

    async def test_forgot_password_dispatches_email_with_temp_password_and_link(self) -> None:
        session = mock_session_factory()
        user = await self.create_test_user(session, email="elena@acme.com", password="OldPassword123!")

        async def mock_exec(stmt):
            res = MagicMock()
            res.scalar_one_or_none.return_value = user
            return res

        session.execute = AsyncMock(side_effect=mock_exec)

        req = ForgotPasswordRequest(email="elena@acme.com")
        res = await self.auth_service.forgot_password(session, req)

        self.assertIn("If an account exists", res.message)
        self.assertEqual(len(self.email_service.sent_emails), 1)

        email = self.email_service.sent_emails[0]
        self.assertEqual(email.recipient, "elena@acme.com")
        self.assertIn("TEMPORARY PASSWORD", email.text_body)
        self.assertIn("reset-password?token=", email.text_body)

        # User is flagged for mandatory password change
        self.assertTrue(user.must_change_password)
        self.assertIsNotNone(user.temp_password_expires_at)

    async def test_reset_password_with_token_and_soc2_history(self) -> None:
        session = mock_session_factory()
        user = await self.create_test_user(session, email="frank@acme.com", password="InitialPassword123!")

        # Generate reset token for frank
        token = self.auth_service.create_password_reset_token(user)

        # Existing password history: initial password
        old_hist = PasswordHistory(user_id=user.id, password_hash=user.password_hash)

        async def mock_exec(stmt):
            res = MagicMock()
            res.scalar_one_or_none.return_value = user
            res.scalars.return_value.all.return_value = [old_hist]
            return res

        session.execute = AsyncMock(side_effect=mock_exec)

        # Attempting to reuse old password fails (SOC 2)
        with self.assertRaises(PasswordRecentlyUsedError):
            await self.auth_service.reset_password_with_token(
                session,
                ResetPasswordRequest(token=token, new_password="InitialPassword123!"),
            )

        # Resetting with novel password succeeds
        reset_res = await self.auth_service.reset_password_with_token(
            session,
            ResetPasswordRequest(token=token, new_password="BrandNewSecurePassword123!"),
        )
        self.assertIn("successfully reset", reset_res.message)
        self.assertFalse(user.must_change_password)
        self.assertIsNone(user.temp_password_expires_at)

    async def test_refresh_token_rotation(self) -> None:
        session = mock_session_factory()
        user = await self.create_test_user(session, email="grace@acme.com", password="MyPassword123!")

        # Create active session
        raw_refresh = "test-raw-refresh-token-12345"
        token_hash = self.auth_service._hash_refresh_token(raw_refresh)
        user_session = UserSession(
            user_id=user.id,
            refresh_token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )

        async def mock_exec(stmt):
            res = MagicMock()
            sql_str = str(stmt).lower()
            if "from users" in sql_str:
                res.scalar_one_or_none.return_value = user
            else:
                res.scalar_one_or_none.return_value = user_session
            return res

        session.execute = AsyncMock(side_effect=mock_exec)

        # Refresh
        req = RefreshTokenRequest(refresh_token=raw_refresh)
        res = await self.auth_service.refresh_token(session, req)

        self.assertIsNotNone(res.access_token)
        self.assertIsNotNone(res.refresh_token)
        self.assertNotEqual(res.refresh_token, raw_refresh)
        self.assertIsNotNone(user_session.revoked_at)
