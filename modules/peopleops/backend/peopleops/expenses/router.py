"""FastAPI HTTP router for PeopleOps Expenses."""

from fastapi import APIRouter, status
from peopleops.expenses.schemas import ExpensesBaseResponse, ExpenseClaimCreate
from peopleops.expenses.services import service

router = APIRouter(prefix="/expenses", tags=["PeopleOps Expenses"])

@router.get(
    "/categories",
    response_model=ExpensesBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List eligible expense categories",
    operation_id="expenses_list_categories",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_expense_categories() -> ExpensesBaseResponse:
    """Execute list eligible expense categories.
    \f
    Returns:
        ExpensesBaseResponse with operational data.
    """
    data = await service.get_categories()
    return ExpensesBaseResponse(data=data)

@router.get(
    "/claims",
    response_model=ExpensesBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List submitted expense reimbursement claims",
    operation_id="expenses_list_claims",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_expense_claims() -> ExpensesBaseResponse:
    """Execute list submitted expense reimbursement claims.
    \f
    Returns:
        ExpensesBaseResponse with operational data.
    """
    data = await service.get_claims()
    return ExpensesBaseResponse(data=data)

@router.post(
    "/claims",
    response_model=ExpensesBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit new expense reimbursement claim",
    operation_id="expenses_submit_claim",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def submit_expense_claim(payload: ExpenseClaimCreate) -> ExpensesBaseResponse:
    """Execute submit new expense reimbursement claim.
    \f
    Args:
        payload: The expense claim data.
    Returns:
        ExpensesBaseResponse with operational data.
    """
    data = await service.submit_claim(payload)
    return ExpensesBaseResponse(data=data)

@router.post(
    "/claims/{id}/approve",
    response_model=ExpensesBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve an expense claim",
    operation_id="expenses_approve_claim",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def approve_expense_claim(id: str) -> ExpensesBaseResponse:
    """Execute approve an expense claim.
    \f
    Args:
        id: The claim ID to approve.
    Returns:
        ExpensesBaseResponse with operational data.
    """
    data = await service.approve_claim(id)
    return ExpensesBaseResponse(data=data)

@router.post(
    "/claims/{id}/reject",
    response_model=ExpensesBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Reject an expense claim",
    operation_id="expenses_reject_claim",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def reject_expense_claim(id: str) -> ExpensesBaseResponse:
    """Execute reject an expense claim.
    \f
    Args:
        id: The claim ID to reject.
    Returns:
        ExpensesBaseResponse with operational data.
    """
    data = await service.reject_claim(id)
    return ExpensesBaseResponse(data=data)
