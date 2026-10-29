"""Contract tests for User management endpoints."""

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
from kernel.core.database import get_db
from kernel.core.security.jwt import create_access_token
from kernel.core.services.errors import UnauthorizedError
from kernel.user.models.user import User, UserStatus
from kernel.user.router import get_current_user_dep, get_service
from kernel.user.schemas import UserRead
from kernel.user.services import EmailAlreadyExistsError, UserNotFoundError
from tests.contract_utils import validate_response_contract


class TestContractUser(unittest.TestCase):
    """Contract tests verifying request and response adherence for /users endpoints."""

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.mock_service = MagicMock()
        self.user_id = uuid.UUID("3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f")
        self.actor_id = uuid.UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        self.now = datetime.now(timezone.utc)

        self.mock_actor = User(
            id=self.actor_id,
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

        self.mock_user = User(
            id=self.user_id,
            first_name="Arjun",
            last_name="Mehta",
            email_hash="hash_arjun",
            email_encrypted="enc_arjun",
            password_hash="pass_arjun",
            status=UserStatus.ACTIVE,
            is_super_admin=False,
            token_version=1,
            created_at=self.now,
            updated_at=self.now,
        )

        self.mock_user_read = UserRead(
            id=self.user_id,
            first_name="Arjun",
            last_name="Mehta",
            email="arjun.mehta@northwind.example",
            status=UserStatus.ACTIVE,
            is_super_admin=False,
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
        app.dependency_overrides[get_service] = lambda: self.mock_service

        async def fake_current_user():
            return self.mock_actor

        app.dependency_overrides[get_current_user_dep] = fake_current_user

        self.mock_service.to_user_read = MagicMock(return_value=self.mock_user_read)
        self.mock_service.create_user = AsyncMock(return_value=self.mock_user)
        self.mock_service.get_by_id = AsyncMock(return_value=self.mock_user)

        self.token = create_access_token({"sub": str(self.actor_id), "type": "access", "token_version": 1})
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    # --- 1. POST /users ---

    def test_users_create_user__201_valid_user(self) -> None:
        """POST /users returns 201 with UserRead contract."""
        payload = {
            "first_name": "Arjun",
            "last_name": "Mehta",
            "email": "arjun.mehta@northwind.example",
            "password": "NorthwindPass2026!",
        }
        res = self.client.post("/users", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        validate_response_contract(res.json(), "/users", "post", res.status_code)

    def test_users_create_user__401_unauthorized(self) -> None:
        """POST /users returns 401 when calling without bearer token."""
        async def fake_unauth():
            raise UnauthorizedError()
        app.dependency_overrides[get_current_user_dep] = fake_unauth
        payload = {
            "first_name": "Arjun",
            "last_name": "Mehta",
            "email": "arjun.mehta@northwind.example",
            "password": "NorthwindPass2026!",
        }
        res = self.client.post("/users", json=payload)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/users", "post", res.status_code)

    def test_users_create_user__409_email_exists(self) -> None:
        """POST /users returns 409 when user email is already registered."""
        self.mock_service.create_user = AsyncMock(side_effect=EmailAlreadyExistsError("arjun.mehta@northwind.example"))
        payload = {
            "first_name": "Arjun",
            "last_name": "Mehta",
            "email": "arjun.mehta@northwind.example",
            "password": "NorthwindPass2026!",
        }
        res = self.client.post("/users", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        validate_response_contract(res.json(), "/users", "post", res.status_code)

    def test_users_create_user__422_missing_email(self) -> None:
        """POST /users returns 422 when required schema fields are missing."""
        payload = {
            "first_name": "Arjun",
            "last_name": "Mehta",
            "password": "NorthwindPass2026!",
        }
        res = self.client.post("/users", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/users", "post", res.status_code)

    # --- 2. GET /users/{user_id} ---

    def test_users_get_user__200_returns_user(self) -> None:
        """GET /users/{user_id} returns 200 with UserRead contract."""
        res = self.client.get(f"/users/{self.user_id}", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/users/{user_id}", "get", res.status_code)

    def test_users_get_user__401_unauthorized(self) -> None:
        """GET /users/{user_id} returns 401 when calling without bearer token."""
        async def fake_unauth():
            raise UnauthorizedError()
        app.dependency_overrides[get_current_user_dep] = fake_unauth
        res = self.client.get(f"/users/{self.user_id}")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/users/{user_id}", "get", res.status_code)

    def test_users_get_user__404_when_user_does_not_exist(self) -> None:
        """GET /users/{user_id} returns 404 when user is not found."""
        self.mock_service.get_by_id = AsyncMock(return_value=None)
        res = self.client.get(f"/users/{self.user_id}", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/users/{user_id}", "get", res.status_code)

    def test_users_get_user__422_invalid_uuid(self) -> None:
        """GET /users/{user_id} returns 422 when UUID is invalid."""
        res = self.client.get("/users/invalid-uuid-string", headers=self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/users/{user_id}", "get", res.status_code)


if __name__ == "__main__":
    unittest.main()
