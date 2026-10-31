"""API Logger Hierarchical Settings Resolution Service."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tracura.models.settings import ApiLogSettings
from tracura.schemas.settings import SettingsUpdate


class SettingsService:
    """Manages retention, sampling, and PII redaction policies."""

    async def get_effective_settings(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID | None = None,
        environment_id: uuid.UUID | None = None,
    ) -> ApiLogSettings:
        """Resolve settings with hierarchical fallbacks:

        1. Specific environment override (if environment_id is provided)
        2. Specific project override (if project_id is provided)
        3. Tenant-wide default settings
        4. If none exists, creates and returns the default tenant settings record.
        """
        # 1. Try environment-level override
        if environment_id and project_id:
            stmt = select(ApiLogSettings).where(
                ApiLogSettings.tenant_id == tenant_id,
                ApiLogSettings.project_id == project_id,
                ApiLogSettings.environment_id == environment_id,
                ApiLogSettings.deleted_at.is_(None),
            )
            env_settings = (await session.execute(stmt)).scalar_one_or_none()
            if env_settings:
                return env_settings

        # 2. Try project-level override
        if project_id:
            stmt = select(ApiLogSettings).where(
                ApiLogSettings.tenant_id == tenant_id,
                ApiLogSettings.project_id == project_id,
                ApiLogSettings.environment_id.is_(None),
                ApiLogSettings.deleted_at.is_(None),
            )
            proj_settings = (await session.execute(stmt)).scalar_one_or_none()
            if proj_settings:
                return proj_settings

        # 3. Try tenant-level default
        stmt = select(ApiLogSettings).where(
            ApiLogSettings.tenant_id == tenant_id,
            ApiLogSettings.project_id.is_(None),
            ApiLogSettings.environment_id.is_(None),
            ApiLogSettings.deleted_at.is_(None),
        )
        tenant_settings = (await session.execute(stmt)).scalar_one_or_none()
        if tenant_settings:
            return tenant_settings

        # 4. Create default tenant settings
        now = datetime.now(timezone.utc)
        default_settings = ApiLogSettings(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            project_id=None,
            environment_id=None,
            retention_days=30,
            max_body_size_bytes=4096,
            sampling_rate=1.00,
            capture_headers=True,
            capture_body=True,
            log_errors_only=False,
            excluded_paths=["/health", "/metrics", "/favicon.ico"],
            sensitive_headers=["authorization", "cookie", "x-api-key", "proxy-authorization", "set-cookie"],
            sensitive_body_fields=["password", "secret", "credit_card", "token", "cvv", "ssn", "access_token", "refresh_token"],
            mask_client_ip=False,
            created_at=now,
            updated_at=now,
        )
        session.add(default_settings)
        await session.flush()
        return default_settings

    async def update_settings(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        payload: SettingsUpdate,
        project_id: uuid.UUID | None = None,
        environment_id: uuid.UUID | None = None,
        actor_id: uuid.UUID | None = None,
    ) -> ApiLogSettings:
        """Update or create settings at tenant, project, or environment level."""
        stmt = select(ApiLogSettings).where(
            ApiLogSettings.tenant_id == tenant_id,
            ApiLogSettings.project_id == project_id if project_id else ApiLogSettings.project_id.is_(None),
            ApiLogSettings.environment_id == environment_id if environment_id else ApiLogSettings.environment_id.is_(None),
            ApiLogSettings.deleted_at.is_(None),
        )
        settings = (await session.execute(stmt)).scalar_one_or_none()

        now = datetime.now(timezone.utc)
        if not settings:
            settings = ApiLogSettings(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                project_id=project_id,
                environment_id=environment_id,
                retention_days=30,
                max_body_size_bytes=4096,
                sampling_rate=1.00,
                capture_headers=True,
                capture_body=True,
                log_errors_only=False,
                excluded_paths=["/health", "/metrics", "/favicon.ico"],
                sensitive_headers=["authorization", "cookie", "x-api-key", "proxy-authorization", "set-cookie"],
                sensitive_body_fields=["password", "secret", "credit_card", "token", "cvv", "ssn", "access_token", "refresh_token"],
                mask_client_ip=False,
                created_by=actor_id,
                created_at=now,
                updated_at=now,
            )
            session.add(settings)

        for field, value in payload.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(settings, field, value)

        settings.updated_by = actor_id
        await session.flush()
        return settings
