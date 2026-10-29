"""Error response schema and helpers for documenting error responses."""

from http import HTTPStatus
from typing import Any

from pydantic import Field

from kernel.core.schemas.base import BaseSchema
from kernel.core.services.errors import ServiceError


class ErrorResponse(BaseSchema):
    """Body returned for handled errors, e.g. a not-found or conflict error.

    Attributes:
        detail: Human-readable error message.
        code: Machine-readable error id, only for some errors (e.g. "setup_required").
    """

    detail: str = Field(
        description="Human-readable explanation of the error condition.",
        examples=["Tenant not found."],
    )
    code: str | None = Field(
        default=None,
        description="Machine-readable error identifier for programmatic client branching.",
        examples=["tenant_not_found"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "detail": "Tenant not found.",
                    "code": "tenant_not_found",
                }
            ]
        }
    }


def error_responses(*errors: type[ServiceError] | int) -> dict[int | str, dict[str, Any]]:
    """Build the `responses=` mapping that documents an endpoint's errors.

    Pass the error classes the endpoint can raise; their `status_code` and
    `description` are used, so the status is never written twice. A plain
    status constant (e.g. `status.HTTP_401_UNAUTHORIZED`) also works.

    Args:
        *errors: `ServiceError` subclasses, or `fastapi.status` constants.

    Returns:
        A dict to pass as `responses=` to a FastAPI route decorator.

    Example:
        ```python
        @router.patch("/{id}", responses=error_responses(NotFoundError, SlugTakenError))
        ```
    """
    result: dict[int | str, dict[str, Any]] = {}
    for error in errors:
        if isinstance(error, type) and issubclass(error, ServiceError):
            code, description = int(error.status_code), error.description
        else:
            code = int(error)
            description = HTTPStatus(code).phrase
        result[code] = {"model": ErrorResponse, "description": description}
    return result
