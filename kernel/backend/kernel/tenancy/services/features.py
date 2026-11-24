"""Switch a tenant's modules and plugins on and off."""

from datetime import datetime, timezone
from importlib.metadata import entry_points
import logging
from typing import Any
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.tenancy.models import TenantModule, TenantPlugin

logger = logging.getLogger(__name__)

Feature = TenantModule | TenantPlugin


async def active_features(session: AsyncSession, model: type[Feature], tenant_id: uuid.UUID) -> dict[str, Feature]:
    """The tenant's active rows of `model`, keyed by module/plugin id."""
    stmt = select(model).where(model.tenant_id == tenant_id, model.is_active.is_(True))
    return {_feature_id(row): row for row in (await session.execute(stmt)).scalars().all()}


async def set_feature_active(
    session: AsyncSession,
    model: type[Feature],
    tenant_id: uuid.UUID,
    feature_id: str,
    active: bool,
    actor_id: uuid.UUID,
) -> None:
    """Turn a module or plugin on or off for a tenant (creates the row the first time it is turned on)."""
    id_column = model.module_id if model is TenantModule else model.plugin_id
    stmt = select(model).where(model.tenant_id == tenant_id, id_column == feature_id)
    row = (await session.execute(stmt)).scalar_one_or_none()

    if not active:
        if row:
            row.is_active, row.activated_at, row.activated_by = False, None, None
        return

    now = datetime.now(timezone.utc)
    if row:
        row.is_active, row.activated_at, row.activated_by = True, now, actor_id
    else:
        session.add(model(tenant_id=tenant_id, is_active=True, activated_at=now, activated_by=actor_id,
                          **{id_column.key: feature_id}))


async def run_plugin_hook(plugin_id: str, hook: str, **kwargs: Any) -> None:
    """Call `hook` (e.g. on_tenant_activate) on an installed plugin, if it defines one.

    A broken plugin must not stop an admin from switching it, so errors are logged, not raised.
    """
    try:
        entry = next((ep for ep in entry_points(group="innostes.plugins") if ep.name == plugin_id), None)
        plugin = entry.load() if entry else None
        if plugin is not None and hasattr(plugin, hook):
            await getattr(plugin, hook)(**kwargs)
    except Exception:
        logger.exception("Plugin %s failed in %s", plugin_id, hook)


def _feature_id(row: Feature) -> str:
    return row.module_id if isinstance(row, TenantModule) else row.plugin_id
