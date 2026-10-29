"""Contract tests for Authentication endpoints."""

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
from kernel.auth.dependencies import get_api_key_service as dep_get_api_key_svc, get_user_service
from kernel.auth.router import get_api_key_service, get_auth_service
from kernel.auth.schemas import (
    ApiKeyRead,
    ForgotPasswordResponse,
    MessageResponse,
    RefreshTokenResponse,
    TokenResponse,
)
from kernel.auth.services import InvalidCredentialsError, InvalidTokenError
from kernel.core.database import get_db
from kernel.core.security.jwt import create_access_token
from kernel.core.services.errors import NotFoundError
from kernel.user.models.user import User, UserStatus
from kernel.user.schemas import UserRead
from kernel.user.services import UserService
from tests.contract_utils import validate_response_contract


class TestContractAuth(unittest.TestCase):
    """Contract tests verifying request and response adherence for /auth endpoints."""

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.mock_auth = MagicMock()
        self.mock_api_key = MagicMock()
        self.mock_user_svc = MagicMock()
        self.user_id = uuid.UUID("3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f")
        self.tenant_id = uuid.UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")

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
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.mock_user_svc.get_by_id = AsyncMock(return_value=self.mock_user)
        self.mock_user_read = UserRead(
            id=self.user_id,
            first_name="Priya",
            last_name="Shah",
            email="priya.shah@northwind.example",
            status=UserStatus.ACTIVE,
            is_super_admin=True,
            token_version=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.mock_user_svc.to_user_read = MagicMock(return_value=self.mock_user_read)

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
        app.dependency_overrides[get_auth_service] = lambda: self.mock_auth
        app.dependency_overrides[get_api_key_service] = lambda: self.mock_api_key
        app.dependency_overrides[dep_get_api_key_svc] = lambda: self.mock_api_key
        app.dependency_overrides[get_user_service] = lambda: self.mock_user_svc

        # Bearer token for authenticated tests
        self.valid_token = create_access_token({"sub": str(self.user_id), "type": "access", "token_version": 1})
        self.auth_headers = {"Authorization": f"Bearer {self.valid_token}"}

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    # --- 1. POST /auth/login ---

    def test_auth_login__200_valid_credentials(self) -> None:
        """POST /auth/login returns 200 with TokenResponse contract."""
        self.mock_auth.login = AsyncMock(
            return_value=TokenResponse(
                access_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                refresh_token="rt_sample123",
                token_type="bearer",
                expires_in=1800,
                must_change_password=False,
                user=UserRead(
                    id=self.user_id,
                    first_name="Priya",
                    last_name="Shah",
                    email="priya.shah@northwind.example",
                    status=UserStatus.ACTIVE,
                    is_super_admin=True,
                    token_version=1,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                ),
            )
        )
        payload = {"email": "priya.shah@northwind.example", "password": "NorthwindPass2026!"}
        res = self.client.post("/auth/login", json=payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/login", "post", res.status_code)

    def test_auth_login__401_invalid_credentials(self) -> None:
        """POST /auth/login returns 401 when service raises InvalidCredentialsError."""
        self.mock_auth.login = AsyncMock(side_effect=InvalidCredentialsError())
        payload = {"email": "priya.shah@northwind.example", "password": "WrongPassword!"}
        res = self.client.post("/auth/login", json=payload)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/login", "post", res.status_code)

    def test_auth_login__422_missing_body(self) -> None:
        """POST /auth/login returns 422 when required fields are missing."""
        res = self.client.post("/auth/login", json={})
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/auth/login", "post", res.status_code)

    # --- 2. POST /auth/refresh ---

    def test_auth_refresh__200_valid_token(self) -> None:
        """POST /auth/refresh returns 200 with RefreshTokenResponse contract."""
        self.mock_auth.refresh_token = AsyncMock(
            return_value=RefreshTokenResponse(
                access_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new",
                refresh_token="rt_new123",
                token_type="bearer",
                expires_in=1800,
            )
        )
        res = self.client.post("/auth/refresh", json={"refresh_token": "rt_sample123"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/refresh", "post", res.status_code)

    def test_auth_refresh__401_invalid_token(self) -> None:
        """POST /auth/refresh returns 401 when token is invalid or expired."""
        self.mock_auth.refresh_token = AsyncMock(side_effect=InvalidTokenError("Token invalid"))
        res = self.client.post("/auth/refresh", json={"refresh_token": "rt_bad123"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/refresh", "post", res.status_code)

    def test_auth_refresh__422_missing_body(self) -> None:
        """POST /auth/refresh returns 422 when body format is invalid."""
        res = self.client.post("/auth/refresh", content="not json", headers={"Content-Type": "application/json"})
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/auth/refresh", "post", res.status_code)

    # --- 3. POST /auth/forgot-password ---

    def test_auth_forgot_password__200_always_success(self) -> None:
        """POST /auth/forgot-password returns 200 with anti-enumeration message."""
        self.mock_auth.forgot_password = AsyncMock(return_value=ForgotPasswordResponse())
        res = self.client.post("/auth/forgot-password", json={"email": "priya.shah@northwind.example"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/forgot-password", "post", res.status_code)

    def test_auth_forgot_password__422_invalid_email(self) -> None:
        """POST /auth/forgot-password returns 422 when email is malformed."""
        res = self.client.post("/auth/forgot-password", json={"email": "not-an-email"})
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/auth/forgot-password", "post", res.status_code)

    # --- 4. POST /auth/reset-password ---

    def test_auth_reset_password__200_valid_token(self) -> None:
        """POST /auth/reset-password returns 200 confirming successful password change."""
        self.mock_auth.reset_password = AsyncMock(return_value=MessageResponse(message="Password reset successfully."))
        payload = {"token": "rst_valid123", "new_password": "NewNorthwindPass2026!"}
        res = self.client.post("/auth/reset-password", json=payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/reset-password", "post", res.status_code)

    def test_auth_reset_password__401_invalid_token(self) -> None:
        """POST /auth/reset-password returns 401 when reset token is invalid."""
        self.mock_auth.reset_password = AsyncMock(side_effect=InvalidTokenError("Invalid token"))
        payload = {"token": "rst_invalid", "new_password": "NewNorthwindPass2026!"}
        res = self.client.post("/auth/reset-password", json=payload)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/reset-password", "post", res.status_code)

    def test_auth_reset_password__422_short_password(self) -> None:
        """POST /auth/reset-password returns 422 when password is shorter than 8 characters."""
        payload = {"token": "rst_valid123", "new_password": "short"}
        res = self.client.post("/auth/reset-password", json=payload)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/auth/reset-password", "post", res.status_code)

    # --- 5. POST /auth/change-password ---

    def test_auth_change_password__200_valid_update(self) -> None:
        """POST /auth/change-password returns 200 when changing password."""
        self.mock_auth.change_password = AsyncMock(return_value=MessageResponse(message="Password changed."))
        payload = {"current_password": "NorthwindPass2026!", "new_password": "NewPassword2026!"}
        res = self.client.post("/auth/change-password", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/change-password", "post", res.status_code)

    def test_auth_change_password__401_unauthorized_without_token(self) -> None:
        """POST /auth/change-password returns 401 when calling without bearer token."""
        payload = {"current_password": "NorthwindPass2026!", "new_password": "NewPassword2026!"}
        res = self.client.post("/auth/change-password", json=payload)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/change-password", "post", res.status_code)

    def test_auth_change_password__422_short_new_password(self) -> None:
        """POST /auth/change-password returns 422 when password is invalid."""
        payload = {"current_password": "NorthwindPass2026!", "new_password": "short"}
        res = self.client.post("/auth/change-password", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/auth/change-password", "post", res.status_code)

    # --- 6. POST /auth/logout ---

    def test_auth_logout__200_successful_session_revocation(self) -> None:
        """POST /auth/logout returns 200 confirming session revocation."""
        self.mock_auth.logout = AsyncMock(return_value=MessageResponse(message="Logged out."))
        res = self.client.post("/auth/logout", json={"logout_all": False}, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/logout", "post", res.status_code)

    def test_auth_logout__401_unauthorized_without_token(self) -> None:
        """POST /auth/logout returns 401 when calling without bearer token."""
        res = self.client.post("/auth/logout", json={})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/logout", "post", res.status_code)

    # --- 7. GET /auth/me ---

    def test_auth_get_me__200_returns_user_profile(self) -> None:
        """GET /auth/me returns 200 with UserRead profile."""
        res = self.client.get("/auth/me", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/me", "get", res.status_code)

    def test_auth_get_me__401_unauthorized_without_token(self) -> None:
        """GET /auth/me returns 401 when calling without bearer token."""
        res = self.client.get("/auth/me")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/me", "get", res.status_code)

    # --- 8. GET /auth/api-keys ---

    def test_auth_list_api_keys__200_returns_keys(self) -> None:
        """GET /auth/api-keys returns 200 with ApiKeyListResponse."""
        self.mock_api_key.list_api_keys = AsyncMock(return_value=[])
        res = self.client.get("/auth/api-keys", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/api-keys", "get", res.status_code)

    def test_auth_list_api_keys__401_unauthorized_without_token(self) -> None:
        """GET /auth/api-keys returns 401 when calling without bearer token."""
        res = self.client.get("/auth/api-keys")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/api-keys", "get", res.status_code)

    # --- 9. POST /auth/api-keys ---

    def test_auth_create_api_key__201_creates_key_with_secret(self) -> None:
        """POST /auth/api-keys returns 201 with ApiKeyCreatedResponse."""
        key_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        mock_read = ApiKeyRead(
            id=key_id,
            name="Zapier CRM Sync",
            key_prefix="inno_live_xK9p",
            scopes=["*"],
            expires_at=None,
            last_used_at=None,
            is_revoked=False,
            created_at=now,
        )
        self.mock_api_key.create_api_key = AsyncMock(return_value=(mock_read, "inno_live_secret12345"))
        payload = {"name": "Zapier CRM Sync", "scopes": ["*"]}
        res = self.client.post("/auth/api-keys", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        validate_response_contract(res.json(), "/auth/api-keys", "post", res.status_code)

    def test_auth_create_api_key__401_unauthorized_without_token(self) -> None:
        """POST /auth/api-keys returns 401 when calling without bearer token."""
        payload = {"name": "Zapier CRM Sync"}
        res = self.client.post("/auth/api-keys", json=payload)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/api-keys", "post", res.status_code)

    def test_auth_create_api_key__422_empty_name(self) -> None:
        """POST /auth/api-keys returns 422 when name is blank."""
        payload = {"name": ""}
        res = self.client.post("/auth/api-keys", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/auth/api-keys", "post", res.status_code)

    # --- 10. DELETE /auth/api-keys/{key_id} ---

    def test_auth_revoke_api_key__200_revokes_key(self) -> None:
        """DELETE /auth/api-keys/{key_id} returns 200 confirming revocation."""
        key_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        mock_read = ApiKeyRead(
            id=key_id,
            name="Zapier CRM Sync",
            key_prefix="inno_live_xK9p",
            scopes=["*"],
            expires_at=None,
            last_used_at=None,
            is_revoked=True,
            created_at=now,
        )
        self.mock_api_key.revoke_api_key = AsyncMock(return_value=mock_read)
        res = self.client.delete(f"/auth/api-keys/{key_id}", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/auth/api-keys/{key_id}", "delete", res.status_code)

    def test_auth_revoke_api_key__401_unauthorized_without_token(self) -> None:
        """DELETE /auth/api-keys/{key_id} returns 401 when calling without bearer token."""
        key_id = uuid.uuid4()
        res = self.client.delete(f"/auth/api-keys/{key_id}")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/auth/api-keys/{key_id}", "delete", res.status_code)

    def test_auth_revoke_api_key__404_when_key_does_not_exist(self) -> None:
        """DELETE /auth/api-keys/{key_id} returns 404 when key is not found."""
        key_id = uuid.uuid4()
        self.mock_api_key.revoke_api_key = AsyncMock(side_effect=NotFoundError("API key not found."))
        res = self.client.delete(f"/auth/api-keys/{key_id}", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/auth/api-keys/{key_id}", "delete", res.status_code)

    def test_auth_revoke_api_key__422_invalid_uuid(self) -> None:
        """DELETE /auth/api-keys/{key_id} returns 422 when UUID parameter is invalid."""
        res = self.client.delete("/auth/api-keys/invalid-uuid", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/auth/api-keys/{key_id}", "delete", res.status_code)


if __name__ == "__main__":
    unittest.main()
