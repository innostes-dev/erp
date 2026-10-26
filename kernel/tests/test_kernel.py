"""Unit tests for Innostes ERP Kernel."""

from pathlib import Path
import sys
import unittest

# Ensure repository root is on sys.path
repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from kernel.config import Settings, get_settings, PostgresSettings
from kernel.database import Base, BaseModel
from kernel.module import BaseModule, ModuleRegistry


class DummyModel(BaseModel):
    """Test model inheriting from BaseModel."""
    __tablename__ = "dummy_test_table"


class DummyModule(BaseModule):
    """Test module inheriting from BaseModule."""
    name = "dummy-module"
    version = "1.0.0"
    description = "Dummy test module"


class TestKernelConfig(unittest.TestCase):
    """Test kernel configuration and environment discovery."""

    def test_settings_load(self) -> None:
        settings = get_settings()
        self.assertIsInstance(settings, Settings)
        self.assertIsInstance(settings.db, PostgresSettings)
        self.assertEqual(settings.db.host, "localhost")

    def test_masked_url(self) -> None:
        settings = get_settings()
        self.assertNotIn("postgres:postgres@", settings.db.masked_url)
        self.assertIn("postgresql+asyncpg://postgres:***@localhost", settings.db.masked_url)


class TestKernelDatabase(unittest.TestCase):
    """Test kernel database abstractions."""

    def test_base_model_instantiation(self) -> None:
        model = DummyModel()
        self.assertIsNotNone(model.id)
        d = model.to_dict()
        self.assertIn("id", d)
        self.assertEqual(d["id"], str(model.id))


class TestKernelModule(unittest.TestCase):
    """Test kernel module contract and registry."""

    def test_module_registry(self) -> None:
        registry = ModuleRegistry()
        module = DummyModule()
        registry.register(module)

        self.assertEqual(len(registry), 1)
        self.assertEqual(registry.get("dummy-module"), module)
        self.assertIn(module, registry.list_modules())

        registry.unregister("dummy-module")
        self.assertEqual(len(registry), 0)


if __name__ == "__main__":
    unittest.main()
