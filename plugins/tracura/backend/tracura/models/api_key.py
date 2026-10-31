"""API Logger Ingestion API Key Model (Google Developer style scoping)."""

from datetime import datetime
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class ApiLogApiKey(BaseModel):
    """Google Developer-style scoped API key for pushing logs into the ingestion engine."""

    __tablename__ = "api_log_api_keys"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    key_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False, index=True)

    # Target Scope Restrictions (Google Model)
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_log_projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    allowed_environments: Mapped[list[str]] = mapped_column(
        JSONB,
        default=lambda: ["*"],
        nullable=False,
    )

    # Network & Perimeter Restrictions
    ip_allowlist: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    allowed_origins: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)

    # Rate Limiting & Lifecycle
    rate_limit_rpm: Mapped[int] = mapped_column(Integer, default=1200, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project = relationship("ApiLogProject")
