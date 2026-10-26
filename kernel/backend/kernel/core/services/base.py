"""Generic CRUD service with audit columns and soft delete handled for you.

Every feature service subclasses `BaseService`, sets `model`, and adds its
own business rules. The base class takes care of:

* filling `created_by` / `updated_by` / `deleted_by` from the acting user,
* hiding soft-deleted rows unless `include_deleted=True`,
* partial updates (only fields the client sent are changed).

Example:
    ```python
    class TenantService(BaseService[Tenant]):
        model = Tenant

    service = TenantService(session)
    tenant = await service.create(TenantCreate(name="Acme"), actor_id=user_id)
    ```

Transactions: methods only `flush()`; committing is done by the caller
(normally the `get_db` dependency commits at the end of the request).
"""

from collections.abc import Sequence
from typing import Any, ClassVar, Generic, TypeVar
import uuid

from pydantic import BaseModel as PydanticModel
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database.base import BaseModel

ModelT = TypeVar("ModelT", bound=BaseModel)


class BaseService(Generic[ModelT]):
    """Create / read / update / soft-delete operations for one model.

    Attributes:
        model: The SQLAlchemy model class this service manages. Subclasses
            must set it.
        session: The database session used for every operation.
    """

    model: ClassVar[type[BaseModel]]

    def __init__(self, session: AsyncSession) -> None:
        """Create a service bound to a database session.

        Args:
            session: Async SQLAlchemy session (usually from `get_db`).
        """
        self.session = session

    # ---- queries -------------------------------------------------------

    def base_query(self, include_deleted: bool = False) -> Select[Any]:
        """Return the starting SELECT for this model.

        Override in a subclass to add filters that apply to every read
        (for example, limiting rows to the current tenant).

        Args:
            include_deleted: If True, soft-deleted rows are included.

        Returns:
            A SQLAlchemy `Select` for `model`.
        """
        stmt = select(self.model)
        if not include_deleted:
            stmt = stmt.where(self.model.deleted_at.is_(None))
        return stmt

    async def get(self, id: uuid.UUID, include_deleted: bool = False) -> ModelT | None:
        """Fetch one record by id.

        Args:
            id: Record id.
            include_deleted: If True, a soft-deleted record can be returned.

        Returns:
            The record, or None if it does not exist (or is deleted and
            `include_deleted` is False).
        """
        stmt = self.base_query(include_deleted).where(self.model.id == id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list(
        self,
        offset: int = 0,
        limit: int = 50,
        include_deleted: bool = False,
    ) -> tuple[Sequence[ModelT], int]:
        """Fetch one page of records, newest first.

        Args:
            offset: Number of records to skip.
            limit: Maximum number of records to return.
            include_deleted: If True, soft-deleted records are included.

        Returns:
            A tuple of (records on this page, total matching records).
        """
        stmt = self.base_query(include_deleted)
        total = (
            await self.session.execute(select(func.count()).select_from(stmt.subquery()))
        ).scalar_one()
        rows = await self.session.execute(
            stmt.order_by(self.model.created_at.desc()).offset(offset).limit(limit)
        )
        return rows.scalars().all(), total

    # ---- writes --------------------------------------------------------

    async def create(
        self,
        data: PydanticModel | dict[str, Any],
        actor_id: uuid.UUID | None = None,
    ) -> ModelT:
        """Insert a new record.

        Args:
            data: Field values (a Pydantic schema or a plain dict). Must not
                contain the common columns; those are set here.
            actor_id: User performing the action; stored in `created_by`
                and `updated_by`. None for system actions.

        Returns:
            The new record, refreshed so database defaults (timestamps) are loaded.
        """
        values = self._to_dict(data)
        obj = self.model(**values, created_by=actor_id, updated_by=actor_id)
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj  # type: ignore[return-value]

    async def update(
        self,
        obj: ModelT,
        data: PydanticModel | dict[str, Any],
        actor_id: uuid.UUID | None = None,
    ) -> ModelT:
        """Partially update a record: only fields that were sent are changed.

        With a Pydantic schema, fields the client did not send are left
        untouched (`exclude_unset`). With a dict, every key is applied.

        Args:
            obj: The record to change.
            data: New values.
            actor_id: User performing the action; stored in `updated_by`.

        Returns:
            The updated record.
        """
        for key, value in self._to_dict(data, exclude_unset=True).items():
            setattr(obj, key, value)
        obj.updated_by = actor_id
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def soft_delete(self, obj: ModelT, actor_id: uuid.UUID | None = None) -> ModelT:
        """Mark a record as deleted without removing it from the database.

        Args:
            obj: The record to delete.
            actor_id: User performing the action; stored in `deleted_by`
                and `updated_by`.

        Returns:
            The record, now with `deleted_at` set.
        """
        obj.mark_deleted(actor_id)
        obj.updated_by = actor_id
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def restore(self, obj: ModelT, actor_id: uuid.UUID | None = None) -> ModelT:
        """Undo a soft delete.

        Args:
            obj: The deleted record to bring back.
            actor_id: User performing the action; stored in `updated_by`.

        Returns:
            The record, now active again.
        """
        obj.restore()
        obj.updated_by = actor_id
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    # ---- helpers -------------------------------------------------------

    @staticmethod
    def _to_dict(data: PydanticModel | dict[str, Any], exclude_unset: bool = False) -> dict[str, Any]:
        """Turn a schema or dict into a plain dict of field values."""
        if isinstance(data, PydanticModel):
            return data.model_dump(exclude_unset=exclude_unset)
        return dict(data)
