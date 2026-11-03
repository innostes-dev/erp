"""FastAPI HTTP router for PeopleOps Expenses."""

from fastapi import APIRouter, status
from peopleops.expenses.schemas import ExpensesBaseResponse
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
    data = await service.get_overview()
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
    data = await service.get_overview()
    return ExpensesBaseResponse(data=data)

@router.post(
    "/claims",
    response_model=ExpensesBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit new expense reimbursement claim",
    operation_id="expenses_submit_claim",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def submit_expense_claim() -> ExpensesBaseResponse:
    """Execute submit new expense reimbursement claim.
    \f
    Returns:
        ExpensesBaseResponse with operational data.
    """
    data = await service.get_overview()
    return ExpensesBaseResponse(data=data)

