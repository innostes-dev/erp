"""FastAPI HTTP router for PeopleOps Offboarding."""

import uuid
from fastapi import APIRouter, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from peopleops.offboarding.schemas import (
    OffboardingBaseResponse, 
    SeparationCreate, 
    SeparationRead, 
    SettlementSheetRead
)
from peopleops.offboarding.services import service
from kernel.core.database.session import get_db
from kernel.core.schemas.base import Page
from kernel.core.schemas.errors import error_responses
from kernel.core.services.errors import NotFoundError

router = APIRouter(prefix="/offboarding", tags=["PeopleOps Offboarding"])

@router.get(
    "/separations",
    response_model=Page[SeparationRead],
    status_code=status.HTTP_200_OK,
    summary="List active and archived employee separations",
    operation_id="offboarding_list_separations",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def list_separations(
    skip: int = 0, limit: int = 20, session: AsyncSession = Depends(get_db)
) -> Page[SeparationRead]:
    """Execute list employee separation cases.
    \f
    Returns:
        Page of SeparationRead containing separation details.
    """
    separations = await service.list_separations(session)
    return Page(items=separations, total=len(separations), offset=skip, limit=limit)

@router.post(
    "/separations",
    response_model=SeparationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate resignation or termination",
    operation_id="offboarding_initiate_separation",
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def initiate_separation(
    payload: SeparationCreate, session: AsyncSession = Depends(get_db)
) -> SeparationRead:
    """Record employee resignation or termination, define exit type, and compute contractual notice period.
    \f
    Returns:
        SeparationRead with created separation details.
    """
    return await service.initiate_separation(session, payload)

@router.get(
    "/settlements/{separation_id}",
    response_model=SettlementSheetRead,
    status_code=status.HTTP_200_OK,
    summary="Get Full & Final settlement breakdown",
    operation_id="offboarding_get_settlement",
    responses=error_responses(NotFoundError),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def get_settlement_sheet(
    separation_id: uuid.UUID, session: AsyncSession = Depends(get_db)
) -> SettlementSheetRead:
    """Calculate and retrieve comprehensive F&F settlement sheet.
    \f
    Returns:
        SettlementSheetRead with the calculated payout details.
    """
    return await service.calculate_settlement(session, separation_id)

@router.post(
    "/settlements/{separation_id}/disburse",
    response_model=OffboardingBaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Disburse F&F settlement",
    operation_id="offboarding_disburse_settlement",
    responses=error_responses(NotFoundError),
    openapi_extra={"security": [{"BearerAuth": []}]},
)
async def disburse_settlement(
    separation_id: uuid.UUID, session: AsyncSession = Depends(get_db)
) -> OffboardingBaseResponse:
    """Commit F&F settlement disbursement and trigger GL journal / Bank Batch events.
    \f
    Returns:
        OffboardingBaseResponse confirming the disbursement.
    """
    data = await service.disburse_settlement(session, separation_id)
    return OffboardingBaseResponse(status="ok", message="Settlement successfully disbursed", data=data)
