"""Tenants: CRUD comes from BaseService; this adds unique slugs."""

from typing import Any
import uuid

from pydantic import BaseModel as PydanticModel
from sqlalchemy import select

from kernel.core.services import BaseService, ConflictError, ErrorCode, NotFoundError
from kernel.tenancy.models import Tenant


class TenantNotFoundError(NotFoundError):
    code = ErrorCode.TENANT_NOT_FOUND

    def __init__(self, message: str = "Tenant not found") -> None:
        super().__init__(message)


class SlugTakenError(ConflictError):
    code = ErrorCode.SLUG_TAKEN

    def __init__(self, slug: str) -> None:
        super().__init__(f"Slug '{slug}' is already in use")
        self.slug = slug


class TenantService(BaseService[Tenant]):
    """Slugs stay reserved after a soft delete, so a restored tenant never clashes."""

    model = Tenant

    async def get_by_slug(self, slug: str) -> Tenant | None:
        """Tenant with this slug, including soft-deleted ones."""
        return (await self.session.execute(select(Tenant).where(Tenant.slug == slug))).scalar_one_or_none()

    async def create(self, data: PydanticModel | dict[str, Any], actor_id: uuid.UUID | None = None) -> Tenant:
        slug = self._to_dict(data).get("slug")
        if slug and await self.get_by_slug(slug) is not None:
            raise SlugTakenError(slug)
        return await super().create(data, actor_id)

    async def update(
        self, obj: Tenant, data: PydanticModel | dict[str, Any], actor_id: uuid.UUID | None = None
    ) -> Tenant:
        slug = self._to_dict(data, exclude_unset=True).get("slug")
        if slug and slug != obj.slug:
            existing = await self.get_by_slug(slug)
            if existing is not None and existing.id != obj.id:
                raise SlugTakenError(slug)
        return await super().update(obj, data, actor_id)
