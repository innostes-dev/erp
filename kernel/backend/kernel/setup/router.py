"""First-run setup HTTP endpoints, mounted at `/setup`.

| Endpoint            | Auth            | Before install         | After install |
|---------------------|-----------------|------------------------|---------------|
| GET  /setup/status  | none            | `{"installed": false}` | `{"installed": true}` |
| GET  /setup/checks  | X-Setup-Token   | DB + migration checks  | 404 |
| POST /setup         | X-Setup-Token   | installs               | 404 |

`SETUP_ENABLED=false` makes `/setup/checks` and `POST /setup` always 404
(command-line setup only).

Each endpoint's docstring text before `\\f` is shown in the API docs; the
part after `\\f` is for developers only.
"""

import uuid

from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.config import get_settings
from kernel.core.database import get_db
from kernel.core.schemas import error_responses
from kernel.core.security import get_actor_id
from kernel.core.services import TooManyRequestsError
from kernel.core.services.errors import UnprocessableContentError
from kernel.setup.dependencies import is_installed_cached, require_setup_available, require_setup_token
from kernel.setup.schemas import SetupChecks, SetupRequest, SetupResult, SetupStatus
from kernel.setup.services import (
    AlreadyInstalledError,
    DatabaseUnavailableError,
    InvalidSetupTokenError,
    SetupNotAvailableError,
    SetupService,
    discard_setup_token,
    install_state,
)

TAG = "Setup"

router = APIRouter(prefix="/setup", tags=[TAG])

_GUARDED = [Depends(require_setup_available), Depends(require_setup_token)]
"""Run in this order: 404 once installed/disabled, then the token check."""


def get_service(session: AsyncSession = Depends(get_db)) -> SetupService:
    """FastAPI dependency that builds a `SetupService` for the request.

    Override it in tests with `app.dependency_overrides[get_service]`.

    Args:
        session: Request-scoped database session.

    Returns:
        A service bound to that session.
    """
    return SetupService(session, app_version=get_settings().app_version)


@router.get(
    "/status",
    response_model=SetupStatus,
    summary="Get setup status",
    response_description="Whether the system is installed.",
    operation_id="setup_get_status",
    openapi_extra={"security": []},
    responses=error_responses(DatabaseUnavailableError),
)
async def get_setup_status(
    installed: bool = Depends(is_installed_cached),
) -> SetupStatus:
    """Tell the UI whether to show the setup wizard. Reveals nothing else.

    Returns **503** if the database can't be reached: the setup state is
    unknown then, so the UI must not show the wizard.
    \f
    Returns:
        The installed flag (cached per process once true).

    Raises:
        DatabaseUnavailableError: The database is unreachable (503).
    """
    return SetupStatus(installed=installed)


@router.get(
    "/checks",
    response_model=SetupChecks,
    summary="Run pre-install checks",
    response_description="Database connectivity and pending migrations.",
    operation_id="setup_run_checks",
    openapi_extra={"security": [{"SetupToken": []}]},
    dependencies=_GUARDED,
    responses=error_responses(
        SetupNotAvailableError, InvalidSetupTokenError, TooManyRequestsError, DatabaseUnavailableError
    ),
)
async def get_setup_checks(
    service: SetupService = Depends(get_service),
    x_setup_token: str | None = Header(
        default=None,
        alias="X-Setup-Token",
        description="One-time system installation token printed in server log or set via SETUP_TOKEN.",
        examples=["inno_setup_secret_token_123"],
    ),
) -> SetupChecks:
    """Check the database before installing. Requires the `X-Setup-Token` header.

    The wizard also uses it to verify the token. Returns **404** once setup is
    complete or when web setup is disabled.
    \f
    Args:
        service: Injected setup service.
        x_setup_token: Setup token header parameter.

    Returns:
        Database connectivity and the number of pending migrations.

    Raises:
        SetupNotAvailableError: Installed or disabled (404).
        InvalidSetupTokenError: Missing or wrong token (401).
        TooManyRequestsError: Too many wrong tokens (429).
        DatabaseUnavailableError: The database is unreachable (503).
    """
    return await service.checks()


@router.post(
    "",
    response_model=SetupResult,
    status_code=status.HTTP_201_CREATED,
    summary="Run first-run setup",
    response_description="What setup created.",
    operation_id="setup_execute_install",
    openapi_extra={"security": [{"SetupToken": []}]},
    dependencies=_GUARDED,
    responses=error_responses(
        SetupNotAvailableError,
        InvalidSetupTokenError,
        AlreadyInstalledError,
        TooManyRequestsError,
        DatabaseUnavailableError,
    ),
)
async def run_setup(
    body: SetupRequest,
    service: SetupService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
    x_setup_token: str | None = Header(
        default=None,
        alias="X-Setup-Token",
        description="One-time system installation token printed in server log or set via SETUP_TOKEN.",
        examples=["inno_setup_secret_token_123"],
    ),
) -> SetupResult:
    """Install the system: create the database tables and the first organisation.

    Requires the `X-Setup-Token` header. Works **only once**: afterwards this
    route returns **404**, as if it never existed.
    \f
    Setup commits its own transaction (instead of leaving it to `get_db`) so
    the lock is only applied once the install is really saved.

    Args:
        body: Values collected by the setup wizard.
        service: Injected setup service.
        actor_id: Id of the calling user, if a token was sent.
        x_setup_token: Setup token header parameter.

    Returns:
        The created organisation and install time.

    Raises:
        SetupNotAvailableError: Installed or disabled (404).
        InvalidSetupTokenError: Missing or wrong token (401).
        TooManyRequestsError: Too many wrong tokens (429).
        AlreadyInstalledError: Another request installed at the same moment (409).
        SlugTakenError: The organisation slug is taken (409).
        DatabaseUnavailableError: The database is unreachable (503).
    """
    result = await service.install(body, actor_id)
    await service.session.commit()
    install_state.mark_installed()
    discard_setup_token()
    return result
