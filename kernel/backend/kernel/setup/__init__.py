"""Setup feature: secure first-run installation.

A fresh database must be installed once, either from the command line
(`python -m kernel.setup install ...`) or through the web wizard. The web
wizard is protected by a one-time setup token printed in the server log.
Until then, every other API route answers 503 `setup_required`. After
install the setup action routes return 404.

Layout:
    models/         `Installation` (single-row table)
    schemas/        `SetupStatus`, `SetupChecks`, `SetupRequest`, `SetupResult`
    services/       `SetupService`, install-state cache, setup token
    dependencies.py route guards (available? token valid?)
    middleware.py   `SetupRequiredMiddleware`
    router.py       `GET /setup/status`, `GET /setup/checks`, `POST /setup`
    __main__.py     command-line installer
"""

import logging

from fastapi import FastAPI

from kernel.core.config import get_settings
from kernel.core.module import BaseModule
from kernel.setup.middleware import SetupRequiredMiddleware
from kernel.setup.models import Installation
from kernel.setup.router import TAG, router
from kernel.setup.schemas import SetupChecks, SetupRequest, SetupResult, SetupStatus
from kernel.setup.services import (
    AlreadyInstalledError,
    DatabaseUnavailableError,
    InvalidSetupTokenError,
    SetupNotAvailableError,
    SetupRequiredError,
    SetupService,
    get_setup_token,
    installation_exists,
)

logger = logging.getLogger("kernel.setup")


class SetupModule(BaseModule):
    """Plugs first-run setup (routes, middleware, API docs section) into the API server."""

    name = "setup"
    version = "0.2.0"
    description = "First-run installation"
    router = router
    openapi_tags = [
        {
            "name": TAG,
            "description": (
                "First-run installation. `GET /setup/status` tells the UI whether to show "
                "the setup wizard. `GET /setup/checks` and `POST /setup` require the "
                "`X-Setup-Token` header (printed in the server log on first start) and "
                "return 404 once setup is complete. Until then, other routes return 503 "
                "with `code: setup_required`."
            ),
        }
    ]

    def configure(self, app: FastAPI) -> None:
        """Block normal API routes until setup is complete.

        Args:
            app: The FastAPI application being built.
        """
        app.add_middleware(SetupRequiredMiddleware)

    async def on_startup(self, app: FastAPI) -> None:
        """Print the setup token if web setup is needed.

        A token from `SETUP_TOKEN` is never printed, only a generated one.

        Args:
            app: The running FastAPI application.
        """
        settings = get_settings()
        if not settings.setup_enabled:
            return
        try:
            if await installation_exists():
                return
        except Exception:
            # Unknown state: don't print a token for what may be an installed system.
            logger.warning(
                "Setup: database unreachable, so it's unknown whether setup is needed. "
                "Once the database is up, get the token with: python -m kernel.setup token"
            )
            return
        token = get_setup_token(settings)
        if token.from_env:
            logger.warning("Setup required: open the web app and enter the SETUP_TOKEN from .env.")
            return
        banner = "=" * 72
        logger.warning(
            "\n%s\n  FIRST-RUN SETUP REQUIRED\n  Open the web app and enter this setup token:\n\n"
            "    %s\n\n  (stored in %s until setup completes)\n%s",
            banner,
            token.value,
            token.path,
            banner,
        )


module = SetupModule()
"""Ready-made instance picked up by the API server's `ModuleLoader`."""

__all__ = [
    "Installation",
    "SetupStatus",
    "SetupChecks",
    "SetupRequest",
    "SetupResult",
    "SetupService",
    "AlreadyInstalledError",
    "DatabaseUnavailableError",
    "SetupNotAvailableError",
    "InvalidSetupTokenError",
    "SetupRequiredError",
    "SetupModule",
    "module",
    "router",
]
