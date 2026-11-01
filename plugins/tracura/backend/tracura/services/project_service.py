"""API Logger Project & Environment Management Service."""

from datetime import datetime, timezone
import os
import re
import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tracura.models.environment import ApiLogEnvironment
from tracura.models.project import ApiLogProject
from tracura.schemas.project import (
    EnvironmentCreate,
    EnvironmentUpdate,
    ProjectCreate,
    ProjectUpdate,
)

DEFAULT_FALLBACK_PROJECT_NAME = "Innostes ERP"
DEFAULT_FALLBACK_PROJECT_SLUG = "innostes-erp"
DEFAULT_FALLBACK_ENV_SLUG = "dev"


async def get_tenant_organization_details(
    session: AsyncSession, tenant_id: uuid.UUID
) -> tuple[str, str]:
    """Retrieve the active tenant organization name and slug directly from the database.

    Prioritizes the active tenant record, falling back to the 1st created tenant,
    and finally to ('Innostes ERP', 'innostes-erp'). Does not read project name from .env.
    """
    try:
        from kernel.tenancy.models import Tenant
        stmt = select(Tenant).where(Tenant.id == tenant_id, Tenant.deleted_at.is_(None))
        tenant = (await session.execute(stmt)).scalar_one_or_none()
        if not tenant:
            first_stmt = (
                select(Tenant)
                .where(Tenant.deleted_at.is_(None))
                .order_by(Tenant.created_at.asc())
                .limit(1)
            )
            tenant = (await session.execute(first_stmt)).scalar_one_or_none()
        if tenant and tenant.name and tenant.name.strip():
            name = tenant.name.strip()
            slug = (tenant.slug or "").strip().lower()
            if not slug:
                slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
            return name, slug or DEFAULT_FALLBACK_PROJECT_SLUG
    except Exception:
        pass

    return DEFAULT_FALLBACK_PROJECT_NAME, DEFAULT_FALLBACK_PROJECT_SLUG


def get_configured_project_name() -> str:
    """Fallback project name when tenant database lookup is not available."""
    return DEFAULT_FALLBACK_PROJECT_NAME


def get_configured_project_slug() -> str:
    """Fallback project slug when tenant database lookup is not available."""
    return DEFAULT_FALLBACK_PROJECT_SLUG


def get_configured_env_slug() -> str:
    """Resolve active environment slug from environment variable, falling back to 'dev'."""
    raw_env = (
        os.environ.get("TRACURA_ENVIRONMENT")
        or os.environ.get("APP_ENV")
        or DEFAULT_FALLBACK_ENV_SLUG
    ).strip().lower()
    return raw_env or DEFAULT_FALLBACK_ENV_SLUG


ERP_PROJECT_SLUG = DEFAULT_FALLBACK_PROJECT_SLUG


def get_default_project_id(tenant_id: uuid.UUID) -> uuid.UUID:
    """Return deterministic UUID for the host Innostes ERP project under a tenant."""
    return uuid.uuid5(tenant_id, "project:default")


def get_default_env_id(project_id: uuid.UUID, env_name: str) -> uuid.UUID:
    """Return deterministic UUID for an environment under a project."""
    return uuid.uuid5(project_id, f"env:{env_name.lower()}")


