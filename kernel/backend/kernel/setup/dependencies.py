"""FastAPI dependencies that guard the setup routes.

Order matters. `require_setup_available` runs first, so once the system is
installed (or web setup is disabled) the routes answer 404 without ever
looking at a token.
"""

import asyncio

from fastapi import Depends, Request
from fastapi.security import APIKeyHeader

from kernel.core.config import get_settings
from kernel.core.services import TooManyRequestsError
from kernel.setup.services import (
    DatabaseUnavailableError,
    InvalidSetupTokenError,
    SetupNotAvailableError,
    attempt_limiter,
    install_state,
    installation_exists,
    verify_setup_token,
)

SETUP_TOKEN_HEADER = "X-Setup-Token"

_token_header = APIKeyHeader(
    name=SETUP_TOKEN_HEADER,
    scheme_name="SetupToken",
    description="One-time setup token: printed in the API server log on first start, or SETUP_TOKEN in .env.",
    auto_error=False,
)


async def is_installed_cached(timeout: float = 3.0) -> bool:
    """Installed flag via the process cache, with a timeout on the database check.

    Args:
        timeout: Seconds to wait for the database.

    Returns:
        True if setup has been completed.

    Raises:
        DatabaseUnavailableError: The database could not be checked.
    """
    try:
        return await install_state.is_installed(lambda: asyncio.wait_for(installation_exists(), timeout))
    except Exception as exc:
        raise DatabaseUnavailableError() from exc


async def require_setup_available() -> None:
    """Allow the route only while web setup is enabled and not yet done.

    Raises:
        SetupNotAvailableError: 404 when installed or `SETUP_ENABLED=false`.
        DatabaseUnavailableError: 503 when the database can't be checked.
    """
    if not get_settings().setup_enabled:
        raise SetupNotAvailableError()
    if await is_installed_cached():
        raise SetupNotAvailableError()


async def require_setup_token(
    request: Request,
    token: str | None = Depends(_token_header),
) -> str:
    """Require a valid `X-Setup-Token` header, with a limit on wrong guesses.

    Args:
        request: The current request (for the client address).
        token: Value of the `X-Setup-Token` header.

    Returns:
        The verified token.

    Raises:
        TooManyRequestsError: 429 after too many wrong tokens from this client.
        InvalidSetupTokenError: 401 when the header is missing or wrong.
    """
    client = request.client.host if request.client else "unknown"
    wait = attempt_limiter.retry_after(client)
    if wait is not None:
        raise TooManyRequestsError("Too many invalid setup tokens. Try again later.", retry_after=wait)
    if not verify_setup_token(token):
        attempt_limiter.record_failure(client)
        raise InvalidSetupTokenError()
    attempt_limiter.reset(client)
    return token  # type: ignore[return-value]
