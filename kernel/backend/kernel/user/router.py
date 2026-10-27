"""User and IAM HTTP endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from kernel.core.schemas import error_responses
from kernel.user.schemas import UserCreate, UserRead
from kernel.user.services import EmailAlreadyExistsError, UserNotFoundError, UserService

TAG = "User Management"
router = APIRouter(prefix="/users", tags=[TAG])


def get_service() -> UserService:
    return UserService()


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user",
    description="Registers a new user identity with envelope-encrypted PII.",
    responses=error_responses(EmailAlreadyExistsError),
)
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(get_db),
    service: UserService = Depends(get_service),
) -> UserRead:
    user = await service.create_user(session, body)
    await session.commit()
    return service.to_user_read(user)


@router.get(
    "/{user_id}",
    response_model=UserRead,
    summary="Get user by ID",
    description="Retrieves a user account and decrypts their PII.",
    responses=error_responses(UserNotFoundError),
)
async def get_user(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    service: UserService = Depends(get_service),
) -> UserRead:
    user = await service.get_by_id(session, user_id)
    if not user:
        raise UserNotFoundError(user_id)
    return service.to_user_read(user)
