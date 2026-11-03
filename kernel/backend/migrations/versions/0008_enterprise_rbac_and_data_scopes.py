"""enterprise rbac and data scopes

Revision ID: 0008_enterprise_rbac_and_data_scopes
Revises: 0007_create_audit_logs_table
Create Date: 2026-11-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0008_enterprise_rbac_and_data_scopes"
down_revision: Union[str, None] = "0007_create_audit_logs_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update permissions
    op.add_column("permissions", sa.Column("resource", sa.String(50), nullable=True))
    op.add_column("permissions", sa.Column("action", sa.String(50), nullable=True))
    op.add_column("permissions", sa.Column("default_scope", sa.String(20), server_default="OWN", nullable=False))
    op.create_index(op.f("ix_permissions_resource"), "permissions", ["resource"], unique=False)
    op.create_index(op.f("ix_permissions_action"), "permissions", ["action"], unique=False)

    # 2. Update roles
    op.add_column("roles", sa.Column("module_code", sa.String(50), nullable=True))
    op.add_column("roles", sa.Column("can_delegate", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.add_column("roles", sa.Column("max_delegatable_level", sa.Integer(), server_default=sa.text("0"), nullable=False))
    op.create_index(op.f("ix_roles_module_code"), "roles", ["module_code"], unique=False)

    # 3. Update role_permissions
    op.add_column("role_permissions", sa.Column("scope", sa.String(20), server_default="OWN", nullable=False))
    op.add_column("role_permissions", sa.Column("conditions", postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # 4. Update user_roles
    op.add_column("user_roles", sa.Column("department_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("user_roles", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_user_roles_department_id"), "user_roles", ["department_id"], unique=False)

    # 5. Create user_module_grants table
    op.create_table(
        "user_module_grants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("module_code", sa.String(50), nullable=False, index=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False, index=True),
        sa.Column(
            "granted_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "granted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True, index=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.UniqueConstraint("tenant_id", "user_id", "module_code", name="uq_user_module_grants_tenant_user_module"),
    )


def downgrade() -> None:
    op.drop_table("user_module_grants")
    op.drop_index(op.f("ix_user_roles_department_id"), table_name="user_roles")
    op.drop_column("user_roles", "expires_at")
    op.drop_column("user_roles", "department_id")
    op.drop_column("role_permissions", "conditions")
    op.drop_column("role_permissions", "scope")
    op.drop_index(op.f("ix_roles_module_code"), table_name="roles")
    op.drop_column("roles", "max_delegatable_level")
    op.drop_column("roles", "can_delegate")
    op.drop_column("roles", "module_code")
    op.drop_index(op.f("ix_permissions_action"), table_name="permissions")
    op.drop_index(op.f("ix_permissions_resource"), table_name="permissions")
    op.drop_column("permissions", "default_scope")
    op.drop_column("permissions", "action")
    op.drop_column("permissions", "resource")
