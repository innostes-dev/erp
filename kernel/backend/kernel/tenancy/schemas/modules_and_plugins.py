"""Schemas for Business Modules and Extensible Plugins management."""

from datetime import datetime
from typing import Any
import uuid

from pydantic import Field

from kernel.core.schemas import BaseSchema


class ItemCatalogRead(BaseSchema):
    """Metadata describing an installed module or plugin in the catalog."""

    id: str = Field(description="Unique identifier (e.g. 'hrms', 'crm', 'api-logger')")
    name: str = Field(description="Human-readable title")
    version: str = Field(description="Semver version string")
    type: str = Field(description="'module' or 'plugin'")
    description: str = Field(description="Short description")
    tags: list[str] = Field(default_factory=list, description="Categorical tags")
    tone: str = Field(default="primary", description="Design system color tone")
    is_active: bool = Field(default=False, description="Whether currently activated for the tenant")
    activated_at: datetime | None = Field(default=None, description="Activation timestamp")


class ModuleListResponse(BaseSchema):
    """Catalog of business modules with current tenant activation status."""

    installed: list[ItemCatalogRead] = Field(description="List of all installed modules")
    active_ids: list[str] = Field(description="List of activated module IDs")


class PluginListResponse(BaseSchema):
    """Catalog of extensible plugins with current tenant activation status."""

    installed: list[ItemCatalogRead] = Field(description="List of all installed plugins")
    active_ids: list[str] = Field(description="List of activated plugin IDs")


class ActivationResponse(BaseSchema):
    """Response returned upon activation or deactivation."""

    item_id: str
    is_active: bool
    message: str
