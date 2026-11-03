"""FastAPI HTTP router for PeopleOps Core."""

from fastapi import APIRouter, status
from peopleops.core.schemas import CoreBaseResponse
from peopleops.core.services import service

router = APIRouter(prefix="/core", tags=["PeopleOps Core"])

@router.get(
    "/employees",
    response_model=CoreBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List employee directory entries",
    operation_id="employees_list",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_employees() -> CoreBaseResponse:
    """Execute list employee directory entries.
    \f
    Returns:
        CoreBaseResponse with operational data.
    """
    data = await service.get_overview()
    return CoreBaseResponse(data=data)

@router.get(
    "/employees/{id}",
    response_model=CoreBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get employee full profile",
    operation_id="employees_get_profile",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_employee_profile() -> CoreBaseResponse:
    """Execute get employee full profile.
    \f
    Returns:
        CoreBaseResponse with operational data.
    """
    data = await service.get_overview()
    return CoreBaseResponse(data=data)

