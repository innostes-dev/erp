"""FastAPI HTTP router for PeopleOps Core."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.dependencies import SecurityContext, require_security_context
from kernel.core.database.session import get_db
from kernel.core.schemas import Page
from peopleops.core.schemas import EmployeeCreate, EmployeeRead, EmployeeUpdate
from peopleops.core.services import EmployeeService

router = APIRouter(prefix="/core", tags=["PeopleOps Core"])


@router.get(
    "/employees",
    response_model=Page[EmployeeRead],
    status_code=status.HTTP_200_OK,
    summary="List employee directory entries",
    operation_id="employees_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_employees(
    session: AsyncSession = Depends(get_db),
    ctx: SecurityContext = Depends(require_security_context("peopleops:read")),
    department: str | None = Query(None, description="Filter by department code"),
    search: str | None = Query(None, description="Search term for names or codes"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> Page[EmployeeRead]:
    """Execute list employee directory entries with optional search and filters.
    \f
    Returns:
        Page of EmployeeRead objects.
    """
    service = EmployeeService(session)
    items, total = await service.list_employees(
        tenant_id=ctx.tenant_id,
        department=department,
        search=search,
        offset=skip,
        limit=limit,
    )
    
    # Manually serialize the related models for Pydantic to parse properly
    serialized_items = [EmployeeRead.model_validate(item) for item in items]
    
    return Page[EmployeeRead](
        items=serialized_items,
        total=total,
        offset=skip,
        limit=limit,
    )


@router.post(
    "/employees",
    response_model=EmployeeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create party and employee record",
    operation_id="employees_create",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def create_employee(
    data: EmployeeCreate,
    session: AsyncSession = Depends(get_db),
    ctx: SecurityContext = Depends(require_security_context("peopleops:write")),
) -> EmployeeRead:
    """Create a new party and an associated employee record.
    \f
    Returns:
        The created EmployeeRead object.
    """
    service = EmployeeService(session)
    employee = await service.create_employee(
        tenant_id=ctx.tenant_id,
        data=data,
        actor_id=ctx.user.id,
    )
    return EmployeeRead.model_validate(employee)


@router.get(
    "/employees/{id}",
    response_model=EmployeeRead,
    status_code=status.HTTP_200_OK,
    summary="Get employee full profile",
    operation_id="employees_get_profile",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_employee_profile(
    id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    ctx: SecurityContext = Depends(require_security_context("peopleops:read")),
) -> EmployeeRead:
    """Execute get employee full profile.
    \f
    Returns:
        The employee profile object.
    """
    service = EmployeeService(session)
    employee = await service.get_employee_profile(
        tenant_id=ctx.tenant_id,
        employee_id=id,
    )
    return EmployeeRead.model_validate(employee)


@router.patch(
    "/employees/{id}",
    response_model=EmployeeRead,
    status_code=status.HTTP_200_OK,
    summary="Update operational metadata",
    operation_id="employees_update",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def update_employee(
    id: uuid.UUID,
    data: EmployeeUpdate,
    session: AsyncSession = Depends(get_db),
    ctx: SecurityContext = Depends(require_security_context("peopleops:write")),
) -> EmployeeRead:
    """Update operational metadata for an employee.
    \f
    Returns:
        The updated employee profile object.
    """
    service = EmployeeService(session)
    employee = await service.update_employee(
        tenant_id=ctx.tenant_id,
        employee_id=id,
        data=data,
        actor_id=ctx.user.id,
    )
    return EmployeeRead.model_validate(employee)
