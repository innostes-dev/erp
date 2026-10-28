"""Tenant extensible plugin activation tracking."""

from datetime import datetime
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class TenantPlugin(BaseModel):
    """Tracks active system and integration plugins for a tenant (table `tenant_plugins`)."""

    __tablename__ = "tenant_plugins"
    __table_args__ = (
        UniqueConstraint("tenant_id", "plugin_id", name="uq_tenant_plugins_tenant_plugin"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plugin_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    activated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    config: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    tenant = relationship("Tenant", backref="active_plugins")
