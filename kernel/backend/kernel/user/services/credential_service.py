"""Login identities (email, phone, ...) and credentials (password, ...).

While the legacy columns on `users` still exist (migration 0010 is the expand step):
- reads use the new tables, and fall back to the `users` columns only when the new table has no row
  at all. A soft-deleted identity or password is final and never comes back through the old column;
- writes go to both places.
Laravel and NestJS follow the same rules on the same database.
"""

from datetime import datetime
import uuid

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.crypto import BlindIndex, FieldCipher
from kernel.user.models.credentials import Credential, CredentialType, Identity, IdentityType
from kernel.user.models.user import User

PASSWORD = CredentialType.PASSWORD.value
LEGACY_COLUMN = {IdentityType.EMAIL: User.email_hash, IdentityType.PHONE: User.mobile_hash}


class CredentialService:
    def __init__(self, cipher: FieldCipher | None = None, blind_index: BlindIndex | None = None) -> None:
        self.cipher = cipher or FieldCipher()
        self.blind_index = blind_index or BlindIndex()

    # ---- identities ----------------------------------------------------

    async def find_user_by_identifier(self, session: AsyncSession, kind: IdentityType, value: str) -> User | None:
        """The active user who owns this email/phone/username (case and surrounding spaces ignored)."""
        value_hash = self._hash(value)
        if not value_hash:
            return None

        owner = select(User).join(Identity, Identity.user_id == User.id).where(
            Identity.type == kind.value,
            Identity.value_hash == value_hash,
            Identity.deleted_at.is_(None),
            User.deleted_at.is_(None),
        )
        user = (await session.execute(owner)).scalar_one_or_none()
        if user is not None:
            return user

        any_row = select(Identity.id).where(Identity.type == kind.value, Identity.value_hash == value_hash).limit(1)
        if (await session.execute(any_row)).scalar_one_or_none() is not None:
            return None  # the identity exists but was removed

        column = LEGACY_COLUMN.get(kind)
        if column is None:
            return None
        legacy = select(User).where(column == value_hash, User.deleted_at.is_(None))
        return (await session.execute(legacy)).scalar_one_or_none()

    def new_identity(
        self,
        user_id: uuid.UUID,
        kind: IdentityType,
        value: str,
        *,
        is_primary: bool = False,
        verified_at: datetime | None = None,
        actor_id: uuid.UUID | None = None,
    ) -> Identity:
        """An identity row for `value` (blind index + encrypted copy). Not added to the session."""
        value_hash = self._hash(value)
        if not value_hash:
            raise ValueError(f"{kind.value} cannot be empty.")
        return Identity(
            user_id=user_id,
            type=kind.value,
            value_hash=value_hash,
            value_encrypted=self.cipher.encrypt(value),
            is_primary=is_primary,
            verified_at=verified_at,
            created_by=actor_id,
            updated_by=actor_id,
        )

    # ---- passwords -------------------------------------------------------

    async def get_password_hash(self, session: AsyncSession, user: User) -> str | None:
        """The user's password hash, or None when they have no password."""
        active = select(Credential.secret_hash).where(
            Credential.user_id == user.id, Credential.type == PASSWORD, Credential.deleted_at.is_(None)
        )
        secret_hash = (await session.execute(active)).scalar_one_or_none()
        if secret_hash:
            return secret_hash

        any_row = select(Credential.id).where(Credential.user_id == user.id, Credential.type == PASSWORD).limit(1)
        if (await session.execute(any_row)).scalar_one_or_none() is not None:
            return None  # the password was removed
        return user.password_hash or None

    def new_password_credential(
        self, user_id: uuid.UUID, password_hash: str, actor_id: uuid.UUID | None = None
    ) -> Credential:
        return Credential(
            user_id=user_id, type=PASSWORD, secret_hash=password_hash, created_by=actor_id, updated_by=actor_id
        )

    async def set_password_hash(
        self, session: AsyncSession, user: User, password_hash: str, actor_id: uuid.UUID | None = None
    ) -> None:
        """Replace the password in `credentials` (insert or update) and in the legacy `users` column."""
        upsert = (
            insert(Credential)
            .values(
                id=uuid.uuid4(),
                user_id=user.id,
                type=PASSWORD,
                secret_hash=password_hash,
                created_by=actor_id,
                updated_by=actor_id,
            )
            .on_conflict_do_update(
                # the partial unique index uq_credentials_user_password
                index_elements=[Credential.user_id],
                index_where=text("type = 'password' AND deleted_at IS NULL"),
                set_={"secret_hash": password_hash, "updated_at": func.now(), "updated_by": actor_id},
            )
        )
        await session.execute(upsert)
        user.password_hash = password_hash

    def _hash(self, value: str | None) -> str | None:
        # Blanks never match or get stored (the blind index would hash "   " like "").
        return self.blind_index.compute(value) if value and value.strip() else None
