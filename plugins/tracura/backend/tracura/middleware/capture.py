"""Universal ASGI Auto-Capture Middleware."""

from datetime import datetime, timezone
import os
import time
from typing import Any
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from tracura.middleware.buffer import log_buffer
from tracura.services.project_service import (
    get_configured_env_slug,
    get_default_env_id,
    get_default_project_id,
)

_ACTIVE_TENANTS: set[uuid.UUID] = set()
_ACTIVE_TENANTS_LOADED: bool = False


def mark_plugin_active(tenant_id: uuid.UUID, is_active: bool) -> None:
    """Update in-memory active cache when plugin is activated/deactivated."""
    if is_active:
        _ACTIVE_TENANTS.add(tenant_id)
    else:
        _ACTIVE_TENANTS.discard(tenant_id)


def is_plugin_active_for_tenant(tenant_id: uuid.UUID) -> bool:
    """Fast in-memory check whether Tracura is active for tenant."""
    return tenant_id in _ACTIVE_TENANTS


async def sync_active_tenants_from_db() -> None:
    """Load active tenants from database during startup."""
    try:
        from kernel.core.database.session import get_sessionmaker
        from kernel.tenancy.models.tenant_plugin import TenantPlugin
        from sqlalchemy import select
        async_session = get_sessionmaker()
        async with async_session() as session:
            stmt = select(TenantPlugin.tenant_id).where(
                TenantPlugin.plugin_id == "tracura",
                TenantPlugin.is_active == True,
            )
            results = (await session.execute(stmt)).scalars().all()
            global _ACTIVE_TENANTS, _ACTIVE_TENANTS_LOADED
            _ACTIVE_TENANTS = set(results)
            _ACTIVE_TENANTS_LOADED = True
    except Exception:
        pass


def get_default_erp_project_id(tenant_id: uuid.UUID) -> uuid.UUID:
    """Return deterministic UUID for the host Innostes ERP project under a tenant."""
    return get_default_project_id(tenant_id)


def get_default_erp_env_id(project_id: uuid.UUID, env_name: str) -> uuid.UUID:
    """Return deterministic UUID for an environment under a project."""
    return get_default_env_id(project_id, env_name)


class TracuraCaptureMiddleware(BaseHTTPMiddleware):
    """ASGI Middleware that automatically streams internal API request telemetry to the buffer."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()
        correlation_id = request.headers.get("x-correlation-id") or f"req_{uuid.uuid4().hex[:12]}"
        request.state.correlation_id = correlation_id

        error_payload: dict[str, Any] | None = None
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            response.headers["X-Correlation-ID"] = correlation_id
            return response
        except Exception as exc:
            error_payload = {
                "type": type(exc).__name__,
                "message": str(exc),
            }
            raise
        finally:
            path = request.url.path
            # Prevent recursive loop by ignoring ingestion, health, docs, metrics, and static assets
            if not path.startswith((
                "/plugins/tracura/v1/ingest",
                "/tracura/v1/ingest",
                "/plugins/api-logger/v1/ingest",
                "/api-logger/v1/ingest",
                "/health",
                "/metrics",
                "/docs",
                "/redoc",
                "/openapi.json",
                "/favicon.ico",
                "/assets/",
                "/static/",
                "/@vite/",
                "/@fs/",
            )) and not path.endswith((".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".map")):
                duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
                tenant_id = getattr(request.state, "tenant_id", None)
                if not tenant_id:
                    header_tid = request.headers.get("x-tenant-id")
                    if header_tid:
                        try:
                            tenant_id = uuid.UUID(header_tid)
                        except Exception:
                            pass

                # If no tenant context, or if plugin is NOT active for this tenant, do NOT capture!
                should_capture = bool(tenant_id) and is_plugin_active_for_tenant(tenant_id)

                if should_capture:
                    # Resolve Project ID: state -> header -> deterministic host ERP project UUID
                    project_id = getattr(request.state, "project_id", None)
                    if not project_id:
                        header_pid = request.headers.get("x-project-id")
                        if header_pid:
                            try:
                                project_id = uuid.UUID(header_pid)
                            except Exception:
                                pass
                    if not project_id:
                        project_id = get_default_erp_project_id(tenant_id)

                    # Resolve Environment: state -> header UUID -> header name / APP_ENV
                    env_name = (
                        request.headers.get("x-environment")
                        or getattr(request.state, "environment", None)
                        or get_configured_env_slug()
                    ).strip().lower()

                    environment_id = getattr(request.state, "environment_id", None)
                    if not environment_id:
                        header_eid = request.headers.get("x-environment-id")
                        if header_eid:
                            try:
                                environment_id = uuid.UUID(header_eid)
                            except Exception:
                                pass
                    if not environment_id:
                        environment_id = get_default_erp_env_id(project_id, env_name)

                    client_ip = request.client.host if request.client else None

                    # Sanitize headers and query parameters to protect secrets
                    from tracura.services.sanitizer import SanitizerService
                    _sanitizer = SanitizerService()
                    sanitized_headers = _sanitizer.sanitize_headers(dict(request.headers))
                    sanitized_query = _sanitizer.sanitize_query_params(dict(request.query_params))

                    log_item = {
                        "id": uuid.uuid4(),
                        "tenant_id": tenant_id,
                        "project_id": project_id,
                        "environment_id": environment_id,
                        "api_key_id": getattr(getattr(request.state, "api_key", None), "id", None),
                        "correlation_id": correlation_id,
                        "user_id": str(getattr(request.state, "user_id", "")) or None,
                        "client_ip": client_ip,
                        "user_agent": request.headers.get("user-agent"),
                        "http_method": request.method.upper(),
                        "url": str(request.url),
                        "path": path,
                        "status_code": status_code,
                        "duration_ms": duration_ms,
                        "request_headers": sanitized_headers,
                        "query_params": sanitized_query,
                        "request_body": None,
                        "response_headers": None,
                        "response_body": None,
                        "error": error_payload,
                        "meta": {
                            "source": "asgi_auto_capture",
                            "service": getattr(request.state, "service_name", "api-server"),
                            "environment": env_name,
                        },
                        "created_at": datetime.now(timezone.utc),
                    }
                    await log_buffer.enqueue(log_item)


# Backwards compatibility alias
ApiLoggerCaptureMiddleware = TracuraCaptureMiddleware
