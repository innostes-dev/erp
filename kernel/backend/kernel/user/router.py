"""User and IAM HTTP endpoints."""

import uuid

from fastapi import APIRouter, Depends, Path, Query, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from kernel.core.schemas import error_responses
from kernel.core.services.errors import UnauthorizedError, UnprocessableContentError
from kernel.user.models.user import User
from kernel.user.schemas import UserCreate, UserRead
from kernel.user.services import EmailAlreadyExistsError, UserNotFoundError, UserService

TAG = "User management"
router = APIRouter(prefix="/users", tags=[TAG])

_bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="JWT Bearer access token or personal access token.",
)


async def get_current_user_dep(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db),
) -> User:
    """Lazy-load get_current_user to eliminate circular import."""
    from kernel.auth.dependencies import get_current_user
    return await get_current_user(request=request, credentials=credentials, session=session)


def get_service() -> UserService:
    return UserService()


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user",
    operation_id="users_create_user",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        EmailAlreadyExistsError,
        UnauthorizedError,
        UnprocessableContentError,
    ),
)
async def create_user(
    body: UserCreate,
    current_user: User = Depends(get_current_user_dep),
    session: AsyncSession = Depends(get_db),
    service: UserService = Depends(get_service),
) -> UserRead:
    """Registers a new user identity with envelope-encrypted PII.

    Requires Bearer authentication. Encrypts sensitive fields (email, mobile)
    and generates blind search indexes.
    \f
    Args:
        body: User registration fields.
        current_user: Authenticated actor.
        session: Active async database session.
        service: Injected user domain service.

    Returns:
        UserRead record with decrypted identifiers.
    """
    user = await service.create_user(session, body)
    await session.commit()
    return service.to_user_read(user)


@router.get(
    "/{user_id}",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Get user by ID",
    operation_id="users_get_user",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        UserNotFoundError,
        UnauthorizedError,
        UnprocessableContentError,
    ),
)
async def get_user(
    user_id: uuid.UUID = Path(
        description="Unique identifier of the user.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    ),
    current_user: User = Depends(get_current_user_dep),
    session: AsyncSession = Depends(get_db),
    service: UserService = Depends(get_service),
) -> UserRead:
    """Retrieves a user account and decrypts their PII.

    Requires Bearer authentication. Returns the user's decrypted email and
    mobile number for authorized callers.
    \f
    Args:
        user_id: Unique UUID of target user.
        current_user: Authenticated actor.
        session: Active async database session.
        service: Injected user domain service.

    Returns:
        UserRead record with decrypted identifiers.
    """
    user = await service.get_by_id(session, user_id)
    if not user:
        raise UserNotFoundError(user_id)
    return service.to_user_read(user)
