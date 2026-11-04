"""FastAPI HTTP router for PeopleOps Attendance."""

from fastapi import APIRouter, status
from peopleops.attendance.schemas import AttendanceBaseResponse, RegularizePunchRequest
from peopleops.attendance.services import service

router = APIRouter(prefix="/attendance", tags=["PeopleOps Attendance"])

@router.post(
    "/check-in",
    response_model=AttendanceBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Log employee check-in punch",
    operation_id="attendance_check_in",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def check_in() -> AttendanceBaseResponse:
    """Execute log employee check-in punch.
    \f
    Returns:
        AttendanceBaseResponse with operational data.
    """
    data = await service.process_punch(direction="in")
    return AttendanceBaseResponse(data=data)

@router.post(
    "/check-out",
    response_model=AttendanceBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Log employee check-out punch",
    operation_id="attendance_check_out",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def check_out() -> AttendanceBaseResponse:
    """Execute log employee check-out punch.
    \f
    Returns:
        AttendanceBaseResponse with operational data.
    """
    data = await service.process_punch(direction="out")
    return AttendanceBaseResponse(data=data)

@router.get(
    "/status",
    response_model=AttendanceBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current workday attendance status",
    operation_id="attendance_get_status",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_daily_status() -> AttendanceBaseResponse:
    """Execute get current workday attendance status.
    \f
    Returns:
        AttendanceBaseResponse with operational data.
    """
    data = await service.get_daily_status()
    return AttendanceBaseResponse(data=data)

@router.get(
    "/timesheets",
    response_model=AttendanceBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List monthly attendance timesheets",
    operation_id="attendance_list_timesheets",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_timesheets() -> AttendanceBaseResponse:
    """Execute list monthly attendance timesheets.
    \f
    Returns:
        AttendanceBaseResponse with operational data.
    """
    data = await service.get_timesheets()
    return AttendanceBaseResponse(data=data)

@router.post(
    "/regularize",
    response_model=AttendanceBaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit punch regularization request",
    operation_id="attendance_regularize",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def regularize_punch(request: RegularizePunchRequest) -> AttendanceBaseResponse:
    """Submit punch regularization request with reason for manager sign-off.
    \f
    Args:
        request: RegularizePunchRequest with details.

    Returns:
        AttendanceBaseResponse with operational data.
    """
    data = await service.regularize_punch(
        reason=request.reason,
        punch_time=request.punch_time,
        direction=request.direction,
    )
    return AttendanceBaseResponse(data=data)
