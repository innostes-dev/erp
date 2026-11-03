"""FastAPI HTTP router for PeopleOps Leave."""

from fastapi import APIRouter, status
from peopleops.leave.schemas import LeaveBaseResponse
from peopleops.leave.services import service

router = APIRouter(prefix="/leave", tags=["PeopleOps Leave"])

@router.get(
    "/types",
    response_model=LeaveBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List available leave types",
    operation_id="leave_list_types",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_leave_types() -> LeaveBaseResponse:
    """Execute list available leave types.
    \f
    Returns:
        LeaveBaseResponse with operational data.
    """
    data = await service.get_overview()
    return LeaveBaseResponse(data=data)

@router.get(
    "/balances",
    response_model=LeaveBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current employee leave balances",
    operation_id="leave_get_balances",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_leave_balances() -> LeaveBaseResponse:
    """Execute get current employee leave balances.
    \f
    Returns:
        LeaveBaseResponse with operational data.
    """
    data = await service.get_overview()
    return LeaveBaseResponse(data=data)

@router.post(
    "/applications",
    response_model=LeaveBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit new leave application",
    operation_id="leave_apply",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def apply_leave() -> LeaveBaseResponse:
    """Execute submit new leave application.
    \f
    Returns:
        LeaveBaseResponse with operational data.
    """
    data = await service.get_overview()
    return LeaveBaseResponse(data=data)

@router.get(
    "/ledger",
    response_model=LeaveBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get leave transaction ledger",
    operation_id="leave_get_ledger",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_leave_ledger() -> LeaveBaseResponse:
    """Execute get leave transaction ledger.
    \f
    Returns:
        LeaveBaseResponse with operational data.
    """
    data = await service.get_overview()
    return LeaveBaseResponse(data=data)

