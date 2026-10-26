"""Blocks the API until first-run setup is done.

While the system is not installed, every request except the setup routes,
health checks and API docs gets **503** with `"code": "setup_required"`.
Nothing can run against a half-installed database, and clients get a clear
machine-readable signal.

If the database can't be reached, the setup state is unknown, so requests get
503 `"code": "database_unavailable"` instead of being let through.
"""

import json

from starlette.types import ASGIApp, Receive, Scope, Send

from kernel.core.http import error_body
from kernel.core.services import ServiceError
from kernel.setup.dependencies import is_installed_cached
from kernel.setup.services import SetupRequiredError

ALWAYS_ALLOWED = ("/", "/health", "/docs", "/redoc", "/openapi.json")
"""Exact paths that work before setup."""

ALLOWED_PREFIXES = ("/setup", "/docs/")
"""Path prefixes that work before setup."""


def is_allowed_before_setup(path: str) -> bool:
    """Return True if `path` may be used before setup is complete."""
    return path in ALWAYS_ALLOWED or any(
        path == p or path.startswith(p if p.endswith("/") else p + "/") for p in ALLOWED_PREFIXES
    )


class SetupRequiredMiddleware:
    """Pure ASGI middleware: 503 `setup_required` for normal routes until installed."""

    def __init__(self, app: ASGIApp) -> None:
        """Wrap an ASGI app.

        Args:
            app: The next ASGI app in the chain.
        """
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Handle one ASGI call; non-HTTP traffic passes through."""
        if scope["type"] != "http" or is_allowed_before_setup(scope["path"]):
            await self.app(scope, receive, send)
            return

        try:
            installed = await is_installed_cached()
        except ServiceError as exc:
            await _send_error(send, exc)
            return
        if not installed:
            await _send_error(send, SetupRequiredError())
            return
        await self.app(scope, receive, send)


async def _send_error(send: Send, exc: ServiceError) -> None:
    """Send a JSON error response for `exc` (same shape as the shared error handler)."""
    body = json.dumps(error_body(exc)).encode("utf-8")
    headers = [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())]
    headers += [(k.lower().encode(), v.encode()) for k, v in exc.headers.items()]
    await send({"type": "http.response.start", "status": exc.status_code, "headers": headers})
    await send({"type": "http.response.body", "body": body})
