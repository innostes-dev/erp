"""API Logger Environment Model."""

import uuid
from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class ApiLogEnvironment(BaseModel):
    """Deployment environment (e.g. production, staging, development) under a project."""

    __tablename__ = "api_log_environments"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_log_projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    slug: Mapped[str] = mapped_column(String(32), nullable=False)
    color_badge: Mapped[str] = mapped_column(String(16), default="blue", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("project_id", "slug", name="uq_api_log_environments_project_slug"),
    )

    project = relationship("ApiLogProject", back_populates="environments")

    def __init__(self, **kwargs: object) -> None:
        kwargs.setdefault("is_active", True)
        kwargs.setdefault("color_badge", "blue")
        super().__init__(**kwargs)
