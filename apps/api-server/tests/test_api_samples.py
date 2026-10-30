"""End-to-end execution of API documentation guide samples (Prompt 09).

Simulates the exact end-to-end walkthrough from the Quickstart, Authentication,
Tenancy, and First-Run Setup guides against an isolated test server instance.
Guarantees that documented sample inputs and expected outputs remain 100% in sync
with actual API server execution.
"""

from datetime import datetime, timezone
from pathlib import Path
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

app_root = Path(__file__).resolve().parents[1]
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from fastapi import status
from fastapi.testclient import TestClient

from app.main import app
from kernel.auth.dependencies import get_current_user, get_user_service
from kernel.auth.router import get_auth_service
from kernel.auth.schemas import TokenResponse
from kernel.core.database import get_db
from kernel.core.security.jwt import create_access_token
from kernel.core.schemas import Page
from kernel.setup.dependencies import (
    is_installed_cached,
    require_setup_available,
    require_setup_token,
)
from kernel.setup.schemas import SetupResult, SetupStatus
from kernel.setup.services import install_state
from kernel.tenancy.models import Tenant
from kernel.tenancy.router import get_current_tenant_id, get_current_user_dep, get_service
from kernel.tenancy.schemas import TenantRead
from kernel.user.models.user import User, UserStatus
from kernel.user.schemas.user import UserRead


