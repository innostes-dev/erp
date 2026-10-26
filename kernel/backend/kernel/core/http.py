"""HTTP glue shared by the API server and tests."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from kernel.core.services.errors import ServiceError


def error_body(exc: ServiceError) -> dict[str, str]:
    """JSON body for an error: `detail`, plus `code` when the error has one."""
    body = {"detail": exc.message}
    if exc.code:
        body["code"] = exc.code
    return body


async def service_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Turn a `ServiceError` into `{"detail": message}` with the error's own status and headers.

    If the error has a `code`, it is added as `{"detail": ..., "code": ...}`.

    Args:
        request: The current request (unused).
        exc: The raised `ServiceError`.

    Returns:
        A JSON error response.
    """
    assert isinstance(exc, ServiceError)
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(exc),
        headers=exc.headers or None,
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register the handler that maps every `ServiceError` to its HTTP status.

    The API server calls this once. Tests that build their own `FastAPI()`
    app call it too.

    Args:
        app: The FastAPI application.
    """
    app.add_exception_handler(ServiceError, service_error_handler)
