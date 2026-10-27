"""Tests for first-run setup: service, guarded routes, lock (no database needed)."""

from datetime import datetime, timezone
from pathlib import Path
import tempfile
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy.exc import IntegrityError

from kernel.core.config import Settings
from kernel.core.http import register_error_handlers
from kernel.setup import (
    AlreadyInstalledError,
    DatabaseUnavailableError,
    Installation,
    SetupChecks,
    SetupRequest,
    SetupResult,
    SetupService,
    SetupStatus,
    module,
)
from kernel.setup.router import get_service
from kernel.setup.services import attempt_limiter, install_state
from kernel.tenancy import SlugTakenError, Tenant, TenantRead
from kernel.user import User

ORG = {
    "name": "Acme Corporation",
    "slug": "acme",
    "country": "IN",
    "timezone": "Asia/Kolkata",
    "language": "en-IN",
    "date_format": "DD/MM/YYYY",
}
TOKEN = "test-setup-token"
GOOD = {"X-Setup-Token": TOKEN}
BAD = {"X-Setup-Token": "wrong"}


def fake_session() -> MagicMock:
    """Session whose lookups find nothing and whose writes fill DB defaults."""
    session = MagicMock()
    lookup = MagicMock()
    lookup.scalar_one_or_none.return_value = None
    session.execute = AsyncMock(return_value=lookup)
    session.flush = AsyncMock()
    session.commit = AsyncMock()

    async def refresh(obj):
        obj.created_at = obj.created_at or datetime.now(timezone.utc)
        obj.updated_at = obj.updated_at or obj.created_at

    session.refresh = AsyncMock(side_effect=refresh)
    return session


def make_service(installed: bool = False, db_ok: bool = True) -> SetupService:
    """A SetupService with its database checks stubbed out."""
    service = SetupService(fake_session(), app_version="0.1.0", engine=MagicMock())
    service.database_connected = AsyncMock(return_value=db_ok)
    service.is_installed = AsyncMock(return_value=installed)
    return service


class TestInstallationModel(unittest.TestCase):
    def test_single_row_is_enforced(self) -> None:
        table = Installation.__table__
        self.assertTrue(table.c.singleton.unique)
        self.assertFalse(table.c.singleton.nullable)
        self.assertTrue(any("singleton" in str(c.sqltext) for c in table.constraints if hasattr(c, "sqltext")))
        fk = next(iter(table.c.default_tenant_id.foreign_keys))
        self.assertEqual(fk.column.table.name, "tenants")


class TestSetupServiceChecks(unittest.IsolatedAsyncioTestCase):
    async def test_status_reveals_only_installed(self) -> None:
        self.assertEqual(await make_service(installed=False).status(), SetupStatus(installed=False))
        self.assertEqual(set(SetupStatus.model_fields), {"installed"})

    async def test_database_down_is_an_error_not_not_installed(self) -> None:
        # An installed system must never look "not installed" during a DB outage.
        with self.assertRaises(DatabaseUnavailableError):
            await make_service(installed=True, db_ok=False).status()

    async def test_checks_report_pending_migrations(self) -> None:
        with patch("kernel.setup.services.setup_service.pending_migrations", AsyncMock(return_value=["a", "b"])):
            checks = await make_service().checks()
        self.assertEqual(checks, SetupChecks(database_connected=True, migrations_pending=2))

    async def test_checks_database_down(self) -> None:
        with self.assertRaises(DatabaseUnavailableError):
            await make_service(db_ok=False).checks()


