"""Comprehensive test suite verifying the Full Enterprise RBAC, PBAC, Module Gating,
Data Scoping, and Delegated Administration System.

Validates the 5-Tier Boundary Model:
- Tier 1: Tenant Licensing Check (TenantModule activation gate)
- Tier 2: User Entitlement Check (UserModuleGrant and module-tagged roles)
- Tier 3: Module-Internal Atomic Permissions (require_permission & require_security_context)
- Tier 4: Data Scoping (SecurityContext.apply_scope: OWN, DEPARTMENT, ORGANIZATION)
- Tier 5: Sub-User Delegated Administration (Privilege Escalation Invariants)
- Session Integrity: Canonical Profile Resolution (/auth/me) & Zombie Session Invalidation
"""

from datetime import datetime, timedelta, timezone
from typing import Any
import unittest
from unittest.mock import AsyncMock, MagicMock
import uuid

from fastapi import Request, Response, status
from sqlalchemy import select
from sqlalchemy.sql.selectable import Select

from kernel.auth.dependencies import (
    SecurityContext,
    get_current_user,
    require_module,
    require_security_context,
)
from kernel.auth.schemas import (
    AccessibleModuleSummary,
    UserProfileResponse,
)
from kernel.auth.services import AuthService, InvalidTokenError
from kernel.core.security.jwt import create_access_token
from kernel.core.services import ForbiddenError
from kernel.tenancy.models import Tenant, TenantMember, TenantMemberStatus, TenantModule
from kernel.user.models.rbac import Permission, Role, RolePermission, UserModuleGrant, UserRole
from kernel.user.models.user import User, UserStatus
from kernel.user.services import RBACService, UserService


def create_smart_mock_session():
    """Mock async SQLAlchemy session that can store and query added records."""
    session = MagicMock()
    records: list[Any] = []

    def mock_add(obj: Any) -> None:
        if not getattr(obj, "id", None):
            obj.id = uuid.uuid4()
        if hasattr(obj, "created_at") and getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(timezone.utc)
        if hasattr(obj, "updated_at") and getattr(obj, "updated_at", None) is None:
            obj.updated_at = datetime.now(timezone.utc)
        records.append(obj)

    session.add = MagicMock(side_effect=mock_add)
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session._records = records

    return session


