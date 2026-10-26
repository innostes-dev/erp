"""Unit tests for Innostes ERP Kernel."""

import unittest

from kernel.core.config import Settings, get_settings, PostgresSettings
from kernel.core.database import Base, BaseModel
from kernel.core.module import BaseModule, ModuleRegistry


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

    def test_split_settings_modules(self) -> None:
        from kernel.core.database.db_settings import PostgresSettings as DbPgSettings

        custom_db = DbPgSettings.from_env({"DB_HOST": "db.custom.net", "DB_PORT": "5433"})
        self.assertEqual(custom_db.host, "db.custom.net")
        self.assertEqual(custom_db.port, 5433)

    def test_database_uri_precedence(self) -> None:
        from kernel.core.database.db_settings import PostgresSettings
        from pydantic import SecretStr

        # If URI is given, it takes precedence over individual host/port
        settings = PostgresSettings(
            uri=SecretStr("postgresql://admin:secret123@prod-db.internal:5439/enterprise_db"),
            host="ignored-localhost",
            port=5432,
        )
        url = settings.async_url
        self.assertEqual(url.drivername, "postgresql+asyncpg")
        self.assertEqual(url.host, "prod-db.internal")
        self.assertEqual(url.port, 5439)
        self.assertEqual(url.database, "enterprise_db")
        self.assertEqual(url.username, "admin")
        self.assertNotIn("secret123", settings.masked_url)

    def test_database_uri_from_env(self) -> None:
        from kernel.core.database.db_settings import PostgresSettings

        env = {
            "DATABASE_URL": "postgresql://envuser:envpass@remote-host:5433/env_db",
            "DB_HOST": "ignored-host",
        }
        settings = PostgresSettings.from_env(env)
        self.assertEqual(settings.async_url.host, "remote-host")
        self.assertEqual(settings.async_url.database, "env_db")
        self.assertEqual(settings.async_url.drivername, "postgresql+asyncpg")


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
