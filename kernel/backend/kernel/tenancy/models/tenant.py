"""Tenant table."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from kernel.core.database import BaseModel


class Tenant(BaseModel):
    """A customer organisation using the ERP (table `tenants`).

    The common columns (id, created_*, updated_*, deleted_*) come from
    `BaseModel`; only tenant-specific columns are declared here.

    Attributes:
        name: Display name of the organisation (max 255 chars).
        slug: Short unique identifier used in URLs and system ids
            (lowercase letters, digits and dashes).
        country: ISO 3166-1 alpha-2 country code, e.g. "IN".
        timezone: IANA time zone, e.g. "Asia/Kolkata".
        language: BCP 47 language tag, e.g. "en-IN".
        date_format: Preferred date format, e.g. "DD/MM/YYYY".
    """

    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(63), nullable=False, unique=True)
    country: Mapped[str | None] = mapped_column(String(2), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    date_format: Mapped[str | None] = mapped_column(String(20), nullable=True)
