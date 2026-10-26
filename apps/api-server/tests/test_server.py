"""Unit tests for Innostes ERP API Server Engine."""

import unittest
from pathlib import Path
import sys

# Ensure repository root and app directory are on sys.path
repo_root = Path(__file__).resolve().parents[3]
app_root = Path(__file__).resolve().parents[1]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from fastapi import APIRouter
from fastapi.testclient import TestClient

from app.engine import ServerEngine, ModuleLoader
from kernel.module import BaseModule


class SampleFeatureModule(BaseModule):
    """Test feature module with an APIRouter."""
    name = "sample-feature"
    version = "1.0.0"

    def __init__(self) -> None:
        self.router = APIRouter(prefix="/sample", tags=["Sample"])
        @self.router.get("/hello")
        def hello() -> dict[str, str]:
            return {"greeting": "hello from sample feature"}


class TestServerEngine(unittest.TestCase):
    """Test API Server Engine lifecycle and endpoints."""

    def setUp(self) -> None:
        self.engine = ServerEngine()
        self.app = self.engine.create_app()
        self.client = TestClient(self.app)

    def test_root_endpoint(self) -> None:
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("service", data)
        self.assertIn("modules", data)

    def test_health_endpoint(self) -> None:
        # DB may not be running locally, so status is either pass (200) or fail (503)
        res = self.client.get("/health")
        self.assertIn(res.status_code, [200, 503])
        data = res.json()
        self.assertIn("status", data)
        self.assertIn("database", data)

    def test_module_mounting(self) -> None:
        engine = ServerEngine()
        sample_mod = SampleFeatureModule()
        engine.register_module(sample_mod)
        app = engine.create_app()
        client = TestClient(app)

        # Root shows module registered
        root_res = client.get("/")
        self.assertIn("sample-feature", root_res.json()["modules"])

        # Module route is reachable
        sample_res = client.get("/sample/hello")
        self.assertEqual(sample_res.status_code, 200)
        self.assertEqual(sample_res.json(), {"greeting": "hello from sample feature"})


if __name__ == "__main__":
    unittest.main()
