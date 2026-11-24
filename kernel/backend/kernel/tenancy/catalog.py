"""What modules and plugins exist, for the /tenants/current/modules and /plugins listings.

A module or plugin is listed if it is installed (Python entry point) or known here.
"""

from importlib.metadata import entry_points
from typing import Any

from kernel.tenancy.schemas import ItemCatalogRead

KERNEL_FEATURES = {"setup", "tenancy", "user", "auth"}  # registered as modules, but not switchable

MODULES: dict[str, dict[str, Any]] = {
    "peopleops": {
        "name": "PeopleOps",
        "description": "People operations, attendance, leave, and payroll",
        "tags": ["Employees", "Attendance", "Leave", "Payroll"],
        "tone": "chart-3",
    },
    "salesflow": {
        "name": "SalesFlow",
        "description": "Sales pipeline, customer leads, deals, and quotes",
        "tags": ["Leads", "Deals", "Pipeline", "Quotes"],
        "tone": "chart-2",
    },
    "hireflow": {
        "name": "HireFlow",
        "description": "Frictionless hiring pipeline, candidate tracking, and interview scheduling",
        "tags": ["Recruiting", "Jobs", "Candidates", "Interviews"],
        "tone": "chart-4",
    },
    "ledgerflow": {
        "name": "LedgerFlow",
        "description": "General ledger, double-entry vouchers, AP/AR, cash flow, and tax compliance",
        "tags": ["Ledger", "AP", "AR", "Tax", "Banking"],
        "tone": "chart-1",
    },
    "stockflow": {
        "name": "StockFlow",
        "description": "Multi-warehouse stock flow, item bins, procurement POs, and reorder alerts",
        "tags": ["Stock", "Procurement", "Warehouse", "Valuation"],
        "tone": "chart-5",
    },
    "sprintflow": {
        "name": "SprintFlow",
        "description": "Agile sprint execution, burndown velocity, epics, and issue tracking",
        "tags": ["Agile", "Scrum", "Kanban", "Sprints", "Bugs"],
        "tone": "chart-2",
    },
    "docflow": {
        "name": "DocFlow",
        "description": "Living team documentation, company SOPs, blueprints, and architecture wiki",
        "tags": ["Knowledge", "Wiki", "SOPs", "PRDs", "Handbook"],
        "tone": "chart-3",
    },
}

_TRACURA = {
    "name": "Tracura",
    "description": "Enterprise API observability, universal telemetry ingestion, and analytics",
    "tags": ["Logs", "Telemetry", "Analytics"],
    "tone": "chart-5",
}
PLUGINS: dict[str, dict[str, Any]] = {"tracura": _TRACURA, "api-logger": _TRACURA}  # api-logger: Tracura's old id


def module_catalog(active: dict[str, Any]) -> list[ItemCatalogRead]:
    """Every known module, marked active if it is in `active` (module id -> TenantModule)."""
    ids = (_installed("innostes.modules") - KERNEL_FEATURES) | MODULES.keys()
    return [
        _item("module", mid, MODULES.get(mid) or _unknown_module(mid), active.get(mid))
        for mid in sorted(ids)
    ]


def plugin_catalog(active: dict[str, Any]) -> list[ItemCatalogRead]:
    """Every known plugin, marked active if it is in `active` (plugin id -> TenantPlugin)."""
    ids = _installed("innostes.plugins") | PLUGINS.keys()
    return [
        _item("plugin", pid, PLUGINS.get(pid) or _unknown_plugin(pid), active.get(pid))
        for pid in sorted(ids)
    ]


def _installed(group: str) -> set[str]:
    try:
        return {ep.name for ep in entry_points(group=group)}
    except Exception:
        return set()


def _unknown_module(mid: str) -> dict[str, Any]:
    return {"name": mid.upper(), "description": f"{mid.capitalize()} business application", "tags": ["Module"], "tone": "primary"}


def _unknown_plugin(pid: str) -> dict[str, Any]:
    return {"name": pid.replace("-", " ").title(), "description": f"{pid} extensible plugin", "tags": ["Plugin"], "tone": "primary"}


def _item(kind: str, item_id: str, meta: dict[str, Any], record: Any) -> ItemCatalogRead:
    return ItemCatalogRead(
        id=item_id,
        name=meta["name"],
        version="0.1.0",
        type=kind,
        description=meta["description"],
        tags=meta["tags"],
        tone=meta["tone"],
        is_active=record is not None,
        activated_at=record.activated_at if record else None,
    )
