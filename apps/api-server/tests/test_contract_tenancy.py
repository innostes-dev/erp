"""Contract tests for Tenancy endpoints."""

from datetime import datetime, timezone
from pathlib import Path
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock
import uuid

app_root = Path(__file__).resolve().parents[1]
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from fastapi import status
from fastapi.testclient import TestClient

from app.main import app
from kernel.auth.dependencies import get_user_service
from kernel.core.database import get_db
from kernel.core.security.jwt import create_access_token
from kernel.core.services.errors import ForbiddenError, UnauthorizedError
from kernel.tenancy.models import Tenant
from kernel.tenancy.router import (
    get_current_tenant_id,
    get_current_user_dep,
    get_service,
    require_super_admin_dep,
)
from kernel.tenancy.schemas import (
    ActivationResponse,
    ItemCatalogRead,
    ModuleListResponse,
    PluginListResponse,
    TenantRead,
)
from kernel.tenancy.services import SlugTakenError, TenantNotFoundError
from kernel.user.models.user import User, UserStatus
from tests.contract_utils import validate_response_contract


class TestContractTenancy(unittest.TestCase):
    """Contract tests verifying request and response adherence for /tenants endpoints."""

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.mock_service = MagicMock()
        self.tenant_id = uuid.UUID("3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f")
        self.user_id = uuid.UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        self.now = datetime.now(timezone.utc)

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

        self.mock_tenant = Tenant(
            id=self.tenant_id,
            name="Northwind Traders Pvt Ltd",
            slug="northwind-traders",
            country="IN",
            timezone="Asia/Kolkata",
            language="en-IN",
            date_format="DD/MM/YYYY",
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
        app.dependency_overrides[get_service] = lambda: self.mock_service

        self.mock_service.create = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.get = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.update = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.delete = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.soft_delete = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.restore = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.list = AsyncMock(return_value=([self.mock_tenant], 1))

        async def fake_current_user():
            return self.mock_user

        async def fake_super_admin():
            return self.mock_user

        async def fake_tenant_id():
            return self.tenant_id

        app.dependency_overrides[get_current_user_dep] = fake_current_user
        app.dependency_overrides[require_super_admin_dep] = fake_super_admin
        app.dependency_overrides[get_current_tenant_id] = fake_tenant_id

        self.token = create_access_token({"sub": str(self.user_id), "type": "access", "token_version": 1})
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    # --- 1. POST /tenants ---

    def test_tenants_create__201_valid_tenant(self) -> None:
        """POST /tenants returns 201 with TenantRead contract."""
        self.mock_service.create = AsyncMock(return_value=self.mock_tenant)
        payload = {"name": "Northwind Traders Pvt Ltd", "slug": "northwind-traders", "country": "IN"}
        res = self.client.post("/tenants", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        validate_response_contract(res.json(), "/tenants", "post", res.status_code)

    def test_tenants_create__401_unauthorized(self) -> None:
        """POST /tenants returns 401 when calling with an invalid bearer token."""
        payload = {"name": "Northwind Traders Pvt Ltd", "slug": "northwind-traders"}
        res = self.client.post("/tenants", json=payload, headers={"Authorization": "Bearer invalid_token"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants", "post", res.status_code)

    def test_tenants_create__409_slug_taken(self) -> None:
        """POST /tenants returns 409 when tenant slug is already taken."""
        self.mock_service.create = AsyncMock(side_effect=SlugTakenError("northwind-traders"))
        payload = {"name": "Northwind Traders Pvt Ltd", "slug": "northwind-traders"}
        res = self.client.post("/tenants", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        validate_response_contract(res.json(), "/tenants", "post", res.status_code)

    def test_tenants_create__422_invalid_payload(self) -> None:
        """POST /tenants returns 422 when required fields are missing."""
        res = self.client.post("/tenants", json={}, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/tenants", "post", res.status_code)

    # --- 2. GET /tenants ---

    def test_tenants_list__200_returns_page(self) -> None:
        """GET /tenants returns 200 with Page[TenantRead] contract."""
        self.mock_service.list = AsyncMock(return_value=([self.mock_tenant], 1))
        res = self.client.get("/tenants", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants", "get", res.status_code)

    def test_tenants_list__401_unauthorized(self) -> None:
        """GET /tenants returns 401 when calling with an invalid bearer token."""
        res = self.client.get("/tenants", headers={"Authorization": "Bearer invalid_token"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants", "get", res.status_code)

    def test_tenants_list__422_invalid_limit(self) -> None:
        """GET /tenants returns 422 when limit exceeds 200."""
        res = self.client.get("/tenants?limit=500", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/tenants", "get", res.status_code)

    # --- 3. GET /tenants/{tenant_id} ---

    def test_tenants_get__200_returns_tenant(self) -> None:
        """GET /tenants/{tenant_id} returns 200 with TenantRead contract."""
        self.mock_service.get = AsyncMock(return_value=self.mock_tenant)
        res = self.client.get(f"/tenants/{self.tenant_id}", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "get", res.status_code)

    def test_tenants_get__401_unauthorized(self) -> None:
        """GET /tenants/{tenant_id} returns 401 when calling with an invalid bearer token."""
        res = self.client.get(f"/tenants/{self.tenant_id}", headers={"Authorization": "Bearer invalid_token"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "get", res.status_code)

    def test_tenants_get__404_when_tenant_does_not_exist(self) -> None:
        """GET /tenants/{tenant_id} returns 404 when tenant is not found."""
        self.mock_service.get = AsyncMock(return_value=None)
        res = self.client.get(f"/tenants/{self.tenant_id}", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "get", res.status_code)

    def test_tenants_get__422_invalid_uuid(self) -> None:
        """GET /tenants/{tenant_id} returns 422 when UUID is malformed."""
        res = self.client.get("/tenants/not-a-valid-uuid", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "get", res.status_code)

    # --- 4. PATCH /tenants/{tenant_id} ---

    def test_tenants_update__200_valid_update(self) -> None:
        """PATCH /tenants/{tenant_id} returns 200 with TenantRead contract."""
        self.mock_service.get = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.update = AsyncMock(return_value=self.mock_tenant)
        payload = {"name": "Northwind Traders Updated Pvt Ltd"}
        res = self.client.patch(f"/tenants/{self.tenant_id}", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "patch", res.status_code)

    def test_tenants_update__401_unauthorized(self) -> None:
        """PATCH /tenants/{tenant_id} returns 401 when calling with an invalid bearer token."""
        res = self.client.patch(f"/tenants/{self.tenant_id}", json={"name": "New Name"}, headers={"Authorization": "Bearer invalid_token"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "patch", res.status_code)

    def test_tenants_update__404_when_tenant_does_not_exist(self) -> None:
        """PATCH /tenants/{tenant_id} returns 404 when tenant is not found."""
        self.mock_service.get = AsyncMock(return_value=None)
        res = self.client.patch(f"/tenants/{self.tenant_id}", json={"name": "New Name"}, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "patch", res.status_code)

    def test_tenants_update__409_slug_taken(self) -> None:
        """PATCH /tenants/{tenant_id} returns 409 when target slug is taken."""
        self.mock_service.get = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.update = AsyncMock(side_effect=SlugTakenError("taken-slug"))
        res = self.client.patch(f"/tenants/{self.tenant_id}", json={"slug": "taken-slug"}, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "patch", res.status_code)

    def test_tenants_update__422_invalid_uuid(self) -> None:
        """PATCH /tenants/{tenant_id} returns 422 when UUID is malformed."""
        res = self.client.patch("/tenants/invalid-id", json={"name": "New Name"}, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "patch", res.status_code)

    # --- 5. DELETE /tenants/{tenant_id} ---

    def test_tenants_delete__200_soft_deletes_tenant(self) -> None:
        """DELETE /tenants/{tenant_id} returns 200 confirming soft deletion."""
        self.mock_service.get = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.delete = AsyncMock(return_value=self.mock_tenant)
        res = self.client.delete(f"/tenants/{self.tenant_id}", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "delete", res.status_code)

    def test_tenants_delete__401_unauthorized(self) -> None:
        """DELETE /tenants/{tenant_id} returns 401 when calling with an invalid bearer token."""
        res = self.client.delete(f"/tenants/{self.tenant_id}", headers={"Authorization": "Bearer invalid_token"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "delete", res.status_code)

    def test_tenants_delete__404_when_tenant_does_not_exist(self) -> None:
        """DELETE /tenants/{tenant_id} returns 404 when tenant is not found."""
        self.mock_service.get = AsyncMock(return_value=None)
        res = self.client.delete(f"/tenants/{self.tenant_id}", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "delete", res.status_code)

    def test_tenants_delete__422_invalid_uuid(self) -> None:
        """DELETE /tenants/{tenant_id} returns 422 when UUID is malformed."""
        res = self.client.delete("/tenants/invalid-id", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/tenants/{tenant_id}", "delete", res.status_code)

    # --- 6. POST /tenants/{tenant_id}/restore ---

    def test_tenants_restore__200_restores_tenant(self) -> None:
        """POST /tenants/{tenant_id}/restore returns 200 confirming restoration."""
        self.mock_service.get = AsyncMock(return_value=self.mock_tenant)
        self.mock_service.restore = AsyncMock(return_value=self.mock_tenant)
        res = self.client.post(f"/tenants/{self.tenant_id}/restore", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/{tenant_id}/restore", "post", res.status_code)

    def test_tenants_restore__401_unauthorized(self) -> None:
        """POST /tenants/{tenant_id}/restore returns 401 when calling with an invalid bearer token."""
        res = self.client.post(f"/tenants/{self.tenant_id}/restore", headers={"Authorization": "Bearer invalid_token"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/{tenant_id}/restore", "post", res.status_code)

    def test_tenants_restore__404_when_tenant_does_not_exist(self) -> None:
        """POST /tenants/{tenant_id}/restore returns 404 when tenant is not found."""
        self.mock_service.get = AsyncMock(return_value=None)
        res = self.client.post(f"/tenants/{self.tenant_id}/restore", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/{tenant_id}/restore", "post", res.status_code)

    def test_tenants_restore__422_invalid_uuid(self) -> None:
        """POST /tenants/{tenant_id}/restore returns 422 when UUID is malformed."""
        res = self.client.post("/tenants/invalid-id/restore", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/tenants/{tenant_id}/restore", "post", res.status_code)

    # --- 7. GET /tenants/current/modules ---

    def test_tenants_list_modules__200_returns_modules(self) -> None:
        """GET /tenants/current/modules returns 200 with ModuleListResponse."""
        headers = {**self.auth_headers, "X-Tenant-ID": str(self.tenant_id)}
        res = self.client.get("/tenants/current/modules", headers=headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/current/modules", "get", res.status_code)

    def test_tenants_list_modules__401_unauthorized(self) -> None:
        """GET /tenants/current/modules returns 401 when unauthenticated."""
        async def fake_unauth():
            raise UnauthorizedError()
        app.dependency_overrides[get_current_user_dep] = fake_unauth
        res = self.client.get("/tenants/current/modules")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/current/modules", "get", res.status_code)

    def test_tenants_list_modules__404_no_tenant_context(self) -> None:
        """GET /tenants/current/modules returns 404 when no tenant exists."""
        async def fake_no_tenant():
            raise TenantNotFoundError()
        app.dependency_overrides[get_current_tenant_id] = fake_no_tenant
        res = self.client.get("/tenants/current/modules", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/current/modules", "get", res.status_code)

    # --- 8. POST /tenants/current/modules/{module_id}/activate ---

    def test_tenants_activate_module__200_activates_module(self) -> None:
        """POST /tenants/current/modules/{module_id}/activate returns 200."""
        headers = {**self.auth_headers, "X-Tenant-ID": str(self.tenant_id)}
        res = self.client.post("/tenants/current/modules/hrms/activate", headers=headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/current/modules/{module_id}/activate", "post", res.status_code)

    def test_tenants_activate_module__401_unauthorized(self) -> None:
        """POST /tenants/current/modules/{module_id}/activate returns 401 when unauthenticated."""
        async def fake_unauth():
            raise UnauthorizedError()
        app.dependency_overrides[require_super_admin_dep] = fake_unauth
        res = self.client.post("/tenants/current/modules/hrms/activate")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/current/modules/{module_id}/activate", "post", res.status_code)

    def test_tenants_activate_module__403_forbidden_for_non_admin(self) -> None:
        """POST /tenants/current/modules/{module_id}/activate returns 403 when not super admin."""
        async def fake_forbid():
            raise ForbiddenError("Super administrator privilege required.")
        app.dependency_overrides[require_super_admin_dep] = fake_forbid
        res = self.client.post("/tenants/current/modules/hrms/activate", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        validate_response_contract(res.json(), "/tenants/current/modules/{module_id}/activate", "post", res.status_code)

    def test_tenants_activate_module__404_no_tenant_context(self) -> None:
        """POST /tenants/current/modules/{module_id}/activate returns 404 when no tenant exists."""
        async def fake_no_tenant():
            raise TenantNotFoundError()
        app.dependency_overrides[get_current_tenant_id] = fake_no_tenant
        res = self.client.post("/tenants/current/modules/hrms/activate", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/current/modules/{module_id}/activate", "post", res.status_code)

    # --- 9. POST /tenants/current/modules/{module_id}/deactivate ---

    def test_tenants_deactivate_module__200_deactivates_module(self) -> None:
        """POST /tenants/current/modules/{module_id}/deactivate returns 200."""
        headers = {**self.auth_headers, "X-Tenant-ID": str(self.tenant_id)}
        res = self.client.post("/tenants/current/modules/hrms/deactivate", headers=headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/current/modules/{module_id}/deactivate", "post", res.status_code)

    def test_tenants_deactivate_module__401_unauthorized(self) -> None:
        """POST /tenants/current/modules/{module_id}/deactivate returns 401 when unauthenticated."""
        async def fake_unauth():
            raise UnauthorizedError()
        app.dependency_overrides[require_super_admin_dep] = fake_unauth
        res = self.client.post("/tenants/current/modules/hrms/deactivate")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/current/modules/{module_id}/deactivate", "post", res.status_code)

    def test_tenants_deactivate_module__403_forbidden_for_non_admin(self) -> None:
        """POST /tenants/current/modules/{module_id}/deactivate returns 403 when not super admin."""
        async def fake_forbid():
            raise ForbiddenError("Super administrator privilege required.")
        app.dependency_overrides[require_super_admin_dep] = fake_forbid
        res = self.client.post("/tenants/current/modules/hrms/deactivate", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        validate_response_contract(res.json(), "/tenants/current/modules/{module_id}/deactivate", "post", res.status_code)

    def test_tenants_deactivate_module__404_no_tenant_context(self) -> None:
        """POST /tenants/current/modules/{module_id}/deactivate returns 404 when no tenant exists."""
        async def fake_no_tenant():
            raise TenantNotFoundError()
        app.dependency_overrides[get_current_tenant_id] = fake_no_tenant
        res = self.client.post("/tenants/current/modules/hrms/deactivate", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/current/modules/{module_id}/deactivate", "post", res.status_code)

    # --- 10. GET /tenants/current/plugins ---

    def test_tenants_list_plugins__200_returns_plugins(self) -> None:
        """GET /tenants/current/plugins returns 200 with PluginListResponse."""
        headers = {**self.auth_headers, "X-Tenant-ID": str(self.tenant_id)}
        res = self.client.get("/tenants/current/plugins", headers=headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/current/plugins", "get", res.status_code)

    def test_tenants_list_plugins__401_unauthorized(self) -> None:
        """GET /tenants/current/plugins returns 401 when unauthenticated."""
        async def fake_unauth():
            raise UnauthorizedError()
        app.dependency_overrides[get_current_user_dep] = fake_unauth
        res = self.client.get("/tenants/current/plugins")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/current/plugins", "get", res.status_code)

    def test_tenants_list_plugins__404_no_tenant_context(self) -> None:
        """GET /tenants/current/plugins returns 404 when no tenant exists."""
        async def fake_no_tenant():
            raise TenantNotFoundError()
        app.dependency_overrides[get_current_tenant_id] = fake_no_tenant
        res = self.client.get("/tenants/current/plugins", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/current/plugins", "get", res.status_code)

    # --- 11. POST /tenants/current/plugins/{plugin_id}/activate ---

    def test_tenants_activate_plugin__200_activates_plugin(self) -> None:
        """POST /tenants/current/plugins/{plugin_id}/activate returns 200."""
        headers = {**self.auth_headers, "X-Tenant-ID": str(self.tenant_id)}
        res = self.client.post("/tenants/current/plugins/api-logger/activate", headers=headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/current/plugins/{plugin_id}/activate", "post", res.status_code)

    def test_tenants_activate_plugin__401_unauthorized(self) -> None:
        """POST /tenants/current/plugins/{plugin_id}/activate returns 401 when unauthenticated."""
        async def fake_unauth():
            raise UnauthorizedError()
        app.dependency_overrides[require_super_admin_dep] = fake_unauth
        res = self.client.post("/tenants/current/plugins/api-logger/activate")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/current/plugins/{plugin_id}/activate", "post", res.status_code)

    def test_tenants_activate_plugin__403_forbidden_for_non_admin(self) -> None:
        """POST /tenants/current/plugins/{plugin_id}/activate returns 403 when not super admin."""
        async def fake_forbid():
            raise ForbiddenError("Super administrator privilege required.")
        app.dependency_overrides[require_super_admin_dep] = fake_forbid
        res = self.client.post("/tenants/current/plugins/api-logger/activate", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        validate_response_contract(res.json(), "/tenants/current/plugins/{plugin_id}/activate", "post", res.status_code)

    def test_tenants_activate_plugin__404_no_tenant_context(self) -> None:
        """POST /tenants/current/plugins/{plugin_id}/activate returns 404 when no tenant exists."""
        async def fake_no_tenant():
            raise TenantNotFoundError()
        app.dependency_overrides[get_current_tenant_id] = fake_no_tenant
        res = self.client.post("/tenants/current/plugins/api-logger/activate", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/current/plugins/{plugin_id}/activate", "post", res.status_code)

    # --- 12. POST /tenants/current/plugins/{plugin_id}/deactivate ---

    def test_tenants_deactivate_plugin__200_deactivates_plugin(self) -> None:
        """POST /tenants/current/plugins/{plugin_id}/deactivate returns 200."""
        headers = {**self.auth_headers, "X-Tenant-ID": str(self.tenant_id)}
        res = self.client.post("/tenants/current/plugins/api-logger/deactivate", headers=headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/current/plugins/{plugin_id}/deactivate", "post", res.status_code)

    def test_tenants_deactivate_plugin__401_unauthorized(self) -> None:
        """POST /tenants/current/plugins/{plugin_id}/deactivate returns 401 when unauthenticated."""
        async def fake_unauth():
            raise UnauthorizedError()
        app.dependency_overrides[require_super_admin_dep] = fake_unauth
        res = self.client.post("/tenants/current/plugins/api-logger/deactivate")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/tenants/current/plugins/{plugin_id}/deactivate", "post", res.status_code)

    def test_tenants_deactivate_plugin__403_forbidden_for_non_admin(self) -> None:
        """POST /tenants/current/plugins/{plugin_id}/deactivate returns 403 when not super admin."""
        async def fake_forbid():
            raise ForbiddenError("Super administrator privilege required.")
        app.dependency_overrides[require_super_admin_dep] = fake_forbid
        res = self.client.post("/tenants/current/plugins/api-logger/deactivate", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        validate_response_contract(res.json(), "/tenants/current/plugins/{plugin_id}/deactivate", "post", res.status_code)

    def test_tenants_deactivate_plugin__404_no_tenant_context(self) -> None:
        """POST /tenants/current/plugins/{plugin_id}/deactivate returns 404 when no tenant exists."""
        async def fake_no_tenant():
            raise TenantNotFoundError()
        app.dependency_overrides[get_current_tenant_id] = fake_no_tenant
        res = self.client.post("/tenants/current/plugins/api-logger/deactivate", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/tenants/current/plugins/{plugin_id}/deactivate", "post", res.status_code)


if __name__ == "__main__":
    unittest.main()
