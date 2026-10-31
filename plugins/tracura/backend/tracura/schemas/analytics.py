"""API Logger Analytics & Telemetry Aggregations Schemas."""

from datetime import datetime
from pydantic import Field

from kernel.core.schemas import BaseSchema


class KpiSummary(BaseSchema):
    """High-level telemetry KPIs."""

    total_requests: int = Field(..., description="Total requests processed in period")
    successful_requests: int = Field(default=0, description="Total successful requests (status < 400)")
    success_rate_pct: float = Field(default=100.0, description="Percentage of requests with status < 400")
    error_requests: int = Field(default=0, description="Total error requests (status >= 400)")
    error_rate_pct: float = Field(..., description="Percentage of requests with status >= 400")
    avg_latency_ms: float = Field(..., description="Average latency in ms")
    p95_latency_ms: float = Field(..., description="95th percentile latency in ms")
    p99_latency_ms: float = Field(..., description="99th percentile latency in ms")
    status_breakdown: dict[str, int] = Field(..., description="Counts grouped by 2xx, 3xx, 4xx, 5xx")


class TimeseriesPoint(BaseSchema):
    """Timeseries data point for traffic and errors."""

    timestamp: datetime
    label: str = Field(default="", description="Hour label, e.g. 12 AM")
    requests: int
    errors: int
    avg_latency_ms: float
    p95_latency_ms: float = Field(default=0.0)


class EnvironmentHealthItem(BaseSchema):
    """Per-environment health and error statistics."""

    environment: str
    environment_id: str | None = None
    color_badge: str = Field(default="emerald")
    requests: int
    error_rate_pct: float
    avg_latency_ms: float
    status: str = Field(default="Healthy", description="Healthy, Degraded, or Issues")


class TopEndpointItem(BaseSchema):
    """Most requested API endpoints and performance."""

    http_method: str
    path: str
    requests: int
    error_rate_pct: float
    avg_latency_ms: float


class TopErrorItem(BaseSchema):
    """Aggregated top errors encountered."""

    error_type: str
    error_message: str | None = None
    count: int
    last_seen: str


class AnalyticsDashboard(BaseSchema):
    """Combined dashboard response for the UI."""

    kpi: KpiSummary
    timeseries: list[TimeseriesPoint]
    environment_health: list[EnvironmentHealthItem] = []
    top_endpoints: list[TopEndpointItem] = []
    top_errors: list[TopErrorItem] = []
