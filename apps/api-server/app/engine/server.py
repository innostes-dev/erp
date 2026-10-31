"""FastAPI Server Engine for Innostes ERP API Server.

Responsible purely for ASGI execution, application lifecycle,
middleware, system health diagnostics, and hosting ERP modules.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field

from kernel.core.config import Settings, get_settings
from kernel.core.database import close_db, ping_db
from kernel.core.http import register_error_handlers
from kernel.core.module import BaseModule, ModuleRegistry


API_DESCRIPTION = """
Backend REST API for **Innostes ERP**, an enterprise resource planning platform.

### Conventions
* **Identifiers**: All resource identifiers are RFC 4122 UUID v4 strings.
* **Timestamps**: All date-time fields follow ISO 8601 representation in UTC (`YYYY-MM-DDTHH:MM:SSZ`).
* **Audit Trail**: Every domain entity contains `id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, and `deleted_by`.
* **Soft Deletes**: Deletion operations perform soft-deletion. Soft-deleted records are excluded from default queries and list views unless `include_deleted=true` is supplied.
* **Pagination**: Collection list operations use zero-based `offset` and positive `limit` query parameters, returning a standardized `Page` object `{items, total, offset, limit}`.
* **Errors**: Standard RFC 7807-compliant responses with `{detail, code?}` payloads. Input validation failures emit standard HTTP 422 Unprocessable Entity payloads.

### Security & Authentication
* **Bearer Tokens**: Authenticated requests must present `Authorization: Bearer <token>` carrying either a 30-minute JWT access token issued by `/auth/login` or a permanent Personal API Key (`inno_live_...`).
* **Refresh Tokens**: 7-day single-use rotating refresh tokens are managed via HttpOnly secure cookies or `/auth/refresh`.
* **Multi-Tenancy**: Tenant-scoped operations accept the `X-Tenant-ID` header.
"""

SYSTEM_OPENAPI_TAGS: list[dict[str, Any]] = [
    {"name": "General", "description": "Service identity, runtime metadata, and public configuration."},
    {"name": "Observability", "description": "Health probes, diagnostic telemetry, and readiness checks."},
]

TAG_ORDER = [
    "General",
    "Observability",
    "Authentication",
    "Setup",
    "Tenancy",
    "User management",
    "CRM",
    "HRMS",
    "API logger",
]


class ServiceInfoRead(BaseModel):
    """Core service identification and runtime module metadata."""

    service: str = Field(description="Name of the backend service application.", examples=["Innostes ERP API Server"])
    environment: str = Field(description="Runtime deployment environment.", examples=["development"])
    status: str = Field(description="High-level operational status of the service.", examples=["online"])
    modules: list[str] = Field(
        description="List of discovered and registered ERP plug-in modules.",
        examples=[["auth", "setup", "tenancy", "user", "crm", "hrms", "tracura"]],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "service": "Innostes ERP API Server",
                    "environment": "development",
                    "status": "online",
                    "modules": ["auth", "setup", "tenancy", "user", "crm", "hrms", "tracura"],
                }
            ]
        }
    }


class AppConfigRead(BaseModel):
    """Public application metadata and frontend bootstrapping configuration."""

    service: str = Field(description="Name of the backend service application.", examples=["Innostes ERP API Server"])
    version: str = Field(description="Semver version string of the API server.", examples=["0.1.0"])
    environment: str = Field(description="Runtime deployment environment.", examples=["development"])

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "service": "Innostes ERP API Server",
                    "version": "0.1.0",
                    "environment": "development",
                }
            ]
        }
    }


class HealthCheckRead(BaseModel):
    """System health check and diagnostic status."""

    status: str = Field(description="Aggregated platform health status: pass or fail.", examples=["pass"])
    environment: str = Field(description="Runtime deployment environment.", examples=["development"])
    database: dict[str, Any] = Field(
        description="Database connectivity diagnostic report.",
        examples=[{"status": "HEALTHY", "latency_ms": 1.25}],
    )
    modules: dict[str, Any] = Field(
        description="Diagnostic health reports for each registered module.",
        examples=[{"auth": {"status": "HEALTHY"}, "tenancy": {"status": "HEALTHY"}}],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "pass",
                    "environment": "development",
                    "database": {"status": "HEALTHY", "latency_ms": 1.25},
                    "modules": {"auth": {"status": "HEALTHY"}, "tenancy": {"status": "HEALTHY"}},
                }
            ]
        }
    }


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
            description=API_DESCRIPTION.strip(),
            debug=self.settings.debug,
            lifespan=self._lifespan,
            openapi_tags=self._collect_openapi_tags(),
            docs_url="/docs",
            redoc_url="/redoc",
            openapi_url="/openapi.json",
            contact={"name": "Innostes Platform Engineering", "email": "platform@innostes.example", "url": "https://innostes.example"},
            license_info={"name": "MIT", "identifier": "MIT"},
            servers=[
                {"url": "http://localhost:8001", "description": "Local development server"},
                {"url": "https://api.innostes.example", "description": "Production API gateway (placeholder)"},
            ],
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

        # Custom OpenAPI generator guaranteeing clean schema definitions
        def custom_openapi() -> dict[str, Any]:
            if app.openapi_schema:
                return app.openapi_schema
            openapi_schema = get_openapi(
                title=app.title,
                version=app.version,
                openapi_version=app.openapi_version,
                description=app.description,
                routes=app.routes,
                tags=app.openapi_tags,
                servers=app.servers,
                terms_of_service=app.terms_of_service,
                contact=app.contact,
                license_info=app.license_info,
            )
            components = openapi_schema.setdefault("components", {})
            schemes = components.setdefault("securitySchemes", {})
            schemes.pop("HTTPBearer", None)
            schemes["BearerAuth"] = {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "JWT Bearer access token or personal access token (inno_live_...). Obtain an access token via POST /auth/login (30-minute lifespan, refreshed via POST /auth/refresh). Send in the HTTP Authorization header as 'Bearer <token>'.",
            }
            schemes["SetupToken"] = {
                "type": "apiKey",
                "name": "X-Setup-Token",
                "in": "header",
                "description": "One-time system installation token printed in the server log on first start or configured via SETUP_TOKEN in .env.",
            }
            app.openapi_schema = openapi_schema
            return app.openapi_schema

        app.openapi = custom_openapi  # type: ignore[assignment]

        self.app = app
        return app

    def _collect_openapi_tags(self) -> list[dict[str, Any]]:
        """Merge the system tags with every registered module's tags in logical order.

        Returns:
            Tag metadata list for FastAPI's `openapi_tags`.
        """
        tags: list[dict[str, Any]] = list(SYSTEM_OPENAPI_TAGS)
        seen = {t["name"] for t in tags}
        for module in self.registry.list_modules():
            for tag in module.openapi_tags:
                if tag["name"] not in seen:
                    tags.append(tag)
                    seen.add(tag["name"])

        # Sort tags by canonical logical order
        def sort_key(tag_dict: dict[str, Any]) -> int:
            tname = tag_dict.get("name", "")
            try:
                return TAG_ORDER.index(tname)
            except ValueError:
                return 99

        tags.sort(key=sort_key)
        return tags

    def _register_system_routes(self, app: FastAPI) -> None:
        """Register root and health observability routes."""

        @app.get(
            "/",
            tags=["General"],
            summary="Service information",
            operation_id="system_root",
            openapi_extra={"security": []},
            response_model=ServiceInfoRead,
        )
        def root() -> dict[str, Any]:
            """Service name, environment, status, and the list of loaded modules.

            Public endpoint. Returns service identification and loaded feature module metadata.
            \f
            Returns:
                ServiceInfoRead with environment and module list.
            """
            return {
                "service": self.settings.app_name,
                "environment": self.settings.app_env,
                "status": "online",
                "modules": [m.name for m in self.registry.list_modules()],
            }

        @app.get(
            "/config",
            tags=["General"],
            summary="Application configuration",
            operation_id="system_config",
            openapi_extra={"security": []},
            response_model=AppConfigRead,
        )
        def config() -> dict[str, Any]:
            """Public configuration and app metadata for frontend bootstrapping.

            Public endpoint. Supplies non-sensitive deployment information to client applications.
            \f
            Returns:
                AppConfigRead with service name and environment.
            """
            return {
                "service": self.settings.app_name,
                "version": self.settings.app_version,
                "environment": self.settings.app_env,
            }

        @app.get(
            "/health",
            tags=["Observability"],
            summary="System health check",
            operation_id="system_health",
            openapi_extra={"security": []},
            responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Database is unreachable"}},
            response_model=HealthCheckRead,
        )
        async def health(response: Response) -> dict[str, Any]:
            """Report API, database, and per-module health.

            Public endpoint. Returns **200** with `status: pass` when the database responds,
            otherwise **503** with `status: fail`.
            \f
            Returns:
                HealthCheckRead with database and module status reports.
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
