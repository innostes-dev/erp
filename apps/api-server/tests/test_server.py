"""Unit tests for Innostes ERP API Server Engine."""

import unittest
from pathlib import Path
import sys

# Make this app's own `app` package importable
app_root = Path(__file__).resolve().parents[1]
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from fastapi import APIRouter, status
from fastapi.testclient import TestClient

from app.engine import ServerEngine, ModuleLoader
from kernel.core.module import BaseModule


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
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("service", data)
        self.assertIn("modules", data)

    def test_config_endpoint(self) -> None:
        res = self.client.get("/config")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertIn("service", data)
        self.assertIn("version", data)
        self.assertIn("environment", data)

    def test_health_endpoint(self) -> None:
        # DB may not be running locally, so status is either pass (200) or fail (503)
        res = self.client.get("/health")
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
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
        self.assertEqual(sample_res.status_code, status.HTTP_200_OK)
        self.assertEqual(sample_res.json(), {"greeting": "hello from sample feature"})



class TestModuleConfigure(unittest.TestCase):
    """Modules can add middleware before the app starts; CORS stays outermost."""

    def test_configure_is_called_before_cors(self) -> None:
        calls: list[list[str]] = []

        class ConfiguringModule(BaseModule):
            name = "configuring"

            def configure(self, app) -> None:
                calls.append([m.cls.__name__ for m in app.user_middleware])

        engine = ServerEngine()
        engine.register_module(ConfiguringModule())
        app = engine.create_app()
        self.assertEqual(calls, [[]])  # nothing added yet when the module runs
        self.assertEqual(app.user_middleware[0].cls.__name__, "CORSMiddleware")  # outermost


class TestModuleDiscovery(unittest.TestCase):
    """Installed plug-in packages are found through entry points."""

    def test_discover_loads_kernel_tenancy(self) -> None:
        engine = ServerEngine()
        loaded = ModuleLoader(engine.registry).discover()
        names = [m.name for m in loaded]
        self.assertIn("tenancy", names)
        self.assertIn("setup", names)
        paths = engine.create_app().openapi()["paths"]
        self.assertIn("/tenants", paths)
        self.assertIn("/setup/status", paths)


if __name__ == "__main__":
    unittest.main()