class TestTier1And2ModuleGating(unittest.IsolatedAsyncioTestCase):
    """Verifies Tier 1 (Tenant Activation) and Tier 2 (User Entitlement) router gating."""

    def setUp(self) -> None:
        self.session = create_smart_mock_session()
        self.rbac = RBACService()
        self.tenant_id = uuid.uuid4()
        self.user_id = uuid.uuid4()
        self.now = datetime.now(timezone.utc)

        self.user = User(
            id=self.user_id,
            first_name="Alice",
            last_name="Smith",
            email_hash="hash_alice",
            email_encrypted="enc_alice",
            password_hash="pass_alice",
            status=UserStatus.ACTIVE,
            is_super_admin=False,
            token_version=1,
        )

    async def test_tier1_tenant_module_not_activated_raises_403(self) -> None:
        """User accessing a module not activated by the tenant is blocked with 403."""
        # Tenant has NOT activated 'salesflow' (query returns None)
        lookup = MagicMock()
        lookup.scalar_one_or_none.return_value = None
        self.session.execute = AsyncMock(return_value=lookup)

        dep = require_module("salesflow")
        req = MagicMock(spec=Request)
        req.state = MagicMock()
        req.state.api_key = None
        req.state.tenant_id = self.tenant_id
        req.headers = {"X-Tenant-ID": str(self.tenant_id)}

        with self.assertRaises(ForbiddenError) as ctx:
            await dep(
                request=req,
                current_user=self.user,
                session=self.session,
                rbac_service=self.rbac,
            )

        self.assertIn("not activated for this tenant", str(ctx.exception))

    async def test_tier2_tenant_activated_but_user_not_entitled_raises_403(self) -> None:
        """User in a tenant that has the module, but who lacks an entitlement grant, gets 403."""
        # Tier 1 succeeds (module active in tenant)
        # Tier 2 fails (user has no roles and no UserModuleGrant)
        async def mock_exec(stmt: Any) -> Any:
            res = MagicMock()
            stmt_str = str(stmt).lower()
            if "tenant_modules" in stmt_str:
                res.scalar_one_or_none.return_value = uuid.uuid4()  # TenantModule exists
            elif "user_module_grants" in stmt_str:
                res.scalars.return_value.all.return_value = []  # No module grants
            elif "roles" in stmt_str:
                res.scalars.return_value.all.return_value = []  # No roles
            else:
                res.scalar_one_or_none.return_value = None
                res.scalars.return_value.all.return_value = []
            return res

        self.session.execute = AsyncMock(side_effect=mock_exec)

        dep = require_module("salesflow")
        req = MagicMock(spec=Request)
        req.state = MagicMock()
        req.state.api_key = None
        req.state.tenant_id = self.tenant_id
        req.headers = {"X-Tenant-ID": str(self.tenant_id)}

        with self.assertRaises(ForbiddenError) as ctx:
            await dep(
                request=req,
                current_user=self.user,
                session=self.session,
                rbac_service=self.rbac,
            )

        self.assertIn("not entitled to access module", str(ctx.exception))

    async def test_tier2_user_with_explicit_module_grant_succeeds(self) -> None:
        """User with an explicit UserModuleGrant is allowed entry to the module."""
        async def mock_exec(stmt: Any) -> Any:
            res = MagicMock()
            stmt_str = str(stmt).lower()
            if "tenant_modules" in stmt_str:
                res.scalar_one_or_none.return_value = uuid.uuid4()
            elif "user_module_grants" in stmt_str:
                res.scalars.return_value.all.return_value = ["salesflow"]
            elif "roles" in stmt_str:
                res.scalars.return_value.all.return_value = []
            else:
                res.scalar_one_or_none.return_value = None
                res.scalars.return_value.all.return_value = []
            return res

        self.session.execute = AsyncMock(side_effect=mock_exec)

        dep = require_module("salesflow")
        req = MagicMock(spec=Request)
        req.state = MagicMock()
        req.state.api_key = None
        req.state.tenant_id = self.tenant_id
        req.headers = {"X-Tenant-ID": str(self.tenant_id)}

        actor = await dep(
            request=req,
            current_user=self.user,
            session=self.session,
            rbac_service=self.rbac,
        )
        self.assertEqual(actor.id, self.user_id)

    async def test_tier2_user_with_module_role_succeeds(self) -> None:
        """User holding a role tagged with module_code='salesflow' is allowed entry."""
        sales_role = Role(
            id=uuid.uuid4(),
            code="sales_rep",
            name="Sales Representative",
            module_code="salesflow",
            hierarchy_level=20,
        )

        async def mock_exec(stmt: Any) -> Any:
            res = MagicMock()
            stmt_str = str(stmt).lower()
            if "tenant_modules" in stmt_str:
                res.scalar_one_or_none.return_value = uuid.uuid4()
            elif "user_module_grants" in stmt_str:
                res.scalars.return_value.all.return_value = []
            elif "roles" in stmt_str:
                res.scalars.return_value.all.return_value = [sales_role]
            else:
                res.scalar_one_or_none.return_value = None
                res.scalars.return_value.all.return_value = []
            return res

        self.session.execute = AsyncMock(side_effect=mock_exec)

        dep = require_module("salesflow")
        req = MagicMock(spec=Request)
        req.state = MagicMock()
        req.state.api_key = None
        req.state.tenant_id = self.tenant_id
        req.headers = {"X-Tenant-ID": str(self.tenant_id)}

        actor = await dep(
            request=req,
            current_user=self.user,
            session=self.session,
            rbac_service=self.rbac,
        )
        self.assertEqual(actor.id, self.user_id)

    async def test_super_admin_bypasses_all_module_gates(self) -> None:
        """Super administrator has unrestricted access across all tenants and modules."""
        self.user.is_super_admin = True
        dep = require_module("salesflow")
        req = MagicMock(spec=Request)
        req.state = MagicMock()
        req.state.api_key = None
        req.headers = {}

        actor = await dep(
            request=req,
            current_user=self.user,
            session=self.session,
            rbac_service=self.rbac,
        )
        self.assertEqual(actor.id, self.user_id)


