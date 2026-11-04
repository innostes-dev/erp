"""FastAPI HTTP router for PeopleOps Masters."""

import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, Query, status

from kernel.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from kernel.auth.dependencies import SecurityContext, require_security_context
from kernel.core.schemas import error_responses
from kernel.core.services import (
    NotFoundError, ConflictError, ForbiddenError, UnauthorizedError, UnprocessableContentError
)

from peopleops.masters.schemas import (
    DepartmentCreate, DepartmentUpdate, DepartmentRead, DepartmentPage,
    DesignationCreate, DesignationUpdate, DesignationRead, DesignationPage,
    LocationCreate, LocationUpdate, LocationRead, LocationPage,
    HolidayCalendarCreate, HolidayCalendarUpdate, HolidayCalendarRead, HolidayCalendarPage,
    HolidayCreate, HolidayUpdate, HolidayRead, HolidayPage,
    PicklistCreate, PicklistUpdate, PicklistRead, PicklistPage,
    MastersBaseResponse
)
from peopleops.masters.services import (
    service,
    DepartmentService, DesignationService, LocationService, 
    HolidayCalendarService, HolidayService, PicklistService
)

router = APIRouter(prefix="/masters", tags=["PeopleOps Masters"])

@router.post(
    "/seed",
    response_model=MastersBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Reseed missing tenant masters",
    operation_id="masters_seed",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError)
)
async def seed_masters(
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> MastersBaseResponse:
    """Idempotently restore standard system defaults for the tenant.
    \f
    Returns:
        Success response on completion.
    """
    await service.reseed_defaults(session, ctx.tenant_id, ctx.user.id)
    return MastersBaseResponse(message="Tenant masters reseeded successfully.")


# Departments
@router.post(
    "/departments",
    response_model=DepartmentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a department",
    operation_id="departments_create",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, ConflictError)
)
async def create_department(
    payload: DepartmentCreate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> DepartmentRead:
    """Create a new organizational department.
    \f
    Returns:
        The created department.
    """
    dept_service = DepartmentService(session)
    return await dept_service.create(payload, ctx.user.id, tenant_id=ctx.tenant_id)

@router.get(
    "/departments",
    response_model=DepartmentPage,
    status_code=status.HTTP_200_OK,
    summary="List organizational departments",
    operation_id="departments_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError)
)
async def list_departments(
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:read"))],
    session: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
) -> DepartmentPage:
    """Execute list organizational departments.
    \f
    Returns:
        Paginated departments.
    """
    dept_service = DepartmentService(session)
    items, total = await dept_service.list(skip=skip, limit=limit, tenant_id=ctx.tenant_id)
    return DepartmentPage(items=items, total=total, offset=skip, limit=limit)

@router.patch(
    "/departments/{id}",
    response_model=DepartmentRead,
    status_code=status.HTTP_200_OK,
    summary="Update a department",
    operation_id="departments_update",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, NotFoundError)
)
async def update_department(
    id: uuid.UUID,
    payload: DepartmentUpdate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> DepartmentRead:
    """Update department attributes.
    \f
    Returns:
        The updated department.
    """
    dept_service = DepartmentService(session)
    return await dept_service.update(id, payload, ctx.user.id, tenant_id=ctx.tenant_id)


# Designations
@router.post(
    "/designations",
    response_model=DesignationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a designation",
    operation_id="designations_create",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, ConflictError)
)
async def create_designation(
    payload: DesignationCreate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> DesignationRead:
    """Create a new job designation.
    \f
    Returns:
        The created designation.
    """
    desig_service = DesignationService(session)
    return await desig_service.create(payload, ctx.user.id, tenant_id=ctx.tenant_id)

@router.get(
    "/designations",
    response_model=DesignationPage,
    status_code=status.HTTP_200_OK,
    summary="List job designations",
    operation_id="designations_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError)
)
async def list_designations(
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:read"))],
    session: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
) -> DesignationPage:
    """Execute list job designations.
    \f
    Returns:
        Paginated designations.
    """
    desig_service = DesignationService(session)
    items, total = await desig_service.list(skip=skip, limit=limit, tenant_id=ctx.tenant_id)
    return DesignationPage(items=items, total=total, offset=skip, limit=limit)

@router.patch(
    "/designations/{id}",
    response_model=DesignationRead,
    status_code=status.HTTP_200_OK,
    summary="Update a designation",
    operation_id="designations_update",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, NotFoundError)
)
async def update_designation(
    id: uuid.UUID,
    payload: DesignationUpdate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> DesignationRead:
    """Update designation attributes.
    \f
    Returns:
        The updated designation.
    """
    desig_service = DesignationService(session)
    return await desig_service.update(id, payload, ctx.user.id, tenant_id=ctx.tenant_id)


# Locations
@router.post(
    "/locations",
    response_model=LocationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a location",
    operation_id="locations_create",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, ConflictError)
)
async def create_location(
    payload: LocationCreate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> LocationRead:
    """Create a new office location.
    \f
    Returns:
        The created location.
    """
    loc_service = LocationService(session)
    return await loc_service.create(payload, ctx.user.id, tenant_id=ctx.tenant_id)

@router.get(
    "/locations",
    response_model=LocationPage,
    status_code=status.HTTP_200_OK,
    summary="List company office locations",
    operation_id="locations_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError)
)
async def list_locations(
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:read"))],
    session: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
) -> LocationPage:
    """Execute list company office locations.
    \f
    Returns:
        Paginated locations.
    """
    loc_service = LocationService(session)
    items, total = await loc_service.list(skip=skip, limit=limit, tenant_id=ctx.tenant_id)
    return LocationPage(items=items, total=total, offset=skip, limit=limit)

@router.patch(
    "/locations/{id}",
    response_model=LocationRead,
    status_code=status.HTTP_200_OK,
    summary="Update a location",
    operation_id="locations_update",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, NotFoundError)
)
async def update_location(
    id: uuid.UUID,
    payload: LocationUpdate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> LocationRead:
    """Update office location parameters.
    \f
    Returns:
        The updated location.
    """
    loc_service = LocationService(session)
    return await loc_service.update(id, payload, ctx.user.id, tenant_id=ctx.tenant_id)


# Holiday Calendars
@router.post(
    "/holiday-calendars",
    response_model=HolidayCalendarRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a holiday calendar",
    operation_id="holiday_calendars_create",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, ConflictError)
)
async def create_holiday_calendar(
    payload: HolidayCalendarCreate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> HolidayCalendarRead:
    """Create a new holiday calendar.
    \f
    Returns:
        The created holiday calendar.
    """
    cal_service = HolidayCalendarService(session)
    return await cal_service.create(payload, ctx.user.id, tenant_id=ctx.tenant_id)

@router.get(
    "/holiday-calendars",
    response_model=HolidayCalendarPage,
    status_code=status.HTTP_200_OK,
    summary="List holiday calendars",
    operation_id="holiday_calendars_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError)
)
async def list_holiday_calendars(
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:read"))],
    session: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
) -> HolidayCalendarPage:
    """Execute list holiday calendars.
    \f
    Returns:
        Paginated holiday calendars.
    """
    cal_service = HolidayCalendarService(session)
    items, total = await cal_service.list(skip=skip, limit=limit, tenant_id=ctx.tenant_id)
    return HolidayCalendarPage(items=items, total=total, offset=skip, limit=limit)


# Holidays
@router.post(
    "/holidays",
    response_model=HolidayRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a holiday",
    operation_id="holidays_create",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, ConflictError)
)
async def create_holiday(
    payload: HolidayCreate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> HolidayRead:
    """Create a new holiday linked to a calendar.
    \f
    Returns:
        The created holiday.
    """
    hol_service = HolidayService(session)
    return await hol_service.create(payload, ctx.user.id, tenant_id=ctx.tenant_id)

@router.get(
    "/holidays",
    response_model=HolidayPage,
    status_code=status.HTTP_200_OK,
    summary="List calendar holidays",
    operation_id="holidays_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError)
)
async def list_holidays(
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:read"))],
    session: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
) -> HolidayPage:
    """Execute list calendar holidays.
    \f
    Returns:
        Paginated holidays.
    """
    hol_service = HolidayService(session)
    items, total = await hol_service.list(skip=skip, limit=limit, tenant_id=ctx.tenant_id)
    return HolidayPage(items=items, total=total, offset=skip, limit=limit)


# Picklists
@router.post(
    "/picklists",
    response_model=PicklistRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a picklist",
    operation_id="picklists_create",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, ConflictError)
)
async def create_picklist(
    payload: PicklistCreate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> PicklistRead:
    """Create a new dynamic picklist option.
    \f
    Returns:
        The created picklist.
    """
    pick_service = PicklistService(session)
    return await pick_service.create(payload, ctx.user.id, tenant_id=ctx.tenant_id)

@router.get(
    "/picklists",
    response_model=PicklistPage,
    status_code=status.HTTP_200_OK,
    summary="List dynamic picklists by category",
    operation_id="picklists_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError)
)
async def list_picklists(
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:read"))],
    session: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
) -> PicklistPage:
    """Execute list dynamic picklists by category.
    \f
    Returns:
        Paginated picklists.
    """
    pick_service = PicklistService(session)
    items, total = await pick_service.list(skip=skip, limit=limit, tenant_id=ctx.tenant_id)
    return PicklistPage(items=items, total=total, offset=skip, limit=limit)

@router.patch(
    "/picklists/{id}",
    response_model=PicklistRead,
    status_code=status.HTTP_200_OK,
    summary="Update a picklist",
    operation_id="picklists_update",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, ForbiddenError, NotFoundError)
)
async def update_picklist(
    id: uuid.UUID,
    payload: PicklistUpdate,
    ctx: Annotated[SecurityContext, Depends(require_security_context("peopleops:admin"))],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> PicklistRead:
    """Update dynamic picklist metadata.
    \f
    Returns:
        The updated picklist.
    """
    pick_service = PicklistService(session)
    return await pick_service.update(id, payload, ctx.user.id, tenant_id=ctx.tenant_id)
