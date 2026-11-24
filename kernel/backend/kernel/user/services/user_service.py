"""User management service handling credentials, encryption, and lifecycle."""

from datetime import datetime, timezone
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.crypto import BlindIndex, FieldCipher
from kernel.core.services import ConflictError, ErrorCode, NotFoundError
from kernel.user.models.credentials import Identity, IdentityType
from kernel.user.models.password_history import PasswordHistory
from kernel.user.models.profile import UserProfile
from kernel.user.models.security import UserSecurity
from kernel.user.models.user import User, UserStatus
from kernel.user.schemas.user import AdminUserInput, UserCreate, UserRead, UserUpdate
from kernel.user.services.credential_service import CredentialService
from kernel.user.services.password import hash_password


class EmailAlreadyExistsError(ConflictError):
    """Raised when an account already exists with the provided email."""

    code = ErrorCode.EMAIL_ALREADY_EXISTS

    def __init__(self, email: str) -> None:
        super().__init__(f"User with email '{email}' already exists.")


class MobileAlreadyExistsError(ConflictError):
    """Raised when another account (active or soft-deleted) already uses the mobile number."""

    code = ErrorCode.MOBILE_ALREADY_EXISTS

    def __init__(self) -> None:
        super().__init__("User with this mobile number already exists.")


class UserNotFoundError(NotFoundError):
    """Raised when a requested user identity is not found."""

    code = ErrorCode.USER_NOT_FOUND

    def __init__(self, identifier: str | uuid.UUID) -> None:
        super().__init__(f"User '{identifier}' not found.")


class UserService:
    """Service governing user creation, authentication credentials, and envelope encryption."""

    def __init__(
        self,
        cipher: FieldCipher | None = None,
        blind_index: BlindIndex | None = None,
    ) -> None:
        self.cipher = cipher or FieldCipher()
        self.blind_index = blind_index or BlindIndex()
        self.credentials = CredentialService(cipher=self.cipher, blind_index=self.blind_index)

    async def get_by_id(self, session: AsyncSession, user_id: uuid.UUID) -> User | None:
        """Find user by UUID (excluding soft-deleted)."""
        stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, session: AsyncSession, email: str) -> User | None:
        """Find user by email through the `identities` table (falls back to the legacy column)."""
        return await self.credentials.find_user_by_identifier(session, IdentityType.EMAIL, email)

    async def create_user(
        self,
        session: AsyncSession,
        data: UserCreate | AdminUserInput,
        is_super_admin: bool = False,
    ) -> User:
        """Create a user with envelope-encrypted PII and bcrypt password hashing."""
        email_hash = self.blind_index.compute(data.email)
        if not email_hash:
            raise ValueError("Email cannot be empty.")

        existing = await self.get_by_email(session, data.email)
        if existing:
            raise EmailAlreadyExistsError(data.email)

        # Envelope encryption of PII
        email_encrypted = self.cipher.encrypt(data.email)
        mobile_hash = self.blind_index.compute(data.mobile) if data.mobile else None
        if mobile_hash and await self._mobile_taken(session, mobile_hash):
            # Same rule as the unique index users.mobile_hash (includes soft-deleted users); a clean 409
            # instead of an IntegrityError 500. Matches the Laravel and NestJS kernels.
            raise MobileAlreadyExistsError()
        mobile_encrypted = self.cipher.encrypt(data.mobile) if data.mobile else None

        password_hash = hash_password(data.password)
        now_utc = datetime.now(timezone.utc)

        user = User(
            first_name=data.first_name,
            last_name=data.last_name,
            email_hash=email_hash,
            email_encrypted=email_encrypted,
            mobile_hash=mobile_hash,
            mobile_encrypted=mobile_encrypted,
            password_hash=password_hash,
            status=UserStatus.ACTIVE,
            is_super_admin=is_super_admin,
            must_change_password=False,
            failed_login_attempts=0,
            token_version=1,
            created_at=now_utc,
            updated_at=now_utc,
        )
        session.add(user)
        await session.flush()

        # Login identifiers and password in the dedicated tables (legacy columns above stay in sync).
        session.add(self.credentials.new_identity(user.id, IdentityType.EMAIL, data.email, is_primary=True))
        if data.mobile:
            session.add(self.credentials.new_identity(user.id, IdentityType.PHONE, data.mobile, is_primary=True))
        session.add(self.credentials.new_password_credential(user.id, password_hash))

        profile = UserProfile(user_id=user.id)
        security = UserSecurity(
            user_id=user.id,
            password_changed_at=datetime.now(timezone.utc),
        )
        history = PasswordHistory(user_id=user.id, password_hash=password_hash)

        session.add(profile)
        session.add(security)
        session.add(history)
        await session.flush()

        return user

    async def _mobile_taken(self, session: AsyncSession, mobile_hash: str) -> bool:
        """True if any user (also soft-deleted) or phone identity already has this mobile number."""
        legacy = select(User.id).where(User.mobile_hash == mobile_hash).limit(1)
        if (await session.execute(legacy)).scalar_one_or_none() is not None:
            return True
        ident = select(Identity.id).where(Identity.type == IdentityType.PHONE.value, Identity.value_hash == mobile_hash)
        return (await session.execute(ident.limit(1))).scalar_one_or_none() is not None

    def decrypt_email(self, user: User) -> str:
        """Decrypt user's email ciphertext."""
        decrypted = self.cipher.decrypt(user.email_encrypted)
        return decrypted or ""

    def decrypt_mobile(self, user: User) -> str | None:
        """Decrypt user's mobile ciphertext."""
        if not user.mobile_encrypted:
            return None
        return self.cipher.decrypt(user.mobile_encrypted)

    def to_user_read(self, user: User) -> UserRead:
        """Convert database entity to schema with decrypted fields."""
        now_utc = datetime.now(timezone.utc)
        return UserRead(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=self.decrypt_email(user),
            mobile=self.decrypt_mobile(user),
            status=user.status or UserStatus.ACTIVE,
            is_super_admin=user.is_super_admin or False,
            token_version=user.token_version if user.token_version is not None else 1,
            created_at=user.created_at or now_utc,
            created_by=user.created_by,
            updated_at=user.updated_at or now_utc,
            updated_by=user.updated_by,
            deleted_at=user.deleted_at,
            deleted_by=user.deleted_by,
        )