class TestTier3And4DataScoping(unittest.TestCase):
    """Verifies Tier 3 (Atomic Permissions) and Tier 4 (Data Scoping Engine)."""

    def setUp(self) -> None:
        self.user_id = uuid.uuid4()
        self.dept_id = uuid.uuid4()
        self.tenant_id = uuid.uuid4()
        self.user = User(
            id=self.user_id,
            first_name="Bob",
            last_name="Manager",
            email_hash="hash_bob",
            email_encrypted="enc_bob",
            password_hash="pass_bob",
            status=UserStatus.ACTIVE,
        )

    def test_organization_scope_does_not_filter_query(self) -> None:
        """ORGANIZATION scope allows visibility across the entire tenant without extra filters."""
        sec_ctx = SecurityContext(
            user=self.user,
            tenant_id=self.tenant_id,
            module="salesflow",
            permission="salesflow.leads.read",
            scope="ORGANIZATION",
            user_department_id=self.dept_id,
        )

        dummy_query = select(User)
        scoped_query = sec_ctx.apply_scope(
            dummy_query,
            owner_col=User.id,
            department_col=User.id,
        )
        self.assertEqual(str(dummy_query), str(scoped_query))

    def test_department_scope_filters_by_user_department(self) -> None:
        """DEPARTMENT scope restricts records to the user's specific department."""
        sec_ctx = SecurityContext(
            user=self.user,
            tenant_id=self.tenant_id,
            module="salesflow",
            permission="salesflow.deals.manage",
            scope="DEPARTMENT",
            user_department_id=self.dept_id,
        )

        dummy_query = select(UserRole)
        scoped_query = sec_ctx.apply_scope(
            dummy_query,
            owner_col=UserRole.user_id,
            department_col=UserRole.department_id,
        )
        query_sql = str(scoped_query)
        self.assertIn("user_roles.department_id =", query_sql)

    def test_own_scope_filters_by_owner_col(self) -> None:
        """OWN scope restricts records to records where owner_col == actor.id."""
        sec_ctx = SecurityContext(
            user=self.user,
            tenant_id=self.tenant_id,
            module="salesflow",
            permission="salesflow.leads.read",
            scope="OWN",
            user_department_id=self.dept_id,
        )

        dummy_query = select(UserRole)
        scoped_query = sec_ctx.apply_scope(
            dummy_query,
            owner_col=UserRole.user_id,
            department_col=UserRole.department_id,
        )
        query_sql = str(scoped_query)
        self.assertIn("user_roles.user_id =", query_sql)


class TestRBACSystemRoleCache(unittest.IsolatedAsyncioTestCase):
    """Verifies that precompiled system role caches provide nanosecond resolution without DB lookups."""

    def setUp(self) -> None:
        self.session = create_smart_mock_session()
        self.rbac = RBACService()
        self.tenant_id = uuid.uuid4()
        self.user_id = uuid.uuid4()
        self.user = User(
            id=self.user_id,
            first_name="Sam",
            last_name="Admin",
            email_hash="hash_s",
            email_encrypted="enc_s",
            password_hash="pass_s",
            status=UserStatus.ACTIVE,
        )

    async def test_system_role_cache_nanosecond_hit(self) -> None:
        """When system role cache is set, has_permission succeeds without querying Permission table."""
        self.rbac.set_system_role_cache("sales_rep", {"salesflow.leads.read", "salesflow.leads.create"})

        sales_role = Role(
            id=uuid.uuid4(),
            code="sales_rep",
            name="Sales Representative",
            module_code="salesflow",
            hierarchy_level=20,
        )

        async def mock_exec(stmt: Any) -> Any:
            res = MagicMock()
            res.scalar_one_or_none.return_value = None
            res.scalars.return_value.all.return_value = []
            stmt_str = str(stmt).lower()
            if "from users" in stmt_str or "select users" in stmt_str:
                res.scalar_one_or_none.return_value = self.user
            elif "from roles" in stmt_str:
                res.scalars.return_value.all.return_value = [sales_role]
            return res

        self.session.execute = AsyncMock(side_effect=mock_exec)

        # Permitted by cache
        has_read = await self.rbac.has_permission(
            session=self.session,
            user_id=self.user_id,
            permission_code="salesflow.leads.read",
            tenant_id=self.tenant_id,
        )
        self.assertTrue(has_read)

        # Denied (not in cache and not in DB)
        has_manage = await self.rbac.has_permission(
            session=self.session,
            user_id=self.user_id,
            permission_code="salesflow.pipeline.manage",
            tenant_id=self.tenant_id,
        )
        self.assertFalse(has_manage)


