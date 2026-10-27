"""Comprehensive test suite for Enterprise IAM, RBAC, Devices, Envelope Encryption, and Setup Seeding."""

from datetime import datetime, timezone
import unittest
from unittest.mock import AsyncMock, MagicMock
import uuid

from kernel.core.crypto import BlindIndex, FieldCipher
from kernel.setup.schemas import SetupBrandingInput, SetupRequest
from kernel.setup.services import SetupService
from kernel.tenancy import Tenant
from kernel.tenancy.models.settings import TenantSetting
from kernel.tenancy.models.tenant_member import TenantMember, TenantMemberStatus
from kernel.user.models.device import DeviceStatus, DeviceType, UserDevice
from kernel.user.models.rbac import Permission, Role, RolePermission, UserRole
from kernel.user.models.session import UserSession
from kernel.user.models.user import User, UserStatus
from kernel.user.schemas import AdminUserInput, UserCreate, UserDeviceCreate
from kernel.user.services import (
    DeviceNotFoundError,
    DeviceService,
    EmailAlreadyExistsError,
    RBACService,
    UserNotFoundError,
    UserService,
    hash_password,
    seed_default_permissions_and_roles,
    seed_default_tenant_settings,
    verify_password,
)


def mock_session_factory():
    """Mock async session simulating database collections."""
    session = MagicMock()
    added_items = []

    def mock_add(obj):
        if not getattr(obj, "id", None):
            obj.id = uuid.uuid4()
        if hasattr(obj, "created_at") and obj.created_at is None:
            obj.created_at = datetime.now(timezone.utc)
        if hasattr(obj, "updated_at") and obj.updated_at is None:
            obj.updated_at = datetime.now(timezone.utc)
        added_items.append(obj)

    session.add = MagicMock(side_effect=mock_add)
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    async def mock_execute(stmt):
        lookup = MagicMock()
        # Filter from added_items if applicable
        lookup.scalar_one_or_none.return_value = None
        lookup.scalars.return_value.all.return_value = []
        return lookup

    session.execute = AsyncMock(side_effect=mock_execute)

    async def mock_refresh(obj):
        pass

    session.refresh = AsyncMock(side_effect=mock_refresh)
    session._added_items = added_items
    return session


class TestFieldCipherAndBlindIndex(unittest.TestCase):
    def setUp(self) -> None:
        key_32 = b"01234567890123456789012345678901"
        self.cipher = FieldCipher(keyring={1: key_32}, current_version=1)
        self.blind_index = BlindIndex(pepper="test-pepper-secret")

    def test_envelope_encryption_roundtrip(self) -> None:
        email = "enterprise-admin@acme.com"
        envelope = self.cipher.encrypt(email)
        self.assertIsNotNone(envelope)
        self.assertTrue(envelope.startswith("v1:"))

        decrypted = self.cipher.decrypt(envelope)
        self.assertEqual(decrypted, email)

    def test_blind_index_deterministic_hash(self) -> None:
        email = "User.Name@Example.COM "
        hash1 = self.blind_index.compute(email)
        hash2 = self.blind_index.compute("user.name@example.com")
        self.assertEqual(hash1, hash2)
        self.assertEqual(len(hash1), 64)


class TestPasswordService(unittest.TestCase):
    def test_hash_and_verify(self) -> None:
        password = "EnterpriseSecurePass123!"
        hashed = hash_password(password)
        self.assertTrue(hashed.startswith("$2b$"))
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))


class TestUserService(unittest.IsolatedAsyncioTestCase):
    async def test_create_and_read_user(self) -> None:
        session = mock_session_factory()
        key_32 = b"01234567890123456789012345678901"
        cipher = FieldCipher(keyring={1: key_32}, current_version=1)
        blind_index = BlindIndex(pepper="test-pepper")
        service = UserService(cipher=cipher, blind_index=blind_index)

        input_data = UserCreate(
            first_name="Sai",
            last_name="Krishna",
            email="sai@innostes.com",
            password="StrongPassword123!",
            mobile="+919876543210",
        )
        user = await service.create_user(session, input_data, is_super_admin=True)

        self.assertEqual(user.first_name, "Sai")
        self.assertEqual(user.last_name, "Krishna")
        self.assertTrue(user.is_super_admin)
        self.assertTrue(user.email_encrypted.startswith("v1:"))
        self.assertNotEqual(user.email_encrypted, "sai@innostes.com")
        self.assertIsNotNone(user.mobile_encrypted)

        # Schema conversion decrypts fields
        read_schema = service.to_user_read(user)
        self.assertEqual(read_schema.email, "sai@innostes.com")
        self.assertEqual(read_schema.mobile, "+919876543210")
        self.assertEqual(read_schema.full_name, "Sai Krishna")


