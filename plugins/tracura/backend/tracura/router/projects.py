"""API Logger Projects & Environments Control Plane Router."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from kernel.user.models.user import User
from tracura.auth.user_context import get_active_tenant_id, get_current_user
from tracura.schemas.project import (
    EnvironmentCreate,
    EnvironmentRead,
    EnvironmentUpdate,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)
from tracura.services.project_service import ProjectService

router = APIRouter(prefix="/v1/projects", tags=["API logger - Projects"])


def get_project_service() -> ProjectService:
    return ProjectService()


@router.get("", response_model=list[ProjectRead], summary="List all projects for current tenant")
async def list_projects(
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ProjectService = Depends(get_project_service),
) -> list[ProjectRead]:
    projects = await service.list_projects(session, tenant_id)
    return [ProjectRead.model_validate(p) for p in projects]


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED, summary="Create a new telemetry project")
async def create_project(
    payload: ProjectCreate,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ProjectService = Depends(get_project_service),
) -> ProjectRead:
    existing = await service.get_project(session, tenant_id, payload.slug)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Project with slug '{payload.slug}' already exists.")
    project = await service.create_project(session, tenant_id, payload, actor_id=current_user.id)
    return ProjectRead.model_validate(project)


@router.get(
    "/{project_id}",
    response_model=ProjectRead,
    summary="Get project details",
    responses={status.HTTP_404_NOT_FOUND: {"description": "Project not found"}},
)
async def get_project(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ProjectService = Depends(get_project_service),
) -> ProjectRead:
    project = await service.get_project(session, tenant_id, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return ProjectRead.model_validate(project)


@router.patch(
    "/{project_id}",
    response_model=ProjectRead,
    summary="Update project",
    responses={status.HTTP_404_NOT_FOUND: {"description": "Project not found"}},
)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ProjectService = Depends(get_project_service),
) -> ProjectRead:
    project = await service.update_project(session, tenant_id, project_id, payload, actor_id=current_user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return ProjectRead.model_validate(project)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete project",
    responses={status.HTTP_404_NOT_FOUND: {"description": "Project not found"}},
)
async def delete_project(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ProjectService = Depends(get_project_service),
) -> None:
    success = await service.delete_project(session, tenant_id, project_id, actor_id=current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")


# ---- Environment Endpoints --------------------------------------------

@router.get("/{project_id}/environments", response_model=list[EnvironmentRead], summary="List environments for a project")
async def list_environments(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ProjectService = Depends(get_project_service),
) -> list[EnvironmentRead]:
    environments = await service.list_environments(session, tenant_id, project_id)
    return [EnvironmentRead.model_validate(e) for e in environments]


@router.post(
    "/{project_id}/environments",
    response_model=EnvironmentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an environment",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Project not found"},
        status.HTTP_409_CONFLICT: {"description": "Environment exists"},
    },
)
async def create_environment(
    project_id: uuid.UUID,
    payload: EnvironmentCreate,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ProjectService = Depends(get_project_service),
) -> EnvironmentRead:
    project = await service.get_project(session, tenant_id, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    existing = await service.get_environment(session, tenant_id, project_id, payload.slug)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Environment with slug '{payload.slug}' already exists.")
    env = await service.create_environment(session, tenant_id, project_id, payload, actor_id=current_user.id)
    return EnvironmentRead.model_validate(env)


@router.patch(
    "/{project_id}/environments/{environment_id}",
    response_model=EnvironmentRead,
    summary="Update an environment",
    responses={status.HTTP_404_NOT_FOUND: {"description": "Environment not found"}},
)
async def update_environment(
    project_id: uuid.UUID,
    environment_id: uuid.UUID,
    payload: EnvironmentUpdate,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ProjectService = Depends(get_project_service),
) -> EnvironmentRead:
    env = await service.update_environment(session, tenant_id, project_id, environment_id, payload, actor_id=current_user.id)
    if not env:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Environment not found.")
    return EnvironmentRead.model_validate(env)


@router.delete(
    "/{project_id}/environments/{environment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an environment",
    responses={status.HTTP_404_NOT_FOUND: {"description": "Environment not found"}},
)
async def delete_environment(
    project_id: uuid.UUID,
    environment_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ProjectService = Depends(get_project_service),
) -> None:
    success = await service.delete_environment(session, tenant_id, project_id, environment_id, actor_id=current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Environment not found.")