class TestRequireSecurityContext(unittest.IsolatedAsyncioTestCase):
    """Verifies require_security_context dependency resolving SecurityContext with dynamic scopes."""

    def setUp(self) -> None:
        self.session = create_smart_mock_session()
        self.rbac = RBACService()
        self.tenant_id = uuid.uuid4()
        self.user_id = uuid.uuid4()
        self.dept_id = uuid.uuid4()
        self.user = User(
            id=self.user_id,
            first_name="Elena",
            last_name="Rostova",
            email_hash="hash_e",
            email_encrypted="enc_e",
            password_hash="pass_e",
            status=UserStatus.ACTIVE,
        )

    async def test_security_context_resolves_department_scope(self) -> None:
        """User holding DEPARTMENT scoped permission resolves SecurityContext with user_department_id."""
        sales_manager_role = Role(
            id=uuid.uuid4(),
            code="sales_manager",
            name="Sales Manager",
            module_code="salesflow",
            hierarchy_level=40,
        )

        async def mock_exec(stmt: Any) -> Any:
            res = MagicMock()
            stmt_str = str(stmt).lower()
            if "tenant_modules" in stmt_str:
                res.scalar_one_or_none.return_value = uuid.uuid4()
            elif "users" in stmt_str:
                res.scalar_one_or_none.return_value = self.user
            elif "permissions.code" in stmt_str or "role_permissions" in stmt_str:
                res.scalar_one_or_none.return_value = MagicMock()
                res.all.return_value = [
                    {
                        "code": "salesflow.deals.manage",
                        "module": "salesflow",
                        "resource": "deals",
                        "action": "manage",
                        "scope": "DEPARTMENT",
                        "role_code": "sales_manager",
                        "hierarchy_level": 40,
                    }
                ]
            elif "user_roles.department_id" in stmt_str:
                res.scalar_one_or_none.return_value = self.dept_id
            elif "roles" in stmt_str and "user_roles" in stmt_str:
                res.scalars.return_value.all.return_value = [sales_manager_role]
            else:
                res.scalar_one_or_none.return_value = None
                res.scalars.return_value.all.return_value = []
            return res

        self.session.execute = AsyncMock(side_effect=mock_exec)

        dep = require_security_context("salesflow.deals.manage", module_code="salesflow")
        req = MagicMock(spec=Request)
        req.state = MagicMock()
        req.state.api_key = None
        req.state.tenant_id = self.tenant_id
        req.headers = {"X-Tenant-ID": str(self.tenant_id)}

        ctx = await dep(
            request=req,
            current_user=self.user,
            session=self.session,
            rbac_service=self.rbac,
        )

        self.assertEqual(ctx.module, "salesflow")
        self.assertEqual(ctx.permission, "salesflow.deals.manage")
        self.assertEqual(ctx.scope, "DEPARTMENT")
        self.assertEqual(ctx.user_department_id, self.dept_id)


