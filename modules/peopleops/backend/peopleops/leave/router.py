"""FastAPI HTTP router for PeopleOps Leave."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status, Path
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.dependencies import get_current_user
from kernel.core.database.session import get_db
from kernel.core.schemas import Page
from kernel.core.schemas.errors import error_responses

from peopleops.leave.schemas import (
    LeaveActionRequest,
    LeaveApplicationCreate,
    LeaveApplicationRead,
    LeaveBalanceRead,
    LeaveLedgerRead,
    LeaveTypeRead,
)
from peopleops.leave.services import service

router = APIRouter(prefix="/leave", tags=[])


@router.get(
    "/types",
    response_model=Page[LeaveTypeRead],
    status_code=status.HTTP_200_OK,
    summary="List available leave types",
    operation_id="leave_list_types",
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_leave_types(
    session: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> Page[LeaveTypeRead]:
    """Execute list available leave types for the tenant.
    \f
    Returns:
        Page[LeaveTypeRead] with list of available leave types.
    """
    tenant_id = uuid.UUID(user["tenant_id"])
    data = await service.list_leave_types(session, tenant_id)
    return Page(items=data, total=len(data), offset=0, limit=200)


@router.get(
    "/balances",
    response_model=Page[LeaveBalanceRead],
    status_code=status.HTTP_200_OK,
    summary="Get current employee leave balances",
    operation_id="leave_get_balances",
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_leave_balances(
    session: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> Page[LeaveBalanceRead]:
    """Execute get current employee leave balances.
    \f
    Returns:
        Page[LeaveBalanceRead] with computed balance data.
    """
    tenant_id = uuid.UUID(user["tenant_id"])
    employee_id = uuid.UUID(user["id"])
    data = await service.get_balances(session, tenant_id, employee_id)
    return Page(items=data, total=len(data), offset=0, limit=200)


@router.post(
    "/applications",
    response_model=LeaveApplicationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit new leave application",
    operation_id="leave_apply",
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def apply_leave(
    app_in: LeaveApplicationCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> LeaveApplicationRead:
    """Execute submit new leave application.
    \f
    Returns:
        LeaveApplicationRead with created application data.
    """
    tenant_id = uuid.UUID(user["tenant_id"])
    employee_id = uuid.UUID(user["id"])
    data = await service.apply_leave(session, tenant_id, employee_id, app_in)
    return data


@router.post(
    "/applications/{id}/approve",
    response_model=LeaveApplicationRead,
    status_code=status.HTTP_200_OK,
    summary="Approve leave application",
    operation_id="leave_approve_application",
    responses=error_responses(status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def approve_leave(
    id: Annotated[uuid.UUID, Path(description="The UUID of the leave application.")],
    request: LeaveActionRequest,
    session: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> LeaveApplicationRead:
    """Execute approve leave application.
    \f
    Returns:
        LeaveApplicationRead with updated application data.
    """
    tenant_id = uuid.UUID(user["tenant_id"])
    approver_id = uuid.UUID(user["id"])
    data = await service.approve_leave(session, tenant_id, id, approver_id, request)
    return data


@router.post(
    "/applications/{id}/reject",
    response_model=LeaveApplicationRead,
    status_code=status.HTTP_200_OK,
    summary="Reject leave application",
    operation_id="leave_reject_application",
    responses=error_responses(status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def reject_leave(
    id: Annotated[uuid.UUID, Path(description="The UUID of the leave application.")],
    request: LeaveActionRequest,
    session: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> LeaveApplicationRead:
    """Execute reject leave application.
    \f
    Returns:
        LeaveApplicationRead with updated application data.
    """
    tenant_id = uuid.UUID(user["tenant_id"])
    data = await service.reject_leave(session, tenant_id, id, request)
    return data


@router.get(
    "/ledger",
    response_model=Page[LeaveLedgerRead],
    status_code=status.HTTP_200_OK,
    summary="Get leave transaction ledger",
    operation_id="leave_get_ledger",
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_leave_ledger(
    session: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict, Depends(get_current_user)],
) -> Page[LeaveLedgerRead]:
    """Execute get leave transaction ledger.
    \f
    Returns:
        Page[LeaveLedgerRead] with list of ledger records.
    """
    tenant_id = uuid.UUID(user["tenant_id"])
    employee_id = uuid.UUID(user["id"])
    data = await service.get_ledger(session, tenant_id, employee_id)
    return Page(items=data, total=len(data), offset=0, limit=200)

