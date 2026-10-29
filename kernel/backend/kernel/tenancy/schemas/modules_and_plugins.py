"""Schemas for Business Modules and Extensible Plugins management."""

from datetime import datetime
from typing import Any
import uuid

from pydantic import ConfigDict, Field

from kernel.core.schemas import BaseSchema


class ItemCatalogRead(BaseSchema):
    """Metadata describing an installed module or plugin package in the catalog."""

    id: str = Field(
        description="Unique package identifier string (e.g. 'hrms', 'crm', 'api-logger').",
        examples=["hrms"],
    )
    name: str = Field(
        description="Human-readable title of the module or plugin.",
        examples=["HRMS"],
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
        examples=["People and human resources management"],
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
                    "id": "hrms",
                    "name": "HRMS",
                    "version": "0.1.0",
                    "type": "module",
                    "description": "People and human resources management",
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
                    "id": "hrms",
                    "name": "HRMS",
                    "version": "0.1.0",
                    "type": "module",
                    "description": "People and human resources management",
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
        examples=[["hrms", "crm"]],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "installed": [
                        {
                            "id": "hrms",
                            "name": "HRMS",
                            "version": "0.1.0",
                            "type": "module",
                            "description": "People and human resources management",
                            "tags": ["Employees", "Leave", "Payroll"],
                            "tone": "chart-3",
                            "is_active": True,
                            "activated_at": "2026-10-29T10:00:00Z",
                        }
                    ],
                    "active_ids": ["hrms"],
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
                    "id": "api-logger",
                    "name": "API Logger",
                    "version": "0.1.0",
                    "type": "plugin",
                    "description": "API request logging, webhook inspection, and debugging",
                    "tags": ["Logs", "Webhooks", "Analytics"],
                    "tone": "chart-5",
                    "is_active": True,
                    "activated_at": "2026-10-29T10:00:00Z",
                }
            ]
        ],
    )
    active_ids: list[str] = Field(
        description="List of plugin IDs currently enabled for the tenant.",
        examples=[["api-logger"]],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "installed": [
                        {
                            "id": "api-logger",
                            "name": "API Logger",
                            "version": "0.1.0",
                            "type": "plugin",
                            "description": "API request logging, webhook inspection, and debugging",
                            "tags": ["Logs", "Webhooks", "Analytics"],
                            "tone": "chart-5",
                            "is_active": True,
                            "activated_at": "2026-10-29T10:00:00Z",
                        }
                    ],
                    "active_ids": ["api-logger"],
                }
            ]
        }
    )


class ActivationResponse(BaseSchema):
    """Response returned upon activation or deactivation."""

    item_id: str = Field(
        description="Identifier of the module or plugin whose status changed.",
        examples=["hrms"],
    )
    is_active: bool = Field(
        description="New activation state of the package.",
        examples=[True],
    )
    message: str = Field(
        description="Human-readable operational status message.",
        examples=["Module 'hrms' activated successfully."],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "item_id": "hrms",
                    "is_active": True,
                    "message": "Module 'hrms' activated successfully.",
                }
            ]
        }
    )
