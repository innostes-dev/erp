"""tenant profile columns and installation table

Adds the organisation fields collected by the setup wizard to `tenants`
and creates the single-row `installation` table that marks first-run
setup as done.

Revision ID: 0002_setup_and_tenant_profile
Revises: 0001_create_tenants
Create Date: 2026-10-26
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_setup_and_tenant_profile"
down_revision: Union[str, None] = "0001_create_tenants"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tenant profile. `slug` is required: add it nullable, give existing rows
    # a unique value (their id), then make it NOT NULL.
    op.add_column("tenants", sa.Column("slug", sa.String(length=63), nullable=True))
    op.execute("UPDATE tenants SET slug = id::text WHERE slug IS NULL")
    op.alter_column("tenants", "slug", nullable=False)
    op.create_unique_constraint(op.f("uq_tenants_slug"), "tenants", ["slug"])
    op.add_column("tenants", sa.Column("country", sa.String(length=2), nullable=True))
    op.add_column("tenants", sa.Column("timezone", sa.String(length=64), nullable=True))
    op.add_column("tenants", sa.Column("language", sa.String(length=16), nullable=True))
    op.add_column("tenants", sa.Column("date_format", sa.String(length=20), nullable=True))

    op.create_table(
        "installation",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("singleton", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("app_version", sa.String(length=50), nullable=False),
        sa.Column("default_tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.CheckConstraint("singleton", name=op.f("ck_installation_singleton_true")),
        sa.ForeignKeyConstraint(
            ["default_tenant_id"],
            ["tenants.id"],
            name=op.f("fk_installation_default_tenant_id_tenants"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_installation")),
        sa.UniqueConstraint("singleton", name=op.f("uq_installation_singleton")),
    )
    op.create_index(op.f("ix_installation_deleted_at"), "installation", ["deleted_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_installation_deleted_at"), table_name="installation")
    op.drop_table("installation")
    op.drop_column("tenants", "date_format")
    op.drop_column("tenants", "language")
    op.drop_column("tenants", "timezone")
    op.drop_column("tenants", "country")
    op.drop_constraint(op.f("uq_tenants_slug"), "tenants", type_="unique")
    op.drop_column("tenants", "slug")