class TestSetupInstall(unittest.IsolatedAsyncioTestCase):
    async def test_install_runs_migrations_and_creates_tenant_and_row(self) -> None:
        service = make_service()
        with patch("kernel.setup.services.setup_service.run_migrations", AsyncMock()) as migrate:
            result = await service.install(SetupRequest(organization=ORG))
        migrate.assert_awaited_once()
        self.assertEqual(result.tenant.slug, "acme")
        added = [c.args[0] for c in service.session.add.call_args_list]
        added_types = [type(o) for o in added]
        self.assertIn(Tenant, added_types)
        self.assertIn(Installation, added_types)
        self.assertIn(User, added_types)
        tenant = next(o for o in added if isinstance(o, Tenant))
        installation = next(o for o in added if isinstance(o, Installation))
        admin_user = next(o for o in added if isinstance(o, User))
        self.assertEqual(installation.default_tenant_id, tenant.id)
        self.assertEqual(installation.app_version, "0.1.0")
        self.assertTrue(admin_user.is_super_admin)

    async def test_install_with_database_down(self) -> None:
        service = make_service(db_ok=False)
        with patch("kernel.setup.services.setup_service.run_migrations", AsyncMock()) as migrate:
            with self.assertRaises(DatabaseUnavailableError):
                await service.install(SetupRequest(organization=ORG))
        migrate.assert_not_awaited()

    async def test_install_twice_is_refused(self) -> None:
        service = make_service(installed=True)
        with patch("kernel.setup.services.setup_service.run_migrations", AsyncMock()) as migrate:
            with self.assertRaises(AlreadyInstalledError):
                await service.install(SetupRequest(organization=ORG))
        migrate.assert_not_awaited()

    async def test_concurrent_install_hits_unique_constraint(self) -> None:
        for side_effect in ([None, IntegrityError("insert", {}, Exception())], IntegrityError("i", {}, Exception())):
            service = make_service()
            service.session.flush = AsyncMock(side_effect=side_effect)
            with patch("kernel.setup.services.setup_service.run_migrations", AsyncMock()):
                with self.assertRaises(AlreadyInstalledError):
                    await service.install(SetupRequest(organization=ORG))


class SetupRouteTestCase(unittest.TestCase):
    """Base: app with the setup router, a known token and a fake installed flag."""

    installed = False
    setup_enabled = True

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.token_file = Path(self.tmp.name) / "setup-token"
        self.token_file.write_text("generated-token", encoding="utf-8")
        settings = Settings(
            setup_token=SecretStr(TOKEN),
            setup_token_file=self.token_file,
            setup_enabled=self.setup_enabled,
        )
        self.exists = AsyncMock(return_value=self.installed)
        for target, value in [
            ("kernel.setup.services.token.get_settings", lambda: settings),
            ("kernel.setup.dependencies.get_settings", lambda: settings),
            ("kernel.setup.dependencies.installation_exists", self.exists),
        ]:
            patcher = patch(target, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        install_state.reset()
        attempt_limiter.reset()
        self.addCleanup(install_state.reset)
        self.addCleanup(attempt_limiter.reset)
        self.addCleanup(self.tmp.cleanup)

        self.service = MagicMock()
        self.service.session.commit = AsyncMock()
        app = FastAPI()
        register_error_handlers(app)
        app.include_router(module.router)
        app.dependency_overrides[get_service] = lambda: self.service
        self.client = TestClient(app)

    def result(self) -> SetupResult:
        now = datetime.now(timezone.utc)
        tenant = TenantRead(id=uuid.uuid4(), created_at=now, updated_at=now, **ORG)
        return SetupResult(tenant=tenant, installed_at=now)


class TestSetupRoutesBeforeInstall(SetupRouteTestCase):
    def test_status_is_public_and_minimal(self) -> None:
        res = self.client.get("/setup/status")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json(), {"installed": False})

    def test_status_database_down_returns_503(self) -> None:
        self.exists.side_effect = OSError("refused")
        res = self.client.get("/setup/status")
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(res.json()["code"], "database_unavailable")

    def test_checks_need_token(self) -> None:
        self.service.checks = AsyncMock(return_value=SetupChecks(database_connected=True, migrations_pending=1))
        missing = self.client.get("/setup/checks")
        self.assertEqual(missing.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(missing.json()["code"], "invalid_setup_token")
        self.assertIn("X-Setup-Token", missing.headers["WWW-Authenticate"])
        self.assertEqual(self.client.get("/setup/checks", headers=BAD).status_code, status.HTTP_401_UNAUTHORIZED)
        ok = self.client.get("/setup/checks", headers=GOOD)
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        self.assertEqual(ok.json(), {"database_connected": True, "migrations_pending": 1})

    def test_install_needs_token(self) -> None:
        self.service.install = AsyncMock(return_value=self.result())
        res = self.client.post("/setup", json={"organization": ORG}, headers=BAD)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.service.install.assert_not_awaited()

    def test_install_success_commits_locks_and_discards_token(self) -> None:
        self.service.install = AsyncMock(return_value=self.result())
        res = self.client.post("/setup", json={"organization": ORG}, headers=GOOD)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()["tenant"]["slug"], "acme")
        self.service.session.commit.assert_awaited_once()
        self.assertFalse(self.token_file.exists())
        # Locked from now on: the same request is a 404, token not even checked.
        again = self.client.post("/setup", json={"organization": ORG}, headers=BAD)
        self.assertEqual(again.status_code, status.HTTP_404_NOT_FOUND)

    def test_install_conflicts_return_409(self) -> None:
        for error in (AlreadyInstalledError(), SlugTakenError("acme")):
            self.service.install = AsyncMock(side_effect=error)
            res = self.client.post("/setup", json={"organization": ORG}, headers=GOOD)
            self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)

    def test_install_validates_body(self) -> None:
        bad = {**ORG, "slug": "Not A Slug"}
        res = self.client.post("/setup", json={"organization": bad}, headers=GOOD)
        self.assertEqual(res.status_code, status.HTTP_422_UNPROCESSABLE_CONTENT)

    def test_too_many_wrong_tokens_returns_429(self) -> None:
        for _ in range(attempt_limiter.max_attempts):
            self.assertEqual(self.client.get("/setup/checks", headers=BAD).status_code, status.HTTP_401_UNAUTHORIZED)
        res = self.client.get("/setup/checks", headers=GOOD)  # even the right token waits
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertGreater(int(res.headers["Retry-After"]), 0)


