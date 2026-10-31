"""API Logger Project Model."""

import uuid
from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class ApiLogProject(BaseModel):
    """An individual project, application, service or product logging into the system."""

    __tablename__ = "api_log_projects"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(63), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("tenant_id", "slug", name="uq_api_log_projects_tenant_slug"),
    )

    environments = relationship(
        "ApiLogEnvironment",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ApiLogEnvironment.name",
    )
