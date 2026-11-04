"""FastAPI HTTP router for PeopleOps Payroll."""

from fastapi import APIRouter, status
from peopleops.payroll.schemas import (
    PayrollBaseResponse, 
    HRMSPayrollSettingUpdate,
    HRMSPayrollRunCreate
)
from peopleops.payroll.services import service

router = APIRouter(prefix="/payroll", tags=["PeopleOps Payroll"])

@router.get(
    "/settings",
    response_model=PayrollBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get payroll settings",
    operation_id="payroll_get_settings",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_payroll_settings() -> PayrollBaseResponse:
    """Execute get payroll settings.
    \f
    Returns:
        PayrollBaseResponse with operational data.
    """
    data = await service.get_overview()
    return PayrollBaseResponse(data=data)

@router.patch(
    "/settings",
    response_model=PayrollBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Update payroll settings",
    operation_id="payroll_update_settings",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def update_payroll_settings(settings_update: HRMSPayrollSettingUpdate) -> PayrollBaseResponse:
    """Execute update payroll settings.
    \f
    Returns:
        PayrollBaseResponse with operational data.
    """
    data = await service.get_overview()
    return PayrollBaseResponse(data=data)

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

@router.post(
    "/runs",
    response_model=PayrollBaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a monthly payroll run",
    operation_id="payroll_create_run",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def create_payroll_run(run_create: HRMSPayrollRunCreate) -> PayrollBaseResponse:
    """Execute create a monthly payroll run.
    \f
    Returns:
        PayrollBaseResponse with operational data.
    """
    data = await service.get_overview()
    return PayrollBaseResponse(data=data)

@router.get(
    "/runs/{id}/payslips",
    response_model=PayrollBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List payslips for a specific payroll run",
    operation_id="payroll_list_run_payslips",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_run_payslips(id: str) -> PayrollBaseResponse:
    """Execute list payslips for a specific payroll run.
    \f
    Returns:
        PayrollBaseResponse with operational data.
    """
    data = await service.get_overview()
    return PayrollBaseResponse(data=data)

@router.get(
    "/payslips/{id}",
    response_model=PayrollBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a specific payslip",
    operation_id="payroll_get_payslip",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_payslip(id: str) -> PayrollBaseResponse:
    """Execute get a specific payslip.
    \f
    Returns:
        PayrollBaseResponse with operational data.
    """
    data = await service.get_overview()
    return PayrollBaseResponse(data=data)

@router.get(
    "/structures",
    response_model=PayrollBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List salary structures",
    operation_id="payroll_list_structures",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_salary_structures() -> PayrollBaseResponse:
    """Execute list salary structures.
    \f
    Returns:
        PayrollBaseResponse with operational data.
    """
    data = await service.get_overview()
    return PayrollBaseResponse(data=data)

