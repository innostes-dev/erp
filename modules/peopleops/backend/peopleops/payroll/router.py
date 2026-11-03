"""FastAPI HTTP router for PeopleOps Payroll."""

from fastapi import APIRouter, status
from peopleops.payroll.schemas import PayrollBaseResponse
from peopleops.payroll.services import service

router = APIRouter(prefix="/payroll", tags=["PeopleOps Payroll"])

@router.get(
    "/runs",
    response_model=PayrollBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List monthly payroll execution runs",
    operation_id="payroll_list_runs",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_payroll_runs() -> PayrollBaseResponse:
    """Execute list monthly payroll execution runs.
    \f
    Returns:
        PayrollBaseResponse with operational data.
    """
    data = await service.get_overview()
    return PayrollBaseResponse(data=data)

@router.get(
    "/payslips",
    response_model=PayrollBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List employee monthly payslips",
    operation_id="payroll_list_payslips",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_payslips() -> PayrollBaseResponse:
    """Execute list employee monthly payslips.
    \f
    Returns:
        PayrollBaseResponse with operational data.
    """
    data = await service.get_overview()
    return PayrollBaseResponse(data=data)

@router.get(
    "/structure",
    response_model=PayrollBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get employee assigned salary structure",
    operation_id="payroll_get_structure",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_salary_structure() -> PayrollBaseResponse:
    """Execute get employee assigned salary structure.
    \f
    Returns:
        PayrollBaseResponse with operational data.
    """
    data = await service.get_overview()
    return PayrollBaseResponse(data=data)

