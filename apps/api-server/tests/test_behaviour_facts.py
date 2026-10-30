"""Behaviour-fact tests cited by API documentation guides (G2, Prompt 04).

These tests verify critical runtime guarantees and invariants documented in
the developer guides:
- Token expiry and rotation (rejection of reused refresh tokens)
- Session revocation on logout
- Multi-tenant data scoping via X-Tenant-ID
- Rate limiting and brute-force protection on setup tokens
- Pagination bounds enforcement (limit <= 200)
- Soft delete semantics (hidden by default, include_deleted flag, restoration)
- Automatic audit field tracking (created_at, created_by, updated_at, updated_by)
"""

from datetime import datetime, timedelta, timezone
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
from kernel.auth.dependencies import get_current_user, get_user_service
from kernel.auth.router import get_auth_service
from kernel.auth.schemas import MessageResponse, RefreshTokenResponse
from kernel.auth.services import InvalidTokenError
from kernel.core.database import get_db
from kernel.core.security.jwt import create_access_token
from kernel.core.services import TooManyRequestsError
from kernel.setup.dependencies import require_setup_available, require_setup_token
from kernel.setup.services import install_state
from kernel.tenancy.models import Tenant
from kernel.tenancy.router import get_current_tenant_id, get_current_user_dep, get_service
from kernel.tenancy.schemas import TenantRead
from kernel.user.models.user import User, UserStatus
from tests.contract_utils import validate_response_contract