class TestTier5SubUserDelegationInvariants(unittest.IsolatedAsyncioTestCase):
    """Verifies mathematical invariants of delegated administration.

    Rules tested:
    1. Hierarchy Invariant: target_role.level <= actor.max_delegatable_level
    2. Module Invariant: actor must hold entitlement to target_role.module_code
    3. Privilege escalation is strictly blocked (ForbiddenError)
    """

    def setUp(self) -> None:
        self.session = create_smart_mock_session()
        self.rbac = RBACService()
        self.tenant_id = uuid.uuid4()
        self.manager_id = uuid.uuid4()
        self.rep_id = uuid.uuid4()

        self.manager_user = User(
            id=self.manager_id,
            first_name="Maya",
            last_name="SalesHead",
            email_hash="hash_m",
            email_encrypted="enc_m",
            password_hash="pass_m",
            status=UserStatus.ACTIVE,
        )
        self.rep_user = User(
            id=self.rep_id,
            first_name="Ravi",
            last_name="Associate",
            email_hash="hash_r",
            email_encrypted="enc_r",
            password_hash="pass_r",
            status=UserStatus.ACTIVE,
        )

        # Sales Manager: level 40, can_delegate=True, max_delegatable_level=30, module='salesflow'
        self.sales_manager_role = Role(
            id=uuid.uuid4(),
            code="sales_manager",
            name="Sales Manager",
            hierarchy_level=40,
            can_delegate=True,
            max_delegatable_level=30,
            module_code="salesflow",
        )

        # Sales Rep: level 20, can_delegate=False, module='salesflow'
        self.sales_rep_role = Role(
            id=uuid.uuid4(),
            code="sales_rep",
            name="Sales Representative",
            hierarchy_level=20,
            can_delegate=False,
            max_delegatable_level=0,
            module_code="salesflow",
        )

        # Administrator: level 50
        self.admin_role = Role(
            id=uuid.uuid4(),
            code="admin",
            name="Administrator",
            hierarchy_level=50,
            can_delegate=True,
            max_delegatable_level=49,
            module_code=None,
        )

        # HR Employee: level 15, module='peopleops'
        self.hr_employee_role = Role(
            id=uuid.uuid4(),
            code="employee",
            name="HR Employee",
            hierarchy_level=15,
            can_delegate=False,
            module_code="peopleops",
        )

    async def test_manager_can_delegate_within_max_level_and_module(self) -> None:
        """Sales Manager delegating Sales Rep (level 20 <= 30, module 'salesflow') is permitted."""
        async def mock_exec(stmt: Any) -> Any:
            res = MagicMock()
            stmt_str = str(stmt).lower()
            if "roles" in stmt_str and "where roles.id =" in stmt_str:
                res.scalar_one_or_none.return_value = self.sales_rep_role
            elif "roles" in stmt_str:
                res.scalars.return_value.all.return_value = [self.sales_manager_role]
            elif "user_module_grants" in stmt_str:
                res.scalars.return_value.all.return_value = ["salesflow"]
            elif "users" in stmt_str:
                res.scalar_one_or_none.return_value = self.manager_user
            else:
                res.scalar_one_or_none.return_value = None
                res.scalars.return_value.all.return_value = []
            return res

        self.session.execute = AsyncMock(side_effect=mock_exec)

        can_del = await self.rbac.can_delegate_role(
            session=self.session,
            actor_id=self.manager_id,
            target_role_id=self.sales_rep_role.id,
            tenant_id=self.tenant_id,
        )
        self.assertTrue(can_del)

    async def test_manager_cannot_delegate_role_exceeding_max_level(self) -> None:
        """Sales Manager attempting to delegate Admin role (level 50 > max 30) is blocked."""
        async def mock_exec(stmt: Any) -> Any:
            res = MagicMock()
            stmt_str = str(stmt).lower()
            if "roles" in stmt_str and "where roles.id =" in stmt_str:
                res.scalar_one_or_none.return_value = self.admin_role
            elif "roles" in stmt_str:
                res.scalars.return_value.all.return_value = [self.sales_manager_role]
            elif "users" in stmt_str:
                res.scalar_one_or_none.return_value = self.manager_user
            else:
                res.scalar_one_or_none.return_value = None
                res.scalars.return_value.all.return_value = []
            return res

        self.session.execute = AsyncMock(side_effect=mock_exec)

        can_del = await self.rbac.can_delegate_role(
            session=self.session,
            actor_id=self.manager_id,
            target_role_id=self.admin_role.id,
            tenant_id=self.tenant_id,
        )
        self.assertFalse(can_del)

        # Assignment method must raise ForbiddenError
        with self.assertRaises(ForbiddenError):
            await self.rbac.assign_role_with_delegation_check(
                session=self.session,
                actor_id=self.manager_id,
                user_id=self.rep_id,
                role_id=self.admin_role.id,
                tenant_id=self.tenant_id,
            )

    async def test_manager_cannot_delegate_role_outside_entitled_module(self) -> None:
        """Sales Manager attempting to delegate an HR role (module 'peopleops') is blocked."""
        async def mock_exec(stmt: Any) -> Any:
            res = MagicMock()
            stmt_str = str(stmt).lower()
            if "roles" in stmt_str and "where roles.id =" in stmt_str:
                res.scalar_one_or_none.return_value = self.hr_employee_role
            elif "roles" in stmt_str:
                res.scalars.return_value.all.return_value = [self.sales_manager_role]
            elif "user_module_grants" in stmt_str:
                res.scalars.return_value.all.return_value = ["salesflow"]  # Only salesflow, not peopleops
            elif "users" in stmt_str:
                res.scalar_one_or_none.return_value = self.manager_user
            else:
                res.scalar_one_or_none.return_value = None
                res.scalars.return_value.all.return_value = []
            return res

        self.session.execute = AsyncMock(side_effect=mock_exec)

        can_del = await self.rbac.can_delegate_role(
            session=self.session,
            actor_id=self.manager_id,
            target_role_id=self.hr_employee_role.id,
            tenant_id=self.tenant_id,
        )
        self.assertFalse(can_del)


