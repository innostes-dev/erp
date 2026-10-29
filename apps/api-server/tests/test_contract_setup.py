"""Contract tests for Setup endpoints."""

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
from kernel.core.services import TooManyRequestsError
from kernel.setup.dependencies import (
    is_installed_cached,
    require_setup_available,
    require_setup_token,
)
from kernel.setup.router import get_service
from kernel.setup.schemas import (
    SetupChecks,
    SetupRequest,
    SetupResult,
    SetupStatus,
)
from kernel.setup.services import (
    AlreadyInstalledError,
    DatabaseUnavailableError,
    InvalidSetupTokenError,
    SetupNotAvailableError,
)
from kernel.tenancy.schemas import TenantRead
from kernel.user.models.user import UserStatus
from kernel.user.schemas import UserRead
from tests.contract_utils import validate_response_contract


class TestContractSetup(unittest.TestCase):
    """Contract tests verifying request and response adherence for /setup endpoints."""

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.mock_service = MagicMock()

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

        self.valid_setup_token = "inno_setup_secret_token_123"
        self.setup_headers = {"X-Setup-Token": self.valid_setup_token}

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    # --- 1. GET /setup/status ---

    def test_setup_status__200_returns_status(self) -> None:
        """GET /setup/status returns 200 with SetupStatus contract."""
        async def mock_installed():
            return False

        app.dependency_overrides[is_installed_cached] = mock_installed
        res = self.client.get("/setup/status")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/setup/status", "get", res.status_code)

    def test_setup_status__503_database_unavailable(self) -> None:
        """GET /setup/status returns 503 when database check fails."""
        async def mock_fail():
            raise DatabaseUnavailableError()

        app.dependency_overrides[is_installed_cached] = mock_fail
        res = self.client.get("/setup/status")
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        validate_response_contract(res.json(), "/setup/status", "get", res.status_code)

    # --- 2. GET /setup/checks ---

    def test_setup_checks__200_returns_checks(self) -> None:
        """GET /setup/checks returns 200 with SetupChecks contract."""
        async def allow_setup():
            return None

        async def allow_token():
            return self.valid_setup_token

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = allow_token

        self.mock_service.checks = AsyncMock(
            return_value=SetupChecks(
                database_connected=True,
                migrations_pending=0,
            )
        )
        res = self.client.get("/setup/checks", headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/setup/checks", "get", res.status_code)

    def test_setup_checks__401_invalid_token(self) -> None:
        """GET /setup/checks returns 401 when token is invalid or missing."""
        async def allow_setup():
            return None

        async def reject_token():
            raise InvalidSetupTokenError()

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = reject_token

        res = self.client.get("/setup/checks")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/setup/checks", "get", res.status_code)

    def test_setup_checks__404_already_installed_or_disabled(self) -> None:
        """GET /setup/checks returns 404 once installation is completed."""
        async def block_setup():
            raise SetupNotAvailableError()

        app.dependency_overrides[require_setup_available] = block_setup
        res = self.client.get("/setup/checks", headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/setup/checks", "get", res.status_code)

    def test_setup_checks__429_too_many_attempts(self) -> None:
        """GET /setup/checks returns 429 when attempt rate limit is exceeded."""
        async def allow_setup():
            return None

        async def rate_limit():
            raise TooManyRequestsError("Too many incorrect setup token attempts. Please wait 15 minutes.")

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = rate_limit

        res = self.client.get("/setup/checks", headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        validate_response_contract(res.json(), "/setup/checks", "get", res.status_code)

    def test_setup_checks__503_database_unavailable(self) -> None:
        """GET /setup/checks returns 503 when database connectivity check fails."""
        async def allow_setup():
            return None

        async def allow_token():
            return self.valid_setup_token

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = allow_token
        self.mock_service.checks = AsyncMock(side_effect=DatabaseUnavailableError())

        res = self.client.get("/setup/checks", headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        validate_response_contract(res.json(), "/setup/checks", "get", res.status_code)

    # --- 3. POST /setup ---

    def _sample_setup_payload(self) -> dict:
        return {
            "organization": {
                "name": "Northwind Traders Pvt Ltd",
                "slug": "northwind-traders",
                "country": "IN",
                "timezone": "Asia/Kolkata",
                "language": "en-IN",
                "date_format": "DD/MM/YYYY",
            },
            "admin": {
                "first_name": "Priya",
                "last_name": "Shah",
                "email": "priya.shah@northwind.example",
                "password": "NorthwindPass2026!",
            },
            "branding": {
                "theme": "system",
                "primary_color": "#2563EB",
            },
        }

    def test_setup_install__201_successful_install(self) -> None:
        """POST /setup returns 201 with SetupResult contract."""
        async def allow_setup():
            return None

        async def allow_token():
            return self.valid_setup_token

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = allow_token

        org_id = uuid.uuid4()
        admin_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        self.mock_service.session = MagicMock()
        self.mock_service.session.commit = AsyncMock()
        self.mock_service.install = AsyncMock(
            return_value=SetupResult(
                tenant=TenantRead(
                    id=org_id,
                    name="Northwind Traders Pvt Ltd",
                    slug="northwind-traders",
                    country="IN",
                    timezone="Asia/Kolkata",
                    language="en-IN",
                    date_format="DD/MM/YYYY",
                    created_at=now,
                    updated_at=now,
                ),
                admin=UserRead(
                    id=admin_id,
                    first_name="Priya",
                    last_name="Shah",
                    email="priya.shah@northwind.example",
                    status=UserStatus.ACTIVE,
                    is_super_admin=True,
                    token_version=1,
                    created_at=now,
                    updated_at=now,
                ),
                installed_at=now,
            )
        )
        res = self.client.post("/setup", json=self._sample_setup_payload(), headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        validate_response_contract(res.json(), "/setup", "post", res.status_code)

    def test_setup_install__401_invalid_token(self) -> None:
        """POST /setup returns 401 when setup token is invalid."""
        async def allow_setup():
            return None

        async def reject_token():
            raise InvalidSetupTokenError()

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = reject_token

        res = self.client.post("/setup", json=self._sample_setup_payload())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        validate_response_contract(res.json(), "/setup", "post", res.status_code)

    def test_setup_install__404_already_installed_or_disabled(self) -> None:
        """POST /setup returns 404 once installed or disabled."""
        async def block_setup():
            raise SetupNotAvailableError()

        app.dependency_overrides[require_setup_available] = block_setup
        res = self.client.post("/setup", json=self._sample_setup_payload(), headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        validate_response_contract(res.json(), "/setup", "post", res.status_code)

    def test_setup_install__409_already_installed_race(self) -> None:
        """POST /setup returns 409 when concurrent install race occurs."""
        async def allow_setup():
            return None

        async def allow_token():
            return self.valid_setup_token

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = allow_token
        self.mock_service.session = MagicMock()
        self.mock_service.install = AsyncMock(side_effect=AlreadyInstalledError())

        res = self.client.post("/setup", json=self._sample_setup_payload(), headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        validate_response_contract(res.json(), "/setup", "post", res.status_code)

    def test_setup_install__422_missing_admin_email(self) -> None:
        """POST /setup returns 422 when required schema fields are missing."""
        async def allow_setup():
            return None

        async def allow_token():
            return self.valid_setup_token

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = allow_token

        bad_payload = self._sample_setup_payload()
        del bad_payload["admin"]["email"]
        res = self.client.post("/setup", json=bad_payload, headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        validate_response_contract(res.json(), "/setup", "post", res.status_code)

    def test_setup_install__429_too_many_attempts(self) -> None:
        """POST /setup returns 429 when attempt rate limit is exceeded."""
        async def allow_setup():
            return None

        async def rate_limit():
            raise TooManyRequestsError("Too many incorrect setup token attempts. Please wait 15 minutes.")

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = rate_limit

        res = self.client.post("/setup", json=self._sample_setup_payload(), headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        validate_response_contract(res.json(), "/setup", "post", res.status_code)

    def test_setup_install__503_database_unavailable(self) -> None:
        """POST /setup returns 503 when database is unreachable during install."""
        async def allow_setup():
            return None

        async def allow_token():
            return self.valid_setup_token

        app.dependency_overrides[require_setup_available] = allow_setup
        app.dependency_overrides[require_setup_token] = allow_token
        self.mock_service.session = MagicMock()
        self.mock_service.install = AsyncMock(side_effect=DatabaseUnavailableError())

        res = self.client.post("/setup", json=self._sample_setup_payload(), headers=self.setup_headers)
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        validate_response_contract(res.json(), "/setup", "post", res.status_code)


if __name__ == "__main__":
    unittest.main()
