"""FastAPI Server Engine for Innostes ERP API Server.

Responsible purely for ASGI execution, application lifecycle,
middleware, system health diagnostics, and hosting ERP modules.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from kernel.core.config import Settings, get_settings
from kernel.core.database import close_db, ping_db
from kernel.core.http import register_error_handlers
from kernel.core.module import BaseModule, ModuleRegistry


API_DESCRIPTION = """
Backend API for **Innostes ERP**.

### Conventions
* **Ids** are UUIDs.
* **Timestamps** are ISO 8601 in UTC.
* Every record has `id`, `created_at`, `created_by`, `updated_at`,
  `updated_by`, `deleted_at` and `deleted_by`.
* **Delete is a soft delete**: the record is hidden, not removed, and can be
  restored. Lists hide deleted records unless `include_deleted=true`.
* **Pagination**: list endpoints take `offset` and `limit` and return
  `{items, total, offset, limit}`.
* **Errors** return `{"detail": "..."}`; validation errors (422) return a
  list of field problems.

### Authentication
Send `Authorization: Bearer <access token>`. For now the token is optional
and only used to record who made a change.
"""

SYSTEM_OPENAPI_TAGS: list[dict[str, Any]] = [
    {"name": "General", "description": "Service identity."},
    {"name": "Observability", "description": "Health checks for load balancers and monitoring."},
]


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
        """Engine lifespan managing migrations, module startup hooks, and kernel DB pool shutdown."""
        # Run database migrations if enabled
        if self.settings.auto_migrate:
            from kernel.core.database.migrations import auto_migrate
            await auto_migrate()

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
        """Build the FastAPI app: system routes, module routes and API docs.

        API docs are served at `/docs` (Swagger UI), `/redoc` (ReDoc) and
        `/openapi.json` (raw OpenAPI spec). Each module's `openapi_tags`
        are added so its endpoints are grouped and described.

        Returns:
            The configured FastAPI application.
        """
        app = FastAPI(
            title=self.settings.app_name,
            version=self.settings.app_version,
            description=API_DESCRIPTION,
            debug=self.settings.debug,
            lifespan=self._lifespan,
            openapi_tags=self._collect_openapi_tags(),
            docs_url="/docs",
            redoc_url="/redoc",
            openapi_url="/openapi.json",
        )

        # Let modules add middleware. This runs before CORS is added, so CORS stays
        # the outermost layer and every response (including module errors) gets CORS headers.
        for module in self.registry.list_modules():
            module.configure(app)

        # Let the UI engine (web-app, another origin) call the API from the browser
        if self.settings.cors_origins:
            app.add_middleware(
                CORSMiddleware,
                allow_origins=self.settings.cors_origins,
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
                # Let browser code read these response headers (e.g. wait time after a 429)
                expose_headers=["Retry-After"],
            )

        # Turn service errors (NotFoundError, ConflictError, ...) into their HTTP status
        register_error_handlers(app)

        # Attach system endpoints
        self._register_system_routes(app)

        # Mount module routers
        for module in self.registry.list_modules():
            if module.router is not None:
                app.include_router(module.router)

        self.app = app
        return app

    def _collect_openapi_tags(self) -> list[dict[str, Any]]:
        """Merge the system tags with every registered module's tags.

        Returns:
            Tag metadata list for FastAPI's `openapi_tags` (first one wins
            if two modules describe the same tag).
        """
        tags: list[dict[str, Any]] = list(SYSTEM_OPENAPI_TAGS)
        seen = {t["name"] for t in tags}
        for module in self.registry.list_modules():
            for tag in module.openapi_tags:
                if tag["name"] not in seen:
                    tags.append(tag)
                    seen.add(tag["name"])
        return tags

    def _register_system_routes(self, app: FastAPI) -> None:
        """Register root and health observability routes."""

        @app.get("/", tags=["General"], summary="Service info", operation_id="system_root")
        def root() -> dict[str, Any]:
            """Service name, environment, status and the list of loaded modules."""
            return {
                "service": self.settings.app_name,
                "environment": self.settings.app_env,
                "status": "online",
                "modules": [m.name for m in self.registry.list_modules()],
            }

        @app.get(
            "/health",
            tags=["Observability"],
            summary="Health check",
            operation_id="system_health",
            responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Database is unreachable"}},
        )
        async def health(response: Response) -> dict[str, Any]:
            """Report API, database and per-module health.

            Returns **200** with `status: "pass"` when the database responds,
            otherwise **503** with `status: "fail"`.
            """
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