class TestDeviceService(unittest.IsolatedAsyncioTestCase):
    async def test_register_and_wipe_device(self) -> None:
        session = mock_session_factory()
        device_svc = DeviceService()
        user_id = uuid.uuid4()

        device_input = UserDeviceCreate(
            device_fingerprint="fp-enterprise-workstation-001",
            device_name="MacBook Pro 16",
            device_type=DeviceType.DESKTOP,
            os_name="macOS",
            os_version="15.1",
        )

        device = await device_svc.register_or_touch_device(
            session=session,
            user_id=user_id,
            device_data=device_input,
            ip_address="192.168.1.50",
        )

        self.assertEqual(device.device_name, "MacBook Pro 16")
        self.assertEqual(device.status, DeviceStatus.ACTIVE)
        self.assertIsNone(device.wipe_requested_at)

        # Mock query return for wipe
        async def mock_execute(stmt):
            res = MagicMock()
            res.scalar_one_or_none.return_value = device
            return res

        session.execute = AsyncMock(side_effect=mock_execute)

        wiped = await device_svc.wipe_device(session, device.id)
        self.assertEqual(wiped.status, DeviceStatus.WIPED)
        self.assertIsNotNone(wiped.wipe_requested_at)
        self.assertEqual(wiped.wipe_requested_at.tzinfo, timezone.utc)


class TestRBACService(unittest.IsolatedAsyncioTestCase):
    async def test_permissions_and_role_assignment(self) -> None:
        session = mock_session_factory()
        rbac = RBACService()

        perm = await rbac.get_or_create_permission(
            session=session,
            code="user.users.create",
            module="user",
            name="Create Users",
        )
        self.assertEqual(perm.code, "user.users.create")

        role = await rbac.get_or_create_role(
            session=session,
            code="admin",
            name="Administrator",
            is_system=True,
            hierarchy_level=50,
        )
        self.assertEqual(role.code, "admin")

        rp = await rbac.assign_permission_to_role(session, role.id, perm.id)
        self.assertEqual(rp.role_id, role.id)
        self.assertEqual(rp.permission_id, perm.id)

        user_id = uuid.uuid4()
        tenant_id = uuid.uuid4()

        # Tenant-scoped role assignment
        ur = await rbac.assign_role_to_user(session, user_id, role.id, tenant_id=tenant_id)
        self.assertEqual(ur.user_id, user_id)
        self.assertEqual(ur.tenant_id, tenant_id)

        # Global role assignment
        ur_global = await rbac.assign_role_to_user(session, user_id, role.id, tenant_id=None)
        self.assertIsNone(ur_global.tenant_id)


class TestSetupSeedingAndBranding(unittest.IsolatedAsyncioTestCase):
    async def test_seed_permissions_and_roles(self) -> None:
        session = mock_session_factory()
        roles = await seed_default_permissions_and_roles(session)

        self.assertIn("super_admin", roles)
        self.assertIn("owner", roles)
        self.assertIn("admin", roles)
        self.assertIn("member", roles)

    async def test_skip_branding_applies_fallback_defaults(self) -> None:
        session = mock_session_factory()
        tenant_id = uuid.uuid4()

        # Branding skipped (None provided)
        await seed_default_tenant_settings(
            session=session,
            tenant_id=tenant_id,
            organization_name="Acme Corp",
            branding_input=None,
        )

        added_settings = [o for o in session._added_items if isinstance(o, TenantSetting)]
        branding_setting = next(s for s in added_settings if s.namespace == "branding")
        self.assertEqual(branding_setting.config["theme"], "system")
        self.assertEqual(branding_setting.config["primary_color"], "#2563EB")
        self.assertIsNone(branding_setting.config["logo_url"])

    async def test_configure_branding_saves_custom_look_and_feel(self) -> None:
        session = mock_session_factory()
        tenant_id = uuid.uuid4()

        custom_branding = {
            "theme": "dark",
            "primary_color": "#059669",
            "logo_url": "https://cdn.example.com/logo.png",
        }

        await seed_default_tenant_settings(
            session=session,
            tenant_id=tenant_id,
            organization_name="Acme Corp",
            branding_input=custom_branding,
        )

        added_settings = [o for o in session._added_items if isinstance(o, TenantSetting)]
        branding_setting = next(s for s in added_settings if s.namespace == "branding")
        self.assertEqual(branding_setting.config["theme"], "dark")
        self.assertEqual(branding_setting.config["primary_color"], "#059669")
        self.assertEqual(branding_setting.config["logo_url"], "https://cdn.example.com/logo.png")
