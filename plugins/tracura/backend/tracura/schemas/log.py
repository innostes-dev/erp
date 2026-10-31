"""API Logger Query & Log Read Pydantic Schemas."""

from datetime import datetime
from typing import Any
import uuid
from pydantic import Field

from kernel.core.schemas import BaseSchema


class LogRead(BaseSchema):
    """Detailed log record representation."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    project_id: uuid.UUID
    environment_id: uuid.UUID
    api_key_id: uuid.UUID | None = None
    correlation_id: str
    user_id: str | None = None
    client_ip: str | None = None
    user_agent: str | None = None
    http_method: str
    url: str
    path: str
    status_code: int
    duration_ms: float
    request_headers: dict[str, Any] | None = None
    query_params: dict[str, Any] | None = None
    request_body: Any | None = None
    response_headers: dict[str, Any] | None = None
    response_body: Any | None = None
    error: dict[str, Any] | None = None
    meta: dict[str, Any] | None = None
    created_at: datetime


class LogListResponse(BaseSchema):
    """Paginated list of logs."""

    items: list[LogRead]
    total: int
    offset: int
    limit: int
