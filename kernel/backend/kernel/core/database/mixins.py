"""Reusable column groups for tables.

`BaseModel` (in base.py) combines all of them, so most tables only need to
inherit `BaseModel`. Use a single mixin directly for special tables
(e.g. a link table that only needs timestamps).

`sort_order` keeps every table laid out the same way: `id` first, then the
table's own columns, then created_* / updated_* / deleted_*.
"""

from datetime import datetime, timezone
import uuid

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKeyMixin:
    """Adds the `id` primary key (UUID v4, generated in Python).

    Attributes:
        id: Unique record id.
    """

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        sort_order=-100,
    )


class TimestampMixin:
    """Adds creation and last-change timestamps, set by the database (UTC).

    Attributes:
        created_at: When the row was inserted.
        updated_at: When the row was last updated (refreshed on every UPDATE).
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        sort_order=100,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        sort_order=102,
    )


class AuditMixin:
    """Adds who created and who last changed the row.

    Plain UUIDs for now; a foreign key to users can be added once the
    identity feature exists. Nullable so system actions (seeds, jobs) work.

    Attributes:
        created_by: Id of the user who created the row.
        updated_by: Id of the user who last changed the row.
    """

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, sort_order=101
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, sort_order=103
    )


class SoftDeleteMixin:
    """Adds soft delete: rows are marked deleted instead of removed.

    Queries through `BaseService` hide deleted rows by default.

    Attributes:
        deleted_at: When the row was deleted; None while active.
        deleted_by: Id of the user who deleted the row.
    """

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        sort_order=104,
    )
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, sort_order=105
    )

    @property
    def is_deleted(self) -> bool:
        """True if the row has been soft-deleted."""
        return self.deleted_at is not None

    def mark_deleted(self, actor_id: uuid.UUID | None = None) -> None:
        """Mark the row as deleted now (does not flush or commit).

        Args:
            actor_id: User performing the delete; None for system actions.
        """
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by = actor_id

    def restore(self) -> None:
        """Clear the deleted markers so the row is active again."""
        self.deleted_at = None
        self.deleted_by = None