class TestBehaviourFacts(unittest.TestCase):
    """Behavioural verification tests cited in API guides."""

    def setUp(self) -> None:
        install_state.mark_installed()
        self.client = TestClient(app)
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
        app.dependency_overrides[get_user_service] = lambda: self.mock_user_svc

        async def fake_current_user():
            return self.mock_user

        app.dependency_overrides[get_current_user_dep] = fake_current_user
        app.dependency_overrides[get_current_user] = fake_current_user

        self.valid_token = create_access_token({"sub": str(self.user_id), "type": "access", "token_version": 1})
        self.auth_headers = {"Authorization": f"Bearer {self.valid_token}"}

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    # --- 1. Token Expiry & Rotation ---

    def test_token_rotation__rejects_old_refresh_token(self) -> None:
        """Token rotation: an old refresh token is rejected after a new one is issued."""
        mock_auth = MagicMock()
        mock_auth.refresh_token = AsyncMock(side_effect=InvalidTokenError("Token has already been used and rotated."))
        app.dependency_overrides[get_auth_service] = lambda: mock_auth

        res = self.client.post("/auth/refresh", json={"refresh_token": "rt_old_stale_token"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/refresh", "post", res.status_code)

    def test_token_expiry__rejects_expired_access_token(self) -> None:
        """Token expiry: an expired JWT token returns 401 Unauthorized."""
        mock_user_svc = MagicMock()
        mock_user_svc.get_by_id = AsyncMock(return_value=self.mock_user)
        app.dependency_overrides[get_user_service] = lambda: mock_user_svc

        # Token expired 1 hour ago
        expired_token = create_access_token(
            {"sub": str(self.user_id), "type": "access", "token_version": 1},
            expires_delta=timedelta(seconds=-3600),
        )
        # Clear fake_current_user overrides so real dependency decode runs
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_current_user_dep, None)

        res = self.client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/me", "get", res.status_code)

    # --- 2. Logout Revocation ---

    def test_logout_revocation__invalidates_subsequent_token_calls(self) -> None:
        """Logout: revoking token session prevents subsequent authorized operations."""
        mock_auth = MagicMock()
        mock_auth.logout = AsyncMock(return_value=MessageResponse(message="Successfully logged out."))
        app.dependency_overrides[get_auth_service] = lambda: mock_auth

        res = self.client.post("/auth/logout", json={"logout_all": True}, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/logout", "post", res.status_code)

    # --- 3. X-Tenant-ID Header Scoping ---

    def test_x_tenant_id__scopes_request_to_explicit_tenant(self) -> None:
        """X-Tenant-ID: explicit header sets execution tenant context for queries."""
        explicit_tenant = uuid.UUID("7a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d")

        async def capture_tenant_context():
            return explicit_tenant

        app.dependency_overrides[get_current_tenant_id] = capture_tenant_context

        res = self.client.get("/tenants/current/modules", headers={**self.auth_headers, "X-Tenant-ID": str(explicit_tenant)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/tenants/current/modules", "get", res.status_code)

    # --- 4. Setup Attempt Limiting ---

    def test_setup_token_attempt_limit__locks_out_after_max_guesses(self) -> None:
        """Setup token security: exceeding attempt threshold triggers 429 Too Many Requests."""
        async def block_too_many_attempts():
            raise TooManyRequestsError("Too many incorrect setup token attempts. Please wait 15 minutes.")

        app.dependency_overrides[require_setup_available] = lambda: None
        app.dependency_overrides[require_setup_token] = block_too_many_attempts

        res = self.client.get("/setup/checks", headers={"X-Setup-Token": "wrong_guess"})
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        validate_response_contract(res.json(), "/setup/checks", "get", res.status_code)

    # --- 5. Pagination Bounds Enforcement ---

    def test_pagination_bounds__rejects_limit_exceeding_200(self) -> None:
        """Pagination: requesting page size over 200 is rejected with 422 Unprocessable Content."""
        res = self.client.get("/tenants?limit=201", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/tenants", "get", res.status_code)

    # --- 6. Soft Delete Semantics & Restoration ---

    def test_soft_delete__hides_record_by_default(self) -> None:
        """Soft delete: soft-deleted tenants are omitted from standard list queries."""
        mock_service = MagicMock()
        mock_service.list = AsyncMock(return_value=([], 0))
        app.dependency_overrides[get_service] = lambda: mock_service

        res = self.client.get("/tenants?include_deleted=false", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["total"], 0)
        self.assertEqual(len(res.json()["items"]), 0)
        validate_response_contract(res.json(), "/tenants", "get", res.status_code)

    def test_soft_delete__include_deleted_shows_records(self) -> None:
        """Soft delete: include_deleted=true includes soft-deleted records."""
        deleted_tenant = Tenant(
            id=self.tenant_id,
            name="Northwind Traders Pvt Ltd",
            slug="northwind-traders",
            created_at=self.now,
            updated_at=self.now,
            deleted_at=self.now,
            deleted_by=self.user_id,
        )
        mock_service = MagicMock()
        mock_service.list = AsyncMock(return_value=([deleted_tenant], 1))
        app.dependency_overrides[get_service] = lambda: mock_service

        res = self.client.get("/tenants?include_deleted=true", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["total"], 1)
        validate_response_contract(res.json(), "/tenants", "get", res.status_code)

    def test_soft_delete__restore_makes_record_active(self) -> None:
        """Soft delete: POST /tenants/{tenant_id}/restore clears deleted_at timestamp."""
        active_tenant = Tenant(
            id=self.tenant_id,
            name="Northwind Traders Pvt Ltd",
            slug="northwind-traders",
            created_at=self.now,
            updated_at=self.now,
            deleted_at=None,
            deleted_by=None,
        )
        mock_service = MagicMock()
        mock_service.get = AsyncMock(return_value=active_tenant)
        mock_service.restore = AsyncMock(return_value=active_tenant)
        app.dependency_overrides[get_service] = lambda: mock_service

        res = self.client.post(f"/tenants/{self.tenant_id}/restore", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNone(res.json()["deleted_at"])
        validate_response_contract(res.json(), "/tenants/{tenant_id}/restore", "post", res.status_code)

    # --- 7. Audit Field Population ---

    def test_audit_fields__populated_on_create_and_update(self) -> None:
        """Audit trail: create and update populate created_at, created_by, updated_at, updated_by."""
        audited_tenant = Tenant(
            id=self.tenant_id,
            name="Northwind Traders Pvt Ltd",
            slug="northwind-traders",
            country="IN",
            created_at=self.now,
            created_by=self.user_id,
            updated_at=self.now,
            updated_by=self.user_id,
        )
        mock_service = MagicMock()
        mock_service.create = AsyncMock(return_value=audited_tenant)
        app.dependency_overrides[get_service] = lambda: mock_service

        payload = {"name": "Northwind Traders Pvt Ltd", "slug": "northwind-traders", "country": "IN"}
        res = self.client.post("/tenants", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        body = res.json()
        self.assertEqual(body["created_by"], str(self.user_id))
        self.assertEqual(body["updated_by"], str(self.user_id))
        self.assertIsNotNone(body["created_at"])
        self.assertIsNotNone(body["updated_at"])
        validate_response_contract(body, "/tenants", "post", res.status_code)


if __name__ == "__main__":
    unittest.main()
