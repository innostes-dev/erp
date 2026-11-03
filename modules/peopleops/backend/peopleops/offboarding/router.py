"""FastAPI HTTP router for PeopleOps Offboarding."""

from fastapi import APIRouter, status
from peopleops.offboarding.schemas import OffboardingBaseResponse
from peopleops.offboarding.services import service

router = APIRouter(prefix="/offboarding", tags=["PeopleOps Offboarding"])

@router.get(
    "/separations",
    response_model=OffboardingBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="List employee separation cases",
    operation_id="offboarding_list_separations",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_separations() -> OffboardingBaseResponse:
    """Execute list employee separation cases.
    \f
    Returns:
        OffboardingBaseResponse with operational data.
    """
    data = await service.get_overview()
    return OffboardingBaseResponse(data=data)

@router.get(
    "/settlements/{separation_id}",
    response_model=OffboardingBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Full & Final settlement breakdown",
    operation_id="offboarding_get_settlement",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_settlement_sheet() -> OffboardingBaseResponse:
    """Execute get full & final settlement breakdown.
    \f
    Returns:
        OffboardingBaseResponse with operational data.
    """
    data = await service.get_overview()
    return OffboardingBaseResponse(data=data)

