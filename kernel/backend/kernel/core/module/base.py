"""Base Module Contract for Innostes ERP Modules."""

from abc import ABC
from typing import Any
from fastapi import APIRouter, FastAPI


class BaseModule(ABC):
    """Contract that every ERP feature module implements.

    A module bundles a feature's HTTP routes, lifecycle hooks and health
    check so the API server can load it with one line.

    Attributes:
        name: Unique module id (shown in `/` and `/health`).
        version: Module version string.
        description: Short human-readable summary.
        router: FastAPI router mounted by the server, or None if the
            module has no HTTP endpoints.
        openapi_tags: Tag metadata for the API docs, e.g.
            `[{"name": "Tenancy", "description": "..."}]`. Each tag used
            by `router` should be described here so `/docs` groups and
            explains the endpoints.

    Example:
        ```python
        class TenancyModule(BaseModule):
            name = "tenancy"
            router = router
            openapi_tags = [{"name": "Tenancy", "description": "Manage tenants."}]
        ```
    """

    name: str = "base-module"
    version: str = "0.1.0"
    description: str = "Base ERP Module"
    router: APIRouter | None = None
    openapi_tags: list[dict[str, Any]] = []

    def configure(self, app: FastAPI) -> None:
        """Adjust the app before it starts, e.g. add middleware.

        Called by the API server while building the app, before routers are
        mounted. Middleware can't be added in `on_startup` (too late).

        Args:
            app: The FastAPI application being built.
        """

    async def on_startup(self, app: FastAPI) -> None:
        """Run when the API server starts (open clients, warm caches, ...).

        Args:
            app: The running FastAPI application.
        """
        pass

    async def on_shutdown(self, app: FastAPI) -> None:
        """Run when the API server stops (release resources).

        Args:
            app: The running FastAPI application.
        """
        pass

    async def health_check(self) -> dict[str, Any]:
        """Report this module's health; included in the `/health` response.

        Returns:
            A dict with at least a `status` key (`"HEALTHY"` / `"UNHEALTHY"`).
        """
        return {
            "status": "HEALTHY",
            "module": self.name,
            "version": self.version,
        }
