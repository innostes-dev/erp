"""Tenant membership table associating users with organizations."""

from datetime import datetime
from enum import Enum
import uuid

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class TenantMemberStatus(str, Enum):
    """Membership state within an organization."""

    ACTIVE = "active"
    INVITED = "invited"
    SUSPENDED = "suspended"


class TenantMember(BaseModel):
    """Associates an identity (User) with an Organization (Tenant) (table `tenant_members`)."""

    __tablename__ = "tenant_members"
    __table_args__ = (
        UniqueConstraint("tenant_id", "user_id", name="uq_tenant_members_tenant_user"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[TenantMemberStatus] = mapped_column(
        ENUM(TenantMemberStatus, name="tenant_member_status_enum", create_type=False),
        default=TenantMemberStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    joined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tenant = relationship("Tenant", back_populates="members")
    user = relationship("User")
