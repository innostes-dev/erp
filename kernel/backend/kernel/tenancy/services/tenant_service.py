"""Tenant business logic."""

from typing import Any
import uuid

from pydantic import BaseModel as PydanticModel
from sqlalchemy import select

from kernel.core.services import BaseService, ConflictError, ErrorCode, NotFoundError
from kernel.tenancy.models import Tenant


class TenantNotFoundError(NotFoundError):
    """No active tenant has the requested id."""

    code = ErrorCode.TENANT_NOT_FOUND

    def __init__(self) -> None:
        """Create the error with a fixed, client-safe message."""
        super().__init__("Tenant not found")


class SlugTakenError(ConflictError):
    """Another tenant (active or deleted) already uses this slug."""

    code = ErrorCode.SLUG_TAKEN

    def __init__(self, slug: str) -> None:
        """Create the error.

        Args:
            slug: The slug that is already in use.
        """
        super().__init__(f"Slug '{slug}' is already in use")
        self.slug = slug


class TenantService(BaseService[Tenant]):
    """Operations on tenants.

    Create / get / list / update / soft delete / restore are inherited from
    `BaseService`; this class adds slug uniqueness. Slugs stay reserved
    after a soft delete so a restored tenant never clashes.
    """

    model = Tenant

    async def get_by_slug(self, slug: str) -> Tenant | None:
        """Find a tenant by slug, including soft-deleted ones.

        Args:
            slug: Tenant slug.

        Returns:
            The tenant, or None.
        """
        stmt = select(Tenant).where(Tenant.slug == slug)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create(self, data: PydanticModel | dict[str, Any], actor_id: uuid.UUID | None = None) -> Tenant:
        """Create a tenant after checking that its slug is free.

        Args:
            data: Tenant fields.
            actor_id: User performing the action.

        Returns:
            The new tenant.

        Raises:
            SlugTakenError: The slug is already used.
        """
        slug = self._to_dict(data).get("slug")
        if slug and await self.get_by_slug(slug) is not None:
            raise SlugTakenError(slug)
        return await super().create(data, actor_id)

    async def update(self, obj: Tenant, data: PydanticModel | dict[str, Any], actor_id: uuid.UUID | None = None) -> Tenant:
        """Update a tenant; a new slug must be free.

        Args:
            obj: Tenant to change.
            data: Fields to change.
            actor_id: User performing the action.

        Returns:
            The updated tenant.

        Raises:
            SlugTakenError: The new slug is already used by another tenant.
        """
        slug = self._to_dict(data, exclude_unset=True).get("slug")
        if slug and slug != obj.slug:
            existing = await self.get_by_slug(slug)
            if existing is not None and existing.id != obj.id:
                raise SlugTakenError(slug)
        return await super().update(obj, data, actor_id)
