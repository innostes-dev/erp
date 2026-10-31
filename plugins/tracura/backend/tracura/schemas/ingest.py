"""Universal Ingestion Payload & Batch Schemas."""

from datetime import datetime
from typing import Any
from pydantic import Field

from kernel.core.schemas import BaseSchema


class IngestLogItem(BaseSchema):
    """A single request/response telemetry log entry."""

    project: str = Field(..., min_length=1, max_length=64, description="Project slug or UUID string", examples=["payment-gateway"])
    environment: str = Field(..., min_length=1, max_length=64, description="Environment slug or UUID string", examples=["production"])

    # Tracing & Context
    correlation_id: str = Field(..., min_length=1, max_length=64, description="Unique trace / request ID", examples=["req_88fbc09d12"])
    user_id: str | None = Field(default=None, max_length=64, description="Authenticated actor ID if present", examples=["cust_992144"])
    client_ip: str | None = Field(default=None, max_length=45, description="Client IP address", examples=["103.21.244.1"])
    user_agent: str | None = Field(default=None, max_length=512, description="Client user agent", examples=["Mozilla/5.0..."])

    # HTTP Request & Response Core
    http_method: str = Field(..., min_length=1, max_length=10, description="HTTP method", examples=["POST"])
    url: str = Field(..., description="Full target request URL", examples=["https://api.company.com/v1/payments/charges"])
    path: str = Field(..., min_length=1, max_length=2048, description="Path component", examples=["/v1/payments/charges"])
    status_code: int = Field(..., ge=100, le=599, description="HTTP response status code", examples=[200])
    duration_ms: float = Field(..., ge=0.0, description="Total latency in milliseconds", examples=[138.45])

    # Payloads
    request_headers: dict[str, Any] | None = Field(default=None, description="Request headers (redacted on server)")
    query_params: dict[str, Any] | None = Field(default=None, description="URL query parameters")
    request_body: Any | None = Field(default=None, description="Raw request JSON or text")
    response_headers: dict[str, Any] | None = Field(default=None, description="Response headers")
    response_body: Any | None = Field(default=None, description="Response JSON or text")

    # Diagnostics & Extensibility
    error: dict[str, Any] | None = Field(default=None, description="Error diagnostics (code, message, stack trace)")
    meta: dict[str, Any] | None = Field(default=None, description="Developer custom data escape hatch (AI tokens, Stripe ID, git commit, pod)", examples=[{"model": "gpt-4o", "tokens": 420}])

    # Optional client timestamp (defaults to server receive time if omitted)
    created_at: datetime | None = Field(default=None, description="Timestamp when request occurred")


class IngestBatchRequest(BaseSchema):
    """Batch ingestion request payload."""

    items: list[IngestLogItem] = Field(..., min_length=1, max_length=250, description="List of telemetry logs to ingest in a single batch (max 250).")


class IngestResponse(BaseSchema):
    """Ingestion receipt confirmation."""

    accepted: int = Field(..., description="Number of log records enqueued")
    dropped: int = Field(default=0, description="Number of logs dropped due to sampling or excluded path")
    status: str = Field(default="accepted", description="Status code string")
