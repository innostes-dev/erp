"""Schemas for Business Modules and Extensible Plugins management."""

from datetime import datetime
from typing import Any
import uuid

from pydantic import ConfigDict, Field

from kernel.core.schemas import BaseSchema


class ItemCatalogRead(BaseSchema):
    """Metadata describing an installed module or plugin package in the catalog."""

    id: str = Field(
        description="Unique package identifier string (e.g. 'peopleops', 'revops', 'tracura').",
        examples=["peopleops"],
    )
    name: str = Field(
        description="Human-readable title of the module or plugin.",
        examples=["PeopleOps"],
    )
    version: str = Field(
        description="Semver version string of the package.",
        examples=["0.1.0"],
    )
    type: str = Field(
        description="Package classification: 'module' for business modules or 'plugin' for extensible plugins.",
        examples=["module"],
    )
    description: str = Field(
        description="Brief functional overview of package capabilities.",
        examples=["People and human resources operations"],
    )
    tags: list[str] = Field(
        default_factory=list,
        description="Categorical feature tags for filtering in the catalog.",
        examples=[["Employees", "Leave", "Payroll"]],
    )
    tone: str = Field(
        default="primary",
        description="Design system accent color tone for badge presentation.",
        examples=["chart-3"],
    )
    is_active: bool = Field(
        default=False,
        description="Whether this package is currently activated for the tenant organisation.",
        examples=[True],
    )
    activated_at: datetime | None = Field(
        default=None,
        description="Timestamp in ISO 8601 UTC when the package was activated. Null if inactive.",
        examples=["2026-10-29T10:00:00Z"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "peopleops",
                    "name": "PeopleOps",
                    "version": "0.1.0",
                    "type": "module",
                    "description": "People and human resources operations",
                    "tags": ["Employees", "Leave", "Payroll"],
                    "tone": "chart-3",
                    "is_active": True,
                    "activated_at": "2026-10-29T10:00:00Z",
                }
            ]
        }
    )


class ModuleListResponse(BaseSchema):
    """Catalog of business modules with current tenant activation status."""

    installed: list[ItemCatalogRead] = Field(
        description="List of all installed and discoverable business modules.",
        examples=[
            [
                {
                    "id": "peopleops",
                    "name": "PeopleOps",
                    "version": "0.1.0",
                    "type": "module",
                    "description": "People and human resources operations",
                    "tags": ["Employees", "Leave", "Payroll"],
                    "tone": "chart-3",
                    "is_active": True,
                    "activated_at": "2026-10-29T10:00:00Z",
                }
            ]
        ],
    )
    active_ids: list[str] = Field(
        description="List of module IDs currently enabled for the tenant.",
        examples=[["peopleops", "revops"]],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "installed": [
                        {
                            "id": "peopleops",
                            "name": "PeopleOps",
                            "version": "0.1.0",
                            "type": "module",
                            "description": "People and human resources operations",
                            "tags": ["Employees", "Leave", "Payroll"],
                            "tone": "chart-3",
                            "is_active": True,
                            "activated_at": "2026-10-29T10:00:00Z",
                        }
                    ],
                    "active_ids": ["peopleops"],
                }
            ]
        }
    )


class PluginListResponse(BaseSchema):
    """Catalog of extensible plugins with current tenant activation status."""

    installed: list[ItemCatalogRead] = Field(
        description="List of all installed and discoverable extensible plugins.",
        examples=[
            [
                {
                    "id": "tracura",
                    "name": "Tracura",
                    "version": "0.1.0",
                    "type": "plugin",
                    "description": "Enterprise API observability and telemetry",
                    "tags": ["Logs", "Telemetry", "Analytics"],
                    "tone": "chart-5",
                    "is_active": True,
                    "activated_at": "2026-10-29T10:00:00Z",
                }
            ]
        ],
    )
    active_ids: list[str] = Field(
        description="List of plugin IDs currently enabled for the tenant.",
        examples=[["tracura"]],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "installed": [
                        {
                            "id": "tracura",
                            "name": "Tracura",
                            "version": "0.1.0",
                            "type": "plugin",
                            "description": "Enterprise API observability and telemetry",
                            "tags": ["Logs", "Telemetry", "Analytics"],
                            "tone": "chart-5",
                            "is_active": True,
                            "activated_at": "2026-10-29T10:00:00Z",
                        }
                    ],
                    "active_ids": ["tracura"],
                }
            ]
        }
    )


class ActivationResponse(BaseSchema):
    """Response returned upon activation or deactivation."""

    item_id: str = Field(
        description="Identifier of the module or plugin whose status changed.",
        examples=["peopleops"],
    )
    is_active: bool = Field(
        description="New activation state of the package.",
        examples=[True],
    )
    message: str = Field(
        description="Human-readable operational status message.",
        examples=["Module 'peopleops' activated successfully."],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "item_id": "peopleops",
                    "is_active": True,
                    "message": "Module 'peopleops' activated successfully.",
                }
            ]
        }
    )
