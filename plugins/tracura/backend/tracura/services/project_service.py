"""API Logger Project & Environment Management Service."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import select
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


class ProjectService:
    """Handles Project and Environment CRUD scoped to the current tenant."""

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
        return list((await session.execute(stmt)).scalars().all())

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
