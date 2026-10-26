"""FastAPI Server Engine for Innostes ERP API Server.

Responsible purely for ASGI execution, application lifecycle,
middleware, system health diagnostics, and hosting ERP modules.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Response, status

from kernel.config import Settings, get_settings
from kernel.database import close_db, ping_db
from kernel.module import BaseModule, ModuleRegistry


class ServerEngine:
    """Execution engine that configures and runs modular FastAPI services."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings: Settings = settings or get_settings()
        self.registry: ModuleRegistry = ModuleRegistry()
        self.app: FastAPI | None = None

    def register_module(self, module: BaseModule) -> None:
        """Register a feature module with the engine."""
        self.registry.register(module)

    @asynccontextmanager
    async def _lifespan(self, app: FastAPI) -> AsyncGenerator[None, None]:
        """Engine lifespan managing module startup hooks and kernel DB pool shutdown."""
        # Execute module startup hooks
        for module in self.registry.list_modules():
            await module.on_startup(app)

        yield

        # Execute module shutdown hooks
        for module in self.registry.list_modules():
            await module.on_shutdown(app)

        # Dispose database pool via kernel
        await close_db()

    def create_app(self) -> FastAPI:
        """Construct, configure, and return the FastAPI application instance."""
        app = FastAPI(
            title=self.settings.app_name,
            debug=self.settings.debug,
            lifespan=self._lifespan,
        )

        # Attach system endpoints
        self._register_system_routes(app)

        # Mount module routers
        for module in self.registry.list_modules():
            if module.router is not None:
                app.include_router(module.router)

        self.app = app
        return app

    def _register_system_routes(self, app: FastAPI) -> None:
        """Register root and health observability routes."""

        @app.get("/", tags=["General"])
        def root() -> dict[str, Any]:
            """Root endpoint returning service identity and registered modules."""
            return {
                "service": self.settings.app_name,
                "environment": self.settings.app_env,
                "status": "online",
                "modules": [m.name for m in self.registry.list_modules()],
            }

        @app.get("/health", tags=["Observability"])
        async def health(response: Response) -> dict[str, Any]:
            """Health probe reporting API status, database pool health, and module statuses."""
            db_report = await ping_db(timeout=3.0)
            is_healthy = db_report["status"] == "HEALTHY"

            # Check registered modules health
            module_reports: dict[str, Any] = {}
            for module in self.registry.list_modules():
                try:
                    module_reports[module.name] = await module.health_check()
                except Exception as exc:
                    module_reports[module.name] = {
                        "status": "UNHEALTHY",
                        "error": str(exc),
                    }

            if not is_healthy:
                response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

            return {
                "status": "pass" if is_healthy else "fail",
                "environment": self.settings.app_env,
                "database": db_report,
                "modules": module_reports,
            }