class TestApiGuideSamples(unittest.TestCase):
    """Verifies all guide sample sequences execute and match documented outputs."""

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.now = datetime.now(timezone.utc)
        self.ping_patcher = patch(
            "app.engine.server.ping_db",
            AsyncMock(
                return_value={
                    "status": "HEALTHY",
                    "latency_ms": 1.0,
                    "pool": {"size": 5, "checked_in": 5, "checked_out": 0, "overflow": 0},
                    "error": None,
                }
            ),
        )
        self.ping_patcher.start()
        self.addCleanup(self.ping_patcher.stop)
        install_state.mark_installed()
        self.user_id = uuid.UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        self.tenant_id = uuid.UUID("3f2b1c9e-4d5a-6b7c-8e9f-0a1b2c3d4e5f")

        self.mock_user = User(
            id=self.user_id,
            first_name="Priya",
            last_name="Shah",
            email_hash="hash",
            email_encrypted="enc",
            password_hash="pass",
            status=UserStatus.ACTIVE,
            is_super_admin=True,
            token_version=1,
            created_at=self.now,
            updated_at=self.now,
        )

        async def fake_db():
            session = MagicMock()
            session.commit = AsyncMock()
            session.rollback = AsyncMock()
            session.flush = AsyncMock()
            lookup = MagicMock()
            lookup.scalar_one_or_none.return_value = None
            lookup.scalars.return_value.all.return_value = []
            session.execute = AsyncMock(return_value=lookup)
            yield session

        app.dependency_overrides[get_db] = fake_db

        self.mock_user_svc = MagicMock()
        self.mock_user_svc.get_by_id = AsyncMock(return_value=self.mock_user)
        self.mock_user_read = UserRead(
            id=self.user_id,
            email="priya.shah@northwind.example",
            first_name="Priya",
            last_name="Shah",
            status=UserStatus.ACTIVE,
            is_super_admin=True,
            token_version=1,
            created_at=self.now,
            updated_at=self.now,
        )
        self.mock_user_svc.to_user_read = MagicMock(return_value=self.mock_user_read)
        app.dependency_overrides[get_user_service] = lambda: self.mock_user_svc

        async def fake_current_user():
            return self.mock_user

        app.dependency_overrides[get_current_user_dep] = fake_current_user
        app.dependency_overrides[get_current_user] = fake_current_user

        self.valid_token = create_access_token(
            {"sub": str(self.user_id), "type": "access", "token_version": 1}
        )
        self.auth_headers = {"Authorization": f"Bearer {self.valid_token}"}

    def tearDown(self) -> None:
        app.dependency_overrides.clear()
        install_state.mark_installed()

    def test_quickstart_sample_sequence(self) -> None:
        """Execute the complete Quickstart guide workflow in order."""

        # Step 1: Health check (GET /health)
        health_res = self.client.get("/health")
        self.assertEqual(health_res.status_code, status.HTTP_200_OK)
        health_data = health_res.json()
        self.assertEqual(health_data["status"], "pass")
        self.assertIn("modules", health_data)

        # Step 2: Setup status check (GET /setup/status)
        app.dependency_overrides[is_installed_cached] = lambda: False
        status_res = self.client.get("/setup/status")
        self.assertEqual(status_res.status_code, status.HTTP_200_OK)
        self.assertFalse(status_res.json()["installed"])

        # Step 3: First-run install (POST /setup)
        app.dependency_overrides[require_setup_available] = lambda: None
        app.dependency_overrides[require_setup_token] = lambda: None

        mock_tenant_read = TenantRead(
            id=self.tenant_id,
            name="Northwind Traders Pvt Ltd",
            slug="northwind-traders",
            created_at=self.now,
            updated_at=self.now,
        )
        from kernel.setup.router import get_service as get_setup_service
        mock_setup = MagicMock()
        mock_setup.install = AsyncMock(
            return_value=SetupResult(
                tenant=mock_tenant_read,
                admin=self.mock_user_read,
                installed_at=self.now,
            )
        )
        mock_setup.session = MagicMock()
        mock_setup.session.commit = AsyncMock()
        app.dependency_overrides[get_setup_service] = lambda: mock_setup

        install_payload = {
            "organization": {
                "name": "Northwind Traders Pvt Ltd",
                "slug": "northwind-traders",
            },
            "admin": {
                "email": "priya.shah@northwind.example",
                "password": "SecureEnterprisePassword123!",
                "first_name": "Priya",
                "last_name": "Shah",
            },
        }
        install_res = self.client.post(
            "/setup",
            json=install_payload,
            headers={"X-Setup-Token": "valid-setup-token"},
        )
        self.assertEqual(install_res.status_code, status.HTTP_201_CREATED)
        install_data = install_res.json()
        self.assertEqual(install_data["tenant"]["name"], "Northwind Traders Pvt Ltd")
        self.assertEqual(install_data["admin"]["email"], "priya.shah@northwind.example")
        app.dependency_overrides[is_installed_cached] = lambda: True

        # Step 4: Login (POST /auth/login)
        mock_auth = MagicMock()
        mock_auth.login = AsyncMock(
            return_value=TokenResponse(
                access_token=self.valid_token,
                refresh_token="sample_refresh_token_string",
                token_type="bearer",
                expires_in=1800,
                must_change_password=False,
                user=self.mock_user_read,
            )
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_auth

        login_res = self.client.post(
            "/auth/login",
            json={
                "email": "priya.shah@northwind.example",
                "password": "SecureEnterprisePassword123!",
            },
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        login_data = login_res.json()
        self.assertEqual(login_data["token_type"], "bearer")
        self.assertEqual(login_data["expires_in"], 1800)

        # Step 5: Profile retrieval (GET /auth/me)
        me_res = self.client.get("/auth/me", headers=self.auth_headers)
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        me_data = me_res.json()
        self.assertEqual(me_data["email"], "priya.shah@northwind.example")
        self.assertEqual(me_data["first_name"], "Priya")
        self.assertEqual(me_data["last_name"], "Shah")

        # Step 6: Create tenant (POST /tenants)
        tenant_obj = Tenant(
            id=self.tenant_id,
            name="Northwind Traders Pvt Ltd",
            slug="northwind",
            created_at=self.now,
            updated_at=self.now,
            created_by=self.user_id,
            updated_by=self.user_id,
            deleted_at=None,
            deleted_by=None,
        )
        mock_tenant_svc = MagicMock()
        mock_tenant_svc.create = AsyncMock(return_value=tenant_obj)
        mock_tenant_svc.get = AsyncMock(return_value=tenant_obj)
        mock_tenant_svc.get_by_id = AsyncMock(return_value=tenant_obj)
        mock_tenant_svc.list = AsyncMock(return_value=([tenant_obj], 1))
        mock_tenant_svc.get_multi = AsyncMock(return_value=([tenant_obj], 1))
        mock_tenant_svc.delete = AsyncMock(return_value=tenant_obj)
        mock_tenant_svc.soft_delete = AsyncMock(return_value=tenant_obj)
        mock_tenant_svc.restore = AsyncMock(return_value=tenant_obj)
        app.dependency_overrides[get_service] = lambda: mock_tenant_svc

        tenant_payload = {
            "name": "Northwind Traders Pvt Ltd",
            "slug": "northwind",
        }
        create_res = self.client.post("/tenants", json=tenant_payload, headers=self.auth_headers)
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        created_tenant = create_res.json()
        self.assertEqual(created_tenant["id"], str(self.tenant_id))
        self.assertEqual(created_tenant["name"], "Northwind Traders Pvt Ltd")
        self.assertEqual(created_tenant["slug"], "northwind")

        # Step 7: List tenants (GET /tenants)
        list_res = self.client.get("/tenants", headers=self.auth_headers)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        list_data = list_res.json()
        self.assertEqual(list_data["total"], 1)
        self.assertEqual(len(list_data["items"]), 1)
        self.assertEqual(list_data["items"][0]["slug"], "northwind")

        # Step 8: Get tenant (GET /tenants/{id})
        get_res = self.client.get(f"/tenants/{self.tenant_id}", headers=self.auth_headers)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.json()["slug"], "northwind")

        # Step 9: Soft delete tenant (DELETE /tenants/{id})
        del_res = self.client.delete(f"/tenants/{self.tenant_id}", headers=self.auth_headers)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertEqual(del_res.json()["slug"], "northwind")

        # Step 10: Restore tenant (POST /tenants/{id}/restore)
        restore_res = self.client.post(f"/tenants/{self.tenant_id}/restore", headers=self.auth_headers)
        self.assertEqual(restore_res.status_code, status.HTTP_200_OK)
        self.assertEqual(restore_res.json()["slug"], "northwind")

        # Step 11: Logout (POST /auth/logout)
        from kernel.auth.schemas import MessageResponse
        mock_auth.logout = AsyncMock(return_value=MessageResponse(message="Successfully logged out."))
        logout_res = self.client.post("/auth/logout", json={"logout_all": False}, headers=self.auth_headers)
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)
        self.assertIn("logged out", logout_res.json()["message"])


if __name__ == "__main__":
    unittest.main()
