"""API Logger Configuration & Privacy Settings Model."""

import uuid
from sqlalchemy import Boolean, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class ApiLogSettings(BaseModel):
    """Retention, sampling, and multi-vector secret scrubbing policies."""

    __tablename__ = "api_log_settings"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_log_projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    environment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_log_environments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Retention & Buffer
    retention_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    max_body_size_bytes: Mapped[int] = mapped_column(Integer, default=4096, nullable=False)

    # Ingestion Filters
    sampling_rate: Mapped[float] = mapped_column(Float, default=1.00, nullable=False)
    capture_headers: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    capture_body: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    log_errors_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    excluded_paths: Mapped[list[str]] = mapped_column(
        JSONB,
        default=lambda: ["/health", "/metrics", "/favicon.ico"],
        nullable=False,
    )

    # PII & Secret Scrubbing
    sensitive_headers: Mapped[list[str]] = mapped_column(
        JSONB,
        default=lambda: ["authorization", "cookie", "x-api-key", "proxy-authorization", "set-cookie"],
        nullable=False,
    )
    sensitive_body_fields: Mapped[list[str]] = mapped_column(
        JSONB,
        default=lambda: ["password", "secret", "credit_card", "token", "cvv", "ssn", "access_token", "refresh_token"],
        nullable=False,
    )
    mask_client_ip: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "project_id", "environment_id", name="uq_api_log_settings_scope"),
    )

    project = relationship("ApiLogProject")
    environment = relationship("ApiLogEnvironment")
