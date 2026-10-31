"""API Logger Universal Telemetry Model (Immutable Append-Only)."""

from datetime import datetime
from typing import Any
import uuid
from sqlalchemy import DateTime, Float, Index, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from kernel.core.database.base import Base


class ApiLog(Base):
    """Universal immutable request/response telemetry record.
    
    Strictly append-only with zero update/delete mutations.
    Features 15 core telemetry columns + `meta` JSONB as an arbitrary developer escape hatch.
    """

    __tablename__ = "api_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    environment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    api_key_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )

    # Tracing & Identity
    correlation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    client_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # HTTP Request & Response Core
    http_method: Mapped[str] = mapped_column(String(10), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    path: Mapped[str] = mapped_column(String(2048), nullable=False)
    status_code: Mapped[int] = mapped_column(SmallInteger, nullable=False, index=True)
    duration_ms: Mapped[float] = mapped_column(Float, nullable=False, index=True)

    # Payloads (Sanitized JSONB)
    request_headers: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    query_params: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    request_body: Mapped[Any | None] = mapped_column(JSONB, nullable=True)
    response_headers: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    response_body: Mapped[Any | None] = mapped_column(JSONB, nullable=True)

    # Diagnostics & Extensibility
    error: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    meta: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    # Immutable Time
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    __table_args__ = (
        Index("ix_api_logs_composite_filter", "tenant_id", "project_id", "environment_id", "created_at"),
        Index("ix_api_logs_status_time", "tenant_id", "status_code", "created_at"),
        Index("ix_api_logs_duration_time", "tenant_id", "duration_ms"),
    )

    def to_dict(self) -> dict[str, Any]:
        """Convert log model attributes to a dictionary."""
        return {
            "id": str(self.id),
            "tenant_id": str(self.tenant_id),
            "project_id": str(self.project_id),
            "environment_id": str(self.environment_id),
            "api_key_id": str(self.api_key_id) if self.api_key_id else None,
            "correlation_id": self.correlation_id,
            "user_id": self.user_id,
            "client_ip": self.client_ip,
            "user_agent": self.user_agent,
            "http_method": self.http_method,
            "url": self.url,
            "path": self.path,
            "status_code": self.status_code,
            "duration_ms": self.duration_ms,
            "request_headers": self.request_headers,
            "query_params": self.query_params,
            "request_body": self.request_body,
            "response_headers": self.response_headers,
            "response_body": self.response_body,
            "error": self.error,
            "meta": self.meta,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
