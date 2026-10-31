"""Contract tests for feature module and plugin info endpoints."""

from pathlib import Path
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock

app_root = Path(__file__).resolve().parents[1]
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from fastapi import status
from fastapi.testclient import TestClient

from app.main import app
from kernel.core.database import get_db
from tests.contract_utils import validate_response_contract


class TestContractModules(unittest.TestCase):
    """Contract tests verifying responses for module and plugin info endpoints."""

    def setUp(self) -> None:
        self.client = TestClient(app)

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

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_crm_info__200_returns_module_info(self) -> None:
        """GET /crm/info returns 200 with module metadata."""
        res = self.client.get("/crm/info")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/crm/info", "get", res.status_code)

    def test_hrms_info__200_returns_module_info(self) -> None:
        """GET /hrms/info returns 200 with module metadata."""
        res = self.client.get("/hrms/info")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/hrms/info", "get", res.status_code)

    def test_tracura_info__200_returns_plugin_info(self) -> None:
        """GET /plugins/tracura/info returns 200 with plugin metadata."""
        res = self.client.get("/plugins/tracura/info")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/plugins/tracura/info", "get", res.status_code)


if __name__ == "__main__":
    unittest.main()
