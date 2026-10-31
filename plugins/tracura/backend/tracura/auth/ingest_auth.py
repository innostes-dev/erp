"""FastAPI Authentication Dependency for Ingestion API."""

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from tracura.models.api_key import ApiLogApiKey
from tracura.services.api_key_service import ApiKeyService

_bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="Bearer Ingestion API Key (inno_log_live_...)",
)


def get_api_key_service() -> ApiKeyService:
    return ApiKeyService()


async def verify_ingestion_api_key(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    x_api_key: str | None = Header(
        default=None,
        alias="X-API-Key",
        description="Scoped Ingestion API Key (inno_log_live_...)",
    ),
    session: AsyncSession = Depends(get_db),
    key_service: ApiKeyService = Depends(get_api_key_service),
) -> ApiLogApiKey:
    """Validate X-API-Key header or Bearer inno_log_live_* key and IP allowlist for high-throughput log ingestion."""
    raw_key = x_api_key or (credentials.credentials if credentials and credentials.credentials else None)
    if not raw_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header. Ingestion requires a valid inno_log_live_* key.",
        )

    api_key = await key_service.verify_key(session, raw_key)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, revoked, or expired API Key.",
        )

    # Resolve client IP
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = (
        forwarded.split(",")[0].strip()
        if forwarded
        else (request.client.host if request.client else None)
    )

    # Validate IP allowlist
    if not key_service.validate_ip(api_key, client_ip):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Client IP '{client_ip}' is not permitted by API key IP allowlist.",
        )

    # Attach tenant_id and key to request state
    request.state.tenant_id = api_key.tenant_id
    request.state.api_key = api_key

    return api_key
