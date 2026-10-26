"""Shared Pydantic schemas used by every feature's API."""

from kernel.core.schemas.base import AuditReadSchema, BaseSchema, Page
from kernel.core.schemas.errors import ErrorResponse, error_responses

__all__ = ["BaseSchema", "AuditReadSchema", "Page", "ErrorResponse", "error_responses"]
