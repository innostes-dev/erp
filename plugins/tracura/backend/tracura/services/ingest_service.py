"""API Logger Ingestion Processing Engine."""

from datetime import datetime, timezone
import random
from typing import Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from tracura.middleware.buffer import log_buffer
from tracura.models.api_key import ApiLogApiKey
from tracura.schemas.ingest import IngestLogItem, IngestResponse
from tracura.services.api_key_service import ApiKeyService
from tracura.services.project_service import ProjectService
from tracura.services.sanitizer import SanitizerService
from tracura.services.settings_service import SettingsService


class IngestService:
    """Processes, filters, sanitizes, and buffers incoming telemetry logs."""

    def __init__(
        self,
        project_service: ProjectService | None = None,
        key_service: ApiKeyService | None = None,
        settings_service: SettingsService | None = None,
    ) -> None:
        self.project_service = project_service or ProjectService()
        self.key_service = key_service or ApiKeyService()
        self.settings_service = settings_service or SettingsService()

    async def ingest_logs(
        self,
        session: AsyncSession,
        api_key: ApiLogApiKey,
        items: list[IngestLogItem],
    ) -> IngestResponse:
        """Process a single or batch list of log items."""
        accepted_count = 0
        dropped_count = 0
        prepared_logs: list[dict[str, Any]] = []

        # Local cache for project & environment resolutions in this batch
        project_cache: dict[str, Any] = {}
        env_cache: dict[str, Any] = {}
        settings_cache: dict[str, Any] = {}

        for item in items:
            # 1. Resolve Project
            proj_key = str(item.project).lower()
            if proj_key not in project_cache:
                proj = await self.project_service.get_project(session, api_key.tenant_id, item.project)
                if not proj:
                    # Auto-provision project if not exists
                    from tracura.schemas.project import ProjectCreate
                    proj = await self.project_service.create_project(
                        session=session,
                        tenant_id=api_key.tenant_id,
                        payload=ProjectCreate(
                            name=item.project.replace("-", " ").title(),
                            slug=item.project.lower(),
                        ),
                    )
                project_cache[proj_key] = proj

            project = project_cache[proj_key]

            # 2. Resolve Environment
            env_key = f"{project.id}:{str(item.environment).lower()}"
            if env_key not in env_cache:
                env = await self.project_service.get_environment(session, api_key.tenant_id, project.id, item.environment)
                if not env:
                    from tracura.schemas.project import EnvironmentCreate
                    env = await self.project_service.create_environment(
                        session=session,
                        tenant_id=api_key.tenant_id,
                        project_id=project.id,
                        payload=EnvironmentCreate(
                            name=item.environment.capitalize(),
                            slug=item.environment.lower(),
                        ),
                    )
                env_cache[env_key] = env

            environment = env_cache[env_key]

            # 3. Google-style Scoping Verification: Enforce Project & Environment restrictions
            if not self.key_service.validate_scope(api_key, project.id, environment.slug):
                dropped_count += 1
                continue

            # 4. Hierarchical Settings Resolution
            cache_key = f"{api_key.tenant_id}:{project.id}:{environment.id}"
            if cache_key not in settings_cache:
                settings_cache[cache_key] = await self.settings_service.get_effective_settings(
                    session=session,
                    tenant_id=api_key.tenant_id,
                    project_id=project.id,
                    environment_id=environment.id,
                )

            settings = settings_cache[cache_key]

            # 5. Path Exclusion Filter
            if any(item.path.startswith(excluded) for excluded in (settings.excluded_paths or [])):
                dropped_count += 1
                continue

            # 6. Error-only filter
            if settings.log_errors_only and item.status_code < 400:
                dropped_count += 1
                continue

            # 7. Sampling Filter
            if settings.sampling_rate < 1.0 and random.random() > settings.sampling_rate:
                dropped_count += 1
                continue

            # 8. Sanitization & Redaction
            sanitizer = SanitizerService(
                sensitive_headers=set(settings.sensitive_headers or []),
                sensitive_keys=set(settings.sensitive_body_fields or []),
                max_body_size_bytes=settings.max_body_size_bytes,
                mask_client_ip=settings.mask_client_ip,
            )

            req_headers = sanitizer.sanitize_headers(item.request_headers) if settings.capture_headers else None
            res_headers = sanitizer.sanitize_headers(item.response_headers) if settings.capture_headers else None
            req_body = sanitizer.sanitize_body(item.request_body) if settings.capture_body else None
            res_body = sanitizer.sanitize_body(item.response_body) if settings.capture_body else None
            query_params = sanitizer.sanitize_query_params(item.query_params)
            client_ip = sanitizer.mask_ip(item.client_ip)

            # 9. Build sanitized log record (Strict server-enforced tenant_id)
            log_dict = {
                "id": uuid.uuid4(),
                "tenant_id": api_key.tenant_id,
                "project_id": project.id,
                "environment_id": environment.id,
                "api_key_id": api_key.id,
                "correlation_id": item.correlation_id,
                "user_id": item.user_id,
                "client_ip": client_ip,
                "user_agent": item.user_agent,
                "http_method": item.http_method.upper(),
                "url": item.url,
                "path": item.path,
                "status_code": item.status_code,
                "duration_ms": item.duration_ms,
                "request_headers": req_headers,
                "query_params": query_params,
                "request_body": req_body,
                "response_headers": res_headers,
                "response_body": res_body,
                "error": item.error,
                "meta": item.meta,
                "created_at": item.created_at or datetime.now(timezone.utc),
            }
            prepared_logs.append(log_dict)
            accepted_count += 1

        # Enqueue prepared logs into non-blocking async buffer
        if prepared_logs:
            await log_buffer.enqueue_batch(prepared_logs)

        return IngestResponse(
            accepted=accepted_count,
            dropped=dropped_count,
            status="accepted",
        )
