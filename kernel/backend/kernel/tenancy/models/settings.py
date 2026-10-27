"""Tenant modular settings table using scoped namespace pattern."""

import uuid

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class TenantSetting(BaseModel):
    """Universal modular configuration block for a tenant by namespace (table `tenant_settings`)."""

    __tablename__ = "tenant_settings"
    __table_args__ = (
        UniqueConstraint("tenant_id", "namespace", name="uq_tenant_settings_tenant_namespace"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    namespace: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    tenant = relationship("Tenant", back_populates="settings")
