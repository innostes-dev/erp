"""Installation table: records that first-run setup has been completed."""

import uuid

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, String, true
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from kernel.core.database import BaseModel


class Installation(BaseModel):
    """The single row that marks this ERP instance as installed (table `installation`).

    Setup is complete when this row exists. The database allows only one row:
    `singleton` is always true and unique, so a second (or concurrent) setup
    fails with an integrity error.

    Attributes:
        singleton: Always true; makes the table hold at most one row.
        app_version: API version that ran the setup.
        default_tenant_id: The first organisation created during setup.
    """

    __tablename__ = "installation"
    __table_args__ = (CheckConstraint("singleton", name="singleton_true"),)

    singleton: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=true(), unique=True
    )
    app_version: Mapped[str] = mapped_column(String(50), nullable=False)
    default_tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )
