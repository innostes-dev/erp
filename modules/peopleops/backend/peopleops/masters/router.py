"""FastAPI HTTP router for PeopleOps Masters."""

from fastapi import APIRouter, status
from peopleops.masters.schemas import MastersBaseResponse
from peopleops.masters.services import service

router = APIRouter(prefix="/masters", tags=["PeopleOps Masters"])

@router.get(
    "/departments",
    response_model=MastersBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List organizational departments",
    operation_id="departments_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_departments() -> MastersBaseResponse:
    """Execute list organizational departments.
    \f
    Returns:
        MastersBaseResponse with operational data.
    """
    data = await service.get_overview()
    return MastersBaseResponse(data=data)

@router.get(
    "/designations",
    response_model=MastersBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List job designations",
    operation_id="designations_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_designations() -> MastersBaseResponse:
    """Execute list job designations.
    \f
    Returns:
        MastersBaseResponse with operational data.
    """
    data = await service.get_overview()
    return MastersBaseResponse(data=data)

@router.get(
    "/locations",
    response_model=MastersBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List company office locations",
    operation_id="locations_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_locations() -> MastersBaseResponse:
    """Execute list company office locations.
    \f
    Returns:
        MastersBaseResponse with operational data.
    """
    data = await service.get_overview()
    return MastersBaseResponse(data=data)

@router.get(
    "/picklists",
    response_model=MastersBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List dynamic picklists by category",
    operation_id="picklists_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_picklists() -> MastersBaseResponse:
    """Execute list dynamic picklists by category.
    \f
    Returns:
        MastersBaseResponse with operational data.
    """
    data = await service.get_overview()
    return MastersBaseResponse(data=data)

