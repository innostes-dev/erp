"""API Logger Ingestion Router (Protected exclusively by Scoped Ingestion Keys)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from tracura.auth.ingest_auth import verify_ingestion_api_key
from tracura.models.api_key import ApiLogApiKey
from tracura.schemas.ingest import IngestBatchRequest, IngestLogItem, IngestResponse
from tracura.services.ingest_service import IngestService

router = APIRouter(prefix="/v1/ingest", tags=["API logger - Ingestion"])


def get_ingest_service() -> IngestService:
    return IngestService()


@router.post(
    "",
    response_model=IngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest a single request/response telemetry log",
    description="High-throughput asynchronous ingestion endpoint. Accepts an inno_log_live_* key via X-API-Key header.",
    responses={status.HTTP_401_UNAUTHORIZED: {"description": "Invalid or missing API key"}},
)
async def ingest_single_log(
    payload: IngestLogItem,
    api_key: ApiLogApiKey = Depends(verify_ingestion_api_key),
    session: AsyncSession = Depends(get_db),
    ingest_service: IngestService = Depends(get_ingest_service),
) -> IngestResponse:
    """Ingest a single request/response log entry asynchronously."""
    return await ingest_service.ingest_logs(session, api_key, [payload])


@router.post(
    "/batch",
    response_model=IngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest a batch of request/response telemetry logs",
    description="High-throughput batch ingestion endpoint (up to 250 items). Authenticates via X-API-Key.",
    responses={status.HTTP_401_UNAUTHORIZED: {"description": "Invalid or missing API key"}},
)
async def ingest_batch_logs(
    payload: IngestBatchRequest,
    api_key: ApiLogApiKey = Depends(verify_ingestion_api_key),
    session: AsyncSession = Depends(get_db),
    ingest_service: IngestService = Depends(get_ingest_service),
) -> IngestResponse:
    """Ingest a batch of telemetry logs asynchronously."""
    return await ingest_service.ingest_logs(session, api_key, payload.items)