class TestSetupRoutesAfterInstall(SetupRouteTestCase):
    installed = True

    def test_status_says_installed(self) -> None:
        self.assertEqual(self.client.get("/setup/status").json(), {"installed": True})

    def test_action_routes_are_gone(self) -> None:
        self.service.install = AsyncMock()
        for res in (
            self.client.get("/setup/checks", headers=GOOD),
            self.client.post("/setup", json={"organization": ORG}, headers=GOOD),
            self.client.post("/setup", json={"organization": ORG}),
        ):
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.service.install.assert_not_awaited()


class TestSetupRoutesDisabled(SetupRouteTestCase):
    setup_enabled = False

    def test_web_setup_disabled_returns_404(self) -> None:
        self.assertEqual(self.client.get("/setup/checks", headers=GOOD).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.post("/setup", json={"organization": ORG}, headers=GOOD).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.get("/setup/status").json(), {"installed": False})


class TestSetupApiDocs(unittest.TestCase):
    def test_endpoints_documented(self) -> None:
        app = FastAPI(openapi_tags=module.openapi_tags)
        app.include_router(module.router)
        spec = app.openapi()
        self.assertEqual(spec["tags"][0]["name"], "Setup")
        for path, ops in spec["paths"].items():
            for method, op in ops.items():
                where = f"{method.upper()} {path}"
                self.assertTrue(op.get("summary"), where)
                self.assertTrue(op.get("description"), where)
                self.assertNotIn("Args:", op["description"], where)
                self.assertTrue(op["operationId"].startswith("setup_"), where)
        post = spec["paths"]["/setup"]["post"]
        for code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND, status.HTTP_409_CONFLICT,
                     status.HTTP_429_TOO_MANY_REQUESTS, status.HTTP_503_SERVICE_UNAVAILABLE):
            self.assertIn(str(code), post["responses"])
        self.assertIn("SetupToken", spec["components"]["securitySchemes"])


if __name__ == "__main__":
    unittest.main()
