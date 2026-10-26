"""Tests for SetupRequiredMiddleware and the install-state cache."""

import unittest
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI, status
from fastapi.testclient import TestClient

from kernel.core.http import register_error_handlers
from kernel.setup import module
from kernel.setup.middleware import is_allowed_before_setup
from kernel.setup.services import InstallState, install_state


def build_app() -> FastAPI:
    """App configured like the API server: module middleware, error handler, routes."""
    app = FastAPI()
    module.configure(app)
    register_error_handlers(app)

    @app.get("/")
    def root() -> dict[str, str]:
        return {"service": "test"}

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "pass"}

    @app.get("/tenants")
    def tenants() -> list[str]:
        return []

    app.include_router(module.router)
    return app


class MiddlewareTestCase(unittest.TestCase):
    installed = False

    def setUp(self) -> None:
        install_state.reset()
        self.addCleanup(install_state.reset)
        self.exists = AsyncMock(return_value=self.installed)
        patcher = patch("kernel.setup.dependencies.installation_exists", self.exists)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.client = TestClient(build_app())


class TestBeforeInstall(MiddlewareTestCase):
    def test_normal_routes_get_setup_required(self) -> None:
        res = self.client.get("/tenants")
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(res.json(), {"detail": "Setup has not been completed", "code": "setup_required"})

    def test_allowed_paths_pass(self) -> None:
        for path in ("/", "/health", "/setup/status", "/openapi.json"):
            self.assertNotEqual(self.client.get(path).status_code, status.HTTP_503_SERVICE_UNAVAILABLE, path)

    def test_database_down_blocks_with_database_unavailable(self) -> None:
        self.exists.side_effect = OSError("refused")
        res = self.client.get("/tenants")
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(res.json()["code"], "database_unavailable")


class TestAfterInstall(MiddlewareTestCase):
    installed = True

    def test_normal_routes_pass_and_db_is_asked_once(self) -> None:
        for _ in range(3):
            self.assertEqual(self.client.get("/tenants").status_code, status.HTTP_200_OK)
        self.assertEqual(self.exists.await_count, 1)  # cached forever once installed


class TestAllowList(unittest.TestCase):
    def test_paths(self) -> None:
        for allowed in ("/", "/health", "/docs", "/docs/oauth2-redirect", "/redoc", "/openapi.json",
                        "/setup", "/setup/status", "/setup/checks"):
            self.assertTrue(is_allowed_before_setup(allowed), allowed)
        for blocked in ("/tenants", "/setupx", "/healthz", "/api/setup"):
            self.assertFalse(is_allowed_before_setup(blocked), blocked)


class TestInstallState(unittest.IsolatedAsyncioTestCase):
    async def test_not_installed_is_rechecked_after_interval(self) -> None:
        state = InstallState(recheck_seconds=5)
        check = AsyncMock(return_value=False)
        with patch("kernel.setup.services.state.time.monotonic", return_value=0.0):
            self.assertFalse(await state.is_installed(check))
            self.assertFalse(await state.is_installed(check))
        self.assertEqual(check.await_count, 1)
        check.return_value = True
        with patch("kernel.setup.services.state.time.monotonic", return_value=6.0):
            self.assertTrue(await state.is_installed(check))
        self.assertEqual(check.await_count, 2)

    async def test_mark_installed(self) -> None:
        state = InstallState()
        state.mark_installed()
        check = AsyncMock()
        self.assertTrue(await state.is_installed(check))
        check.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
