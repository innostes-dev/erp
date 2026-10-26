"""Command-line installer: set up the system without the web wizard.

Use it for servers, Docker, Kubernetes and CI, where nobody clicks through a
web page. It talks to the database configured in `.env`, like the API.

    python -m kernel.setup status
    python -m kernel.setup install --name "Acme Corporation" --slug acme \\
        --country IN --timezone Asia/Kolkata --language en-IN --date-format DD/MM/YYYY
    python -m kernel.setup install --from-env
    python -m kernel.setup token

`--from-env` reads SETUP_ORG_NAME, SETUP_ORG_SLUG, SETUP_ORG_COUNTRY,
SETUP_ORG_TIMEZONE, SETUP_ORG_LANGUAGE and SETUP_ORG_DATE_FORMAT from the
environment or the same `.env` files the API uses.

Exit codes: 0 success, 1 already installed, 2 invalid input, 3 database unavailable.
"""

import argparse
import asyncio
from collections.abc import Mapping, Sequence
import sys

from pydantic import ValidationError

from kernel.core.config import get_settings, load_env
from kernel.core.database import close_db
from kernel.core.database.session import get_sessionmaker
from kernel.setup.schemas import SetupRequest
from kernel.setup.services import (
    AlreadyInstalledError,
    DatabaseUnavailableError,
    SetupService,
    discard_setup_token,
    get_setup_token,
    installation_exists,
)
from kernel.tenancy import SlugTakenError

EXIT_OK = 0
EXIT_ALREADY_INSTALLED = 1
EXIT_INVALID_INPUT = 2
EXIT_DATABASE_UNAVAILABLE = 3

ENV_FIELDS = {
    "name": "SETUP_ORG_NAME",
    "slug": "SETUP_ORG_SLUG",
    "country": "SETUP_ORG_COUNTRY",
    "timezone": "SETUP_ORG_TIMEZONE",
    "language": "SETUP_ORG_LANGUAGE",
    "date_format": "SETUP_ORG_DATE_FORMAT",
}
"""Organisation field -> environment variable used by `install --from-env`."""


def build_parser() -> argparse.ArgumentParser:
    """Create the argument parser for the installer."""
    parser = argparse.ArgumentParser(prog="python -m kernel.setup", description="Innostes ERP first-run setup.")
    commands = parser.add_subparsers(dest="command", required=True)

    commands.add_parser("status", help="Show whether the system is installed.")
    commands.add_parser("token", help="Print the web-setup token (generates one if needed).")

    install = commands.add_parser("install", help="Install the system and create the first organisation.")
    install.add_argument("--from-env", action="store_true", help="Read organisation fields from SETUP_ORG_* variables.")
    install.add_argument("--name", help="Organisation name.")
    install.add_argument("--slug", help="Organisation slug (lowercase letters, digits and dashes).")
    install.add_argument("--country", help="ISO country code, e.g. IN.")
    install.add_argument("--timezone", help="IANA time zone, e.g. Asia/Kolkata.")
    install.add_argument("--language", help="Language tag, e.g. en-IN.")
    install.add_argument("--date-format", dest="date_format", help="Date format, e.g. DD/MM/YYYY.")
    return parser


def organization_from_args(args: argparse.Namespace, env: Mapping[str, str]) -> dict[str, str]:
    """Collect organisation fields from `--from-env` variables and/or flags (flags win).

    Args:
        args: Parsed `install` arguments.
        env: Environment variables.

    Returns:
        Field name -> value, only for fields that were given.
    """
    values: dict[str, str] = {}
    if args.from_env:
        values.update({field: env[var] for field, var in ENV_FIELDS.items() if env.get(var)})
    values.update({field: getattr(args, field) for field in ENV_FIELDS if getattr(args, field, None)})
    return values


async def _status() -> int:
    try:
        installed = await installation_exists()
    except Exception as exc:
        print(f"Database unavailable: {exc}", file=sys.stderr)
        return EXIT_DATABASE_UNAVAILABLE
    print("installed" if installed else "not installed")
    return EXIT_OK


async def _install(request: SetupRequest) -> int:
    session = get_sessionmaker()()
    service = SetupService(session, app_version=get_settings().app_version)
    try:
        result = await service.install(request)
        await session.commit()
    except AlreadyInstalledError:
        await session.rollback()
        print("Already installed. Nothing to do.", file=sys.stderr)
        return EXIT_ALREADY_INSTALLED
    except SlugTakenError as exc:
        await session.rollback()
        print(exc.message, file=sys.stderr)
        return EXIT_INVALID_INPUT
    except DatabaseUnavailableError as exc:
        await session.rollback()
        print(exc.message, file=sys.stderr)
        return EXIT_DATABASE_UNAVAILABLE
    finally:
        await session.close()
    discard_setup_token()
    print(f"Installed. Organisation '{result.tenant.name}' ({result.tenant.slug}) created.")
    return EXIT_OK


def main(argv: Sequence[str] | None = None, env: Mapping[str, str] | None = None) -> int:
    """Run the installer.

    Args:
        argv: Command-line arguments (defaults to `sys.argv[1:]`).
        env: Variables for `--from-env` (defaults to `.env` files + environment).

    Returns:
        Process exit code.
    """
    args = build_parser().parse_args(argv)
    env = load_env() if env is None else env

    if args.command == "token":
        token = get_setup_token()
        print(token.value)
        return EXIT_OK

    if args.command == "status":
        return _run(_status())

    try:
        request = SetupRequest(organization=organization_from_args(args, env))
    except ValidationError as exc:
        print("Invalid organisation details:", file=sys.stderr)
        for err in exc.errors():
            field = ".".join(str(p) for p in err["loc"][1:]) or "organization"
            print(f"  {field}: {err['msg']}", file=sys.stderr)
        return EXIT_INVALID_INPUT
    return _run(_install(request))


def _run(coro) -> int:
    """Run a coroutine, then close the database pool."""

    async def runner() -> int:
        try:
            return await coro
        finally:
            await close_db()

    return asyncio.run(runner())


if __name__ == "__main__":
    sys.exit(main())