class ProjectService:
    """Handles Project and Environment CRUD scoped to the current tenant."""

    async def ensure_default_erp_project(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        actor_id: uuid.UUID | None = None,
    ) -> ApiLogProject | None:
        """Provision the default project and standard environments for a tenant only if no project exists."""
        # 1. Check if ANY project already exists for this tenant
        count_stmt = select(func.count(ApiLogProject.id)).where(
            ApiLogProject.tenant_id == tenant_id,
            ApiLogProject.deleted_at.is_(None),
        )
        existing_count = (await session.execute(count_stmt)).scalar() or 0
        if existing_count > 0:
            # Table is not empty; return primary existing project
            stmt = (
                select(ApiLogProject)
                .where(
                    ApiLogProject.tenant_id == tenant_id,
                    ApiLogProject.deleted_at.is_(None),
                )
                .options(selectinload(ApiLogProject.environments))
                .order_by(ApiLogProject.created_at.asc())
            )
            return (await session.execute(stmt)).scalars().first()

        # 2. Table is empty: Auto-provision default project & environments
        # Dynamically resolved from the 1st added tenant in the database, never from .env
        project_name, project_slug = await get_tenant_organization_details(session, tenant_id)
        default_pid = get_default_project_id(tenant_id)

        project = ApiLogProject(
            id=default_pid,
            tenant_id=tenant_id,
            name=project_name,
            slug=project_slug,
            description=f"Core {project_name} service and API telemetry",
            created_by=actor_id,
        )
        session.add(project)
        await session.flush()

        active_env_slug = get_configured_env_slug()

        # Standard environment stages
        standard_envs = [
            ("production", "Production", "emerald"),
            ("staging", "Staging", "amber"),
            ("dev", "Dev", "blue"),
        ]

        env_map: dict[str, tuple[str, str]] = {}
        for s_slug, s_name, s_badge in standard_envs:
            env_map[s_slug] = (s_name, s_badge)

        if active_env_slug not in env_map:
            # Custom deployment stage e.g. "development", "qa", "sandbox"
            env_map[active_env_slug] = (active_env_slug.capitalize(), "purple")

        envs_to_add: list[ApiLogEnvironment] = []
        for slug, (name, badge) in env_map.items():
            env = ApiLogEnvironment(
                id=get_default_env_id(default_pid, slug),
                project_id=project.id,
                tenant_id=tenant_id,
                name=name,
                slug=slug,
                color_badge=badge,
                created_by=actor_id,
            )
            envs_to_add.append(env)

        project.environments = envs_to_add
        session.add_all(envs_to_add)
        await session.flush()

        return (
            await self.get_project(session, tenant_id, default_pid)
            or project
        )

    async def list_projects(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
    ) -> list[ApiLogProject]:
        """List all active projects with their environments for a tenant."""
        stmt = (
            select(ApiLogProject)
            .where(
                ApiLogProject.tenant_id == tenant_id,
                ApiLogProject.deleted_at.is_(None),
            )
            .options(selectinload(ApiLogProject.environments))
            .order_by(ApiLogProject.name.asc())
        )
        projects = list((await session.execute(stmt)).scalars().all())
        if not projects:
            default_proj = await self.ensure_default_erp_project(session, tenant_id)
            if default_proj:
                projects = [default_proj]
        return projects

    async def get_project(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id_or_slug: str | uuid.UUID,
    ) -> ApiLogProject | None:
        """Fetch project by UUID or slug."""
        stmt = (
            select(ApiLogProject)
            .where(
                ApiLogProject.tenant_id == tenant_id,
                ApiLogProject.deleted_at.is_(None),
            )
            .options(selectinload(ApiLogProject.environments))
        )
        if isinstance(project_id_or_slug, uuid.UUID):
            stmt = stmt.where(ApiLogProject.id == project_id_or_slug)
        else:
            try:
                parsed_uuid = uuid.UUID(str(project_id_or_slug))
                stmt = stmt.where((ApiLogProject.id == parsed_uuid) | (ApiLogProject.slug == project_id_or_slug))
            except ValueError:
                stmt = stmt.where(ApiLogProject.slug == str(project_id_or_slug))

        return (await session.execute(stmt)).scalar_one_or_none()

    async def create_project(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        payload: ProjectCreate,
        actor_id: uuid.UUID | None = None,
    ) -> ApiLogProject:
        """Create a new telemetry project with default 'production' and 'development' environments."""
        project = ApiLogProject(
            tenant_id=tenant_id,
            name=payload.name,
            slug=payload.slug.lower(),
            description=payload.description,
            created_by=actor_id,
        )
        session.add(project)
        await session.flush()

        # Seed standard default environments
        prod_env = ApiLogEnvironment(
            project_id=project.id,
            tenant_id=tenant_id,
            name="Production",
            slug="production",
            color_badge="emerald",
            created_by=actor_id,
        )
        dev_env = ApiLogEnvironment(
            project_id=project.id,
            tenant_id=tenant_id,
            name="Development",
            slug="development",
            color_badge="blue",
            created_by=actor_id,
        )
        project.environments = [prod_env, dev_env]
        session.add_all([prod_env, dev_env])
        await session.flush()

        return await self.get_project(session, tenant_id, project.id) or project

    async def update_project(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        payload: ProjectUpdate,
        actor_id: uuid.UUID | None = None,
    ) -> ApiLogProject | None:
        """Update an existing project."""
        project = await self.get_project(session, tenant_id, project_id)
        if not project:
            return None

        if payload.name is not None:
            project.name = payload.name
        if payload.description is not None:
            project.description = payload.description
        if payload.is_active is not None:
            project.is_active = payload.is_active

        project.updated_by = actor_id
        await session.flush()
        return project

    async def delete_project(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        actor_id: uuid.UUID | None = None,
    ) -> bool:
        """Soft-delete project and its environments."""
        project = await self.get_project(session, tenant_id, project_id)
        if not project:
            return False

        now = datetime.now(timezone.utc)
        project.deleted_at = now
        project.deleted_by = actor_id

        # Soft-delete environments
        for env in project.environments:
            env.deleted_at = now
            env.deleted_by = actor_id

        await session.flush()
        return True

    # ---- Environment Operations ---------------------------------------

    async def list_environments(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
    ) -> list[ApiLogEnvironment]:
        """List environments for a project."""
        stmt = (
            select(ApiLogEnvironment)
            .where(
                ApiLogEnvironment.tenant_id == tenant_id,
                ApiLogEnvironment.project_id == project_id,
                ApiLogEnvironment.deleted_at.is_(None),
            )
            .order_by(ApiLogEnvironment.name.asc())
        )
        return list((await session.execute(stmt)).scalars().all())

    async def get_environment(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        env_id_or_slug: str | uuid.UUID,
    ) -> ApiLogEnvironment | None:
        """Fetch environment by UUID or slug within a project."""
        stmt = select(ApiLogEnvironment).where(
            ApiLogEnvironment.tenant_id == tenant_id,
            ApiLogEnvironment.project_id == project_id,
            ApiLogEnvironment.deleted_at.is_(None),
        )
        if isinstance(env_id_or_slug, uuid.UUID):
            stmt = stmt.where(ApiLogEnvironment.id == env_id_or_slug)
        else:
            try:
                parsed_uuid = uuid.UUID(str(env_id_or_slug))
                stmt = stmt.where((ApiLogEnvironment.id == parsed_uuid) | (ApiLogEnvironment.slug == env_id_or_slug))
            except ValueError:
                stmt = stmt.where(ApiLogEnvironment.slug == str(env_id_or_slug))

        return (await session.execute(stmt)).scalar_one_or_none()

    async def create_environment(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        payload: EnvironmentCreate,
        actor_id: uuid.UUID | None = None,
    ) -> ApiLogEnvironment:
        """Create a new deployment stage under a project."""
        env = ApiLogEnvironment(
            project_id=project_id,
            tenant_id=tenant_id,
            name=payload.name,
            slug=payload.slug.lower(),
            color_badge=payload.color_badge,
            created_by=actor_id,
        )
        session.add(env)
        await session.flush()
        return env

    async def update_environment(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        environment_id: uuid.UUID,
        payload: EnvironmentUpdate,
        actor_id: uuid.UUID | None = None,
    ) -> ApiLogEnvironment | None:
        """Update environment properties."""
        env = await self.get_environment(session, tenant_id, project_id, environment_id)
        if not env:
            return None

        if payload.name is not None:
            env.name = payload.name
        if payload.color_badge is not None:
            env.color_badge = payload.color_badge
        if payload.is_active is not None:
            env.is_active = payload.is_active

        env.updated_by = actor_id
        await session.flush()
        return env

    async def delete_environment(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID,
        environment_id: uuid.UUID,
        actor_id: uuid.UUID | None = None,
    ) -> bool:
        """Soft-delete an environment."""
        env = await self.get_environment(session, tenant_id, project_id, environment_id)
        if not env:
            return False

        env.deleted_at = datetime.now(timezone.utc)
        env.deleted_by = actor_id
        await session.flush()
        return True
