"""create universal tracura tables

Revision ID: 0006_create_tracura_tables
Revises: 0005_create_api_keys_table
Create Date: 2026-10-31
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0006_create_tracura_tables"
down_revision: Union[str, None] = "0005_create_api_keys_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. api_log_projects
    op.create_table(
        "api_log_projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(63), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true"), index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.UniqueConstraint("tenant_id", "slug", name="uq_api_log_projects_tenant_slug"),
    )

    # 2. api_log_environments
    op.create_table(
        "api_log_environments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("api_log_projects.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("slug", sa.String(32), nullable=False),
        sa.Column("color_badge", sa.String(16), nullable=False, server_default="blue"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true"), index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.UniqueConstraint("project_id", "slug", name="uq_api_log_environments_project_slug"),
    )

    # 3. api_log_api_keys
    op.create_table(
        "api_log_api_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("key_prefix", sa.String(16), nullable=False, index=True),
        sa.Column("key_hash", sa.String(128), nullable=False, unique=True, index=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active", index=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("api_log_projects.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("allowed_environments", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='["*"]'),
        sa.Column("ip_allowlist", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("allowed_origins", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("rate_limit_rpm", sa.Integer(), nullable=False, server_default="1200"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # 4. api_log_settings
    op.create_table(
        "api_log_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("api_log_projects.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("environment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("api_log_environments.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("retention_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("max_body_size_bytes", sa.Integer(), nullable=False, server_default="4096"),
        sa.Column("sampling_rate", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("capture_headers", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("capture_body", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("log_errors_only", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("excluded_paths", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='["/health", "/metrics", "/favicon.ico"]'),
        sa.Column("sensitive_headers", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='["authorization", "cookie", "x-api-key", "proxy-authorization", "set-cookie"]'),
        sa.Column("sensitive_body_fields", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='["password", "secret", "credit_card", "token", "cvv", "ssn", "access_token", "refresh_token"]'),
        sa.Column("mask_client_ip", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.UniqueConstraint("tenant_id", "project_id", "environment_id", name="uq_api_log_settings_scope"),
    )

    # 5. api_logs (Universal Append-Only Telemetry Table)
    op.create_table(
        "api_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("environment_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("api_key_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("correlation_id", sa.String(64), nullable=False, index=True),
        sa.Column("user_id", sa.String(64), nullable=True, index=True),
        sa.Column("client_ip", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(512), nullable=True),
        sa.Column("http_method", sa.String(10), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("path", sa.String(2048), nullable=False),
        sa.Column("status_code", sa.SmallInteger(), nullable=False, index=True),
        sa.Column("duration_ms", sa.Float(), nullable=False, index=True),
        sa.Column("request_headers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("query_params", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("request_body", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("response_headers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("response_body", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
    )

    op.create_index(
        "ix_api_logs_composite_filter",
        "api_logs",
        ["tenant_id", "project_id", "environment_id", "created_at"],
    )
    op.create_index(
        "ix_api_logs_status_time",
        "api_logs",
        ["tenant_id", "status_code", "created_at"],
    )
    op.create_index(
        "ix_api_logs_duration_time",
        "api_logs",
        ["tenant_id", "duration_ms"],
    )


def downgrade() -> None:
    op.drop_table("api_logs")
    op.drop_table("api_log_settings")
    op.drop_table("api_log_api_keys")
    op.drop_table("api_log_environments")
    op.drop_table("api_log_projects")
