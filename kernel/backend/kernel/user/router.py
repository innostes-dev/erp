"""User endpoints (/users)."""

import uuid

from fastapi import APIRouter, Depends, Path, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.audit.services import actor_fields, audit_request, full_name
from kernel.core.database import get_db
from kernel.core.schemas import error_responses
from kernel.core.services.errors import UnauthorizedError
from kernel.user.models.user import User
from kernel.user.schemas import UserCreate, UserRead
from kernel.user.services import EmailAlreadyExistsError, UserNotFoundError, UserService

TAG = "User management"
router = APIRouter(prefix="/users", tags=[TAG])
BEARER = {"security": [{"BearerAuth": []}]}

_bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="JWT Bearer access token or personal access token.",
)


def get_service() -> UserService:
    return UserService()


async def get_current_user_dep(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db),
    service: UserService = Depends(get_service),
) -> User:
    # Imported here because kernel.auth imports kernel.user.
    from kernel.auth.dependencies import get_current_user

    return await get_current_user(request=request, credentials=credentials, session=session, user_service=service)


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user",
    operation_id="users_create_user",
    openapi_extra=BEARER,
    responses=error_responses(
        EmailAlreadyExistsError,
        UnauthorizedError,
    ),
)
async def create_user(
    body: UserCreate,
    request: Request,
    current_user: User = Depends(get_current_user_dep),
    session: AsyncSession = Depends(get_db),
    service: UserService = Depends(get_service),
) -> UserRead:
    """Registers a new user identity with envelope-encrypted PII.

    Requires Bearer authentication. Encrypts sensitive fields (email, mobile)
    and generates blind search indexes.
    """
    user = await service.create_user(session, body)

    await audit_request(
        session, request, action="CREATE", entity_type="user", entity_id=str(user.id),
        entity_name=full_name(user.first_name, user.last_name) or body.email,
        changes={
            "first_name": {"old": None, "new": user.first_name},
            "last_name": {"old": None, "new": user.last_name},
            "email": {"old": None, "new": body.email},
        },
        tenant_id=getattr(current_user, "tenant_id", None) or getattr(user, "tenant_id", None),
        reason=f"Registered user account '{body.email}'",
        **actor_fields(current_user),
    )
    await session.commit()
    return service.to_user_read(user)


@router.get(
    "/{user_id}",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Get user by ID",
    operation_id="users_get_user",
    openapi_extra=BEARER,
    responses=error_responses(
        UserNotFoundError,
        UnauthorizedError,
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
    """
    user = await service.get_by_id(session, user_id)
    if not user:
        raise UserNotFoundError(user_id)
    return service.to_user_read(user)