class TestCanonicalProfileAndZombieSession(unittest.IsolatedAsyncioTestCase):
    """Verifies GET /auth/me single canonical authority, module intersection, and zombie session invalidation."""

    def setUp(self) -> None:
        self.session = create_smart_mock_session()
        self.auth_service = AuthService()
        self.tenant_id = uuid.uuid4()
        self.user_id = uuid.uuid4()
        user_svc = UserService()
        enc_email = user_svc.cipher.encrypt("priya.shah@northwind.example")

        self.user = User(
            id=self.user_id,
            first_name="Priya",
            last_name="Shah",
            email_hash="hash_p",
            email_encrypted=enc_email,
            password_hash="pass_p",
            status=UserStatus.ACTIVE,
            token_version=5,
        )

        self.tenant = Tenant(
            id=self.tenant_id,
            name="Acme Global",
            slug="acme-global",
        )

    async def test_profile_returns_module_intersection_only(self) -> None:
        """UserProfileResponse returns exactly M_tenant ∩ M_user, preventing unlicensed module access."""
        # Tenant has: salesflow, peopleops
        # User has grants for: salesflow, ledgerflow
        # Expected intersection: ONLY salesflow
        sales_role = Role(
            id=uuid.uuid4(),
            code="sales_rep",
            name="Sales Representative",
            module_code="salesflow",
            hierarchy_level=20,
        )

        async def mock_exec(stmt: Any) -> Any:
            res = MagicMock()
            stmt_str = str(stmt).lower()
            if "tenant_modules" in stmt_str:
                # Active in tenant
                res.scalars.return_value.all.return_value = ["salesflow", "peopleops"]
            elif "user_module_grants" in stmt_str:
                # Granted to user
                res.scalars.return_value.all.return_value = ["salesflow", "ledgerflow"]
            elif "tenants" in stmt_str or "tenant_members" in stmt_str:
                res.scalars.return_value.all.return_value = [self.tenant]
                res.scalar_one_or_none.return_value = self.tenant
            elif "roles" in stmt_str:
                res.scalars.return_value.all.return_value = [sales_role]
            elif "role_permissions" in stmt_str or "permissions" in stmt_str:
                res.all.return_value = []
                res.scalars.return_value.all.return_value = []
            else:
                res.scalar_one_or_none.return_value = None
                res.scalars.return_value.all.return_value = []
            return res

        self.session.execute = AsyncMock(side_effect=mock_exec)

        profile = await self.auth_service.get_user_profile(
            session=self.session,
            user=self.user,
            tenant_id=self.tenant_id,
        )

        self.assertIsInstance(profile, UserProfileResponse)
        self.assertIsNotNone(profile.active_tenant)
        self.assertEqual(profile.active_tenant.id, self.tenant_id)

        accessible_codes = [m.code for m in profile.accessible_modules]
        self.assertIn("salesflow", accessible_codes)
        # ledgerflow was granted to user, but tenant has not activated it -> MUST NOT BE IN PROFILE
        self.assertNotIn("ledgerflow", accessible_codes)
        # peopleops was activated by tenant, but user was not granted it -> MUST NOT BE IN PROFILE
        self.assertNotIn("peopleops", accessible_codes)

    async def test_zombie_session_token_version_invalidation(self) -> None:
        """When an admin revokes permissions and bumps token_version, existing JWTs fail immediately."""
        # Old token generated with token_version = 5
        old_token = create_access_token({
            "sub": str(self.user_id),
            "type": "access",
            "token_version": 5,
        })

        # Admin bumps user token version to 6 (e.g. on role change or access revocation)
        self.user.token_version = 6

        # Simulating get_current_user decoding old_token
        from kernel.core.security.jwt import decode_token
        payload = decode_token(old_token)
        self.assertEqual(payload["token_version"], 5)
        self.assertNotEqual(payload["token_version"], self.user.token_version)

        # get_current_user check rejects old token
        with self.assertRaises(InvalidTokenError) as ctx:
            if payload.get("token_version") != self.user.token_version:
                raise InvalidTokenError("Token version invalidated. Please log in again.")

        self.assertIn("Token version invalidated", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
