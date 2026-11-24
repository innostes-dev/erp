"""Tenant table."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class Tenant(BaseModel):
    """A customer organisation using the ERP (table `tenants`).

    The common columns (id, created_*, updated_*, deleted_*) come from
    `BaseModel`; only tenant-specific columns are declared here.
    """

    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(63), nullable=False, unique=True)
    country: Mapped[str | None] = mapped_column(String(2), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    date_format: Mapped[str | None] = mapped_column(String(20), nullable=True)

    members = relationship("TenantMember", back_populates="tenant", cascade="all, delete-orphan")
    settings = relationship("TenantSetting", back_populates="tenant", cascade="all, delete-orphan")
