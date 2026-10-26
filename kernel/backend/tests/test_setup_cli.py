"""Tests for the command-line installer (`python -m kernel.setup`)."""

import io
import unittest
from contextlib import redirect_stderr, redirect_stdout
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

from kernel.setup import __main__ as cli
from kernel.setup.schemas import SetupResult
from kernel.setup.services import AlreadyInstalledError, DatabaseUnavailableError
from kernel.tenancy import SlugTakenError, TenantRead

ARGS = ["install", "--name", "Acme Corporation", "--slug", "acme", "--country", "IN"]


def run_default_env(argv):
    """Run the CLI without passing env, so it loads .env files itself."""
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = cli.main(argv)
    return code, out.getvalue(), err.getvalue()


def run(argv, env=None):
    """Run the CLI, capturing output. Returns (exit code, stdout, stderr)."""
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = cli.main(argv, env or {})
    return code, out.getvalue(), err.getvalue()


class TestOrganizationArgs(unittest.TestCase):
    def test_flags(self) -> None:
        args = cli.build_parser().parse_args(ARGS)
        self.assertEqual(
            cli.organization_from_args(args, {}),
            {"name": "Acme Corporation", "slug": "acme", "country": "IN"},
        )

    def test_from_env_with_flag_override(self) -> None:
        env = {"SETUP_ORG_NAME": "Env Co", "SETUP_ORG_SLUG": "env-co", "SETUP_ORG_TIMEZONE": "UTC"}
        args = cli.build_parser().parse_args(["install", "--from-env", "--slug", "override"])
        self.assertEqual(
            cli.organization_from_args(args, env),
            {"name": "Env Co", "slug": "override", "timezone": "UTC"},
        )


class TestInstallCommand(unittest.TestCase):
    def setUp(self) -> None:
        self.service = MagicMock()
        self.session = MagicMock(commit=AsyncMock(), rollback=AsyncMock(), close=AsyncMock())
        for target, value in [
            ("kernel.setup.__main__.SetupService", MagicMock(return_value=self.service)),
            ("kernel.setup.__main__.get_sessionmaker", MagicMock(return_value=MagicMock(return_value=self.session))),
            ("kernel.setup.__main__.close_db", AsyncMock()),
            ("kernel.setup.__main__.discard_setup_token", MagicMock()),
        ]:
            p = patch(target, value)
            p.start()
            self.addCleanup(p.stop)

    def test_success(self) -> None:
        now = datetime.now(timezone.utc)
        tenant = TenantRead(id=uuid.uuid4(), name="Acme Corporation", slug="acme", created_at=now, updated_at=now)
        self.service.install = AsyncMock(return_value=SetupResult(tenant=tenant, installed_at=now))
        code, out, _ = run(ARGS)
        self.assertEqual(code, cli.EXIT_OK)
        self.assertIn("Installed", out)
        self.session.commit.assert_awaited_once()
        cli.discard_setup_token.assert_called_once()

    def test_exit_codes(self) -> None:
        cases = [
            (AlreadyInstalledError(), cli.EXIT_ALREADY_INSTALLED),
            (SlugTakenError("acme"), cli.EXIT_INVALID_INPUT),
            (DatabaseUnavailableError(), cli.EXIT_DATABASE_UNAVAILABLE),
        ]
        for error, expected in cases:
            self.service.install = AsyncMock(side_effect=error)
            code, _, err = run(ARGS)
            self.assertEqual(code, expected, type(error).__name__)
            self.assertTrue(err)

    def test_invalid_input(self) -> None:
        code, _, err = run(["install", "--name", "Acme", "--slug", "Bad Slug"])
        self.assertEqual(code, cli.EXIT_INVALID_INPUT)
        self.assertIn("slug", err)
        code, _, _ = run(["install"])  # nothing given
        self.assertEqual(code, cli.EXIT_INVALID_INPUT)


class TestFromEnvReadsDotEnv(unittest.TestCase):
    def test_main_uses_env_files_by_default(self) -> None:
        env = {"SETUP_ORG_NAME": "Dot Env Co", "SETUP_ORG_SLUG": "dot-env"}
        with (
            patch("kernel.setup.__main__.load_env", return_value=env) as load,
            patch("kernel.setup.__main__._run", return_value=cli.EXIT_OK) as runner,
        ):
            code, _, _ = run_default_env(["install", "--from-env"])
        self.assertEqual(code, cli.EXIT_OK)
        load.assert_called_once()
        runner.call_args.args[0].close()  # the install coroutine was built from the .env values


class TestStatusAndToken(unittest.TestCase):
    def test_status(self) -> None:
        with patch("kernel.setup.__main__.close_db", AsyncMock()):
            with patch("kernel.setup.__main__.installation_exists", AsyncMock(return_value=True)):
                self.assertEqual(run(["status"])[:2], (cli.EXIT_OK, "installed\n"))
            with patch("kernel.setup.__main__.installation_exists", AsyncMock(side_effect=OSError("down"))):
                self.assertEqual(run(["status"])[0], cli.EXIT_DATABASE_UNAVAILABLE)

    def test_token(self) -> None:
        with patch("kernel.setup.__main__.get_setup_token", return_value=MagicMock(value="abc")):
            self.assertEqual(run(["token"])[:2], (cli.EXIT_OK, "abc\n"))


if __name__ == "__main__":
    unittest.main()
