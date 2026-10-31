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

ERP_PROJECT_SLUG = "innostes-erp"


def get_default_erp_project_id(tenant_id: uuid.UUID) -> uuid.UUID:
    """Return deterministic UUID for the host Innostes ERP project under a tenant."""
    return uuid.uuid5(tenant_id, f"project:{ERP_PROJECT_SLUG}")


def get_default_erp_env_id(project_id: uuid.UUID, env_name: str) -> uuid.UUID:
    """Return deterministic UUID for an environment under a project."""
    return uuid.uuid5(project_id, f"env:{env_name.lower()}")


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
            # Prevent recursive loop by ignoring ingestion, health, docs, and metrics routes
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
            )):
                duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
                tenant_id = getattr(request.state, "tenant_id", None)
                if not tenant_id:
                    header_tid = request.headers.get("x-tenant-id")
                    if header_tid:
                        try:
                            tenant_id = uuid.UUID(header_tid)
                        except Exception:
                            pass
                if not tenant_id:
                    # System tenant fallback for global platform & kernel endpoints
                    tenant_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

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
                    or os.environ.get("APP_ENV")
                    or "development"
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
                    "request_headers": dict(request.headers),
                    "query_params": dict(request.query_params),
                    "request_body": None,
                    "response_headers": None,
                    "response_body": None,
                    "error": error_payload,
                    "meta": {
                        "source": "asgi_auto_capture",
                        "service": "innostes-erp",
                        "environment": env_name,
                    },
                    "created_at": datetime.now(timezone.utc),
                }
                await log_buffer.enqueue(log_item)


# Backwards compatibility alias
ApiLoggerCaptureMiddleware = TracuraCaptureMiddleware
