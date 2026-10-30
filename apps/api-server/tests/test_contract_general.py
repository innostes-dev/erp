"""Contract tests for General and Observability operations."""

import unittest
from unittest.mock import AsyncMock, patch
from fastapi import status
from fastapi.testclient import TestClient

from pathlib import Path
import sys

app_root = Path(__file__).resolve().parents[1]
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from app.main import app
from kernel.setup.services import install_state
from tests.contract_utils import validate_response_contract


class TestContractGeneral(unittest.TestCase):
    """Contract tests for service info, config, and health checks."""

    def setUp(self) -> None:
        install_state.mark_installed()
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
        self.client = TestClient(app)

    def test_system_root__200_returns_service_info(self) -> None:
        """GET / returns 200 with service information adhering to ServiceInfoRead schema."""
        res = self.client.get("/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/", "get", res.status_code)
        body = res.json()
        self.assertEqual(body["status"], "online")
        self.assertIn("service", body)
        self.assertIn("modules", body)

    def test_system_config__200_returns_app_config(self) -> None:
        """GET /config returns 200 with bootstrapping parameters adhering to AppConfigRead schema."""
        res = self.client.get("/config")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        validate_response_contract(res.json(), "/config", "get", res.status_code)
        body = res.json()
        self.assertIn("service", body)
        self.assertIn("version", body)
        self.assertIn("environment", body)

    def test_system_health__200_or_503_returns_diagnostic_health(self) -> None:
        """GET /health returns 200 (pass) or 503 (fail) matching HealthCheckRead schema."""
        res = self.client.get("/health")
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        validate_response_contract(res.json(), "/health", "get", res.status_code)
        body = res.json()
        self.assertIn(body["status"], ["pass", "fail"])
        self.assertIn("database", body)
        self.assertIn("modules", body)


if __name__ == "__main__":
    unittest.main()
