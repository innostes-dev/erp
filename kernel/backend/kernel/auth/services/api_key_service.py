"""Cryptographic API key generation, validation, and lifecycle management service."""

from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.auth.models.api_key import ApiKey
from kernel.core.services import NotFoundError


class ApiKeyService:
    """Manages high-entropy API keys for developer, programmatic, and machine access."""

    KEY_PREFIX = "inno_live_"

    @staticmethod
    def _hash_key(raw_key: str) -> str:
        """Hash raw plaintext token with SHA-256."""
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    async def create_api_key(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        name: str,
        scopes: list[str] | None = None,
        expires_in_days: int | None = None,
    ) -> tuple[ApiKey, str]:
        """Generate a cryptographically secure API key.

        Returns:
            Tuple of (ApiKey record, raw_key string). The raw_key must be shown
            to the user immediately as it is never stored and cannot be recovered.
        """
        random_entropy = secrets.token_urlsafe(32)
        raw_key = f"{self.KEY_PREFIX}{random_entropy}"
        key_prefix = f"{raw_key[:14]}..."
        key_hash = self._hash_key(raw_key)

        expires_at: datetime | None = None
        if expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

        api_key = ApiKey(
            tenant_id=tenant_id,
            user_id=user_id,
            name=name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            scopes=scopes or ["*"],
            expires_at=expires_at,
            is_revoked=False,
        )

        session.add(api_key)
        await session.commit()
        await session.refresh(api_key)

        return api_key, raw_key

    async def list_api_keys(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
    ) -> list[ApiKey]:
        """List all API keys for tenant, newest first."""
        query = (
            select(ApiKey)
            .where(ApiKey.tenant_id == tenant_id)
            .order_by(desc(ApiKey.created_at))
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    async def revoke_api_key(
        self,
        session: AsyncSession,
        key_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> ApiKey:
        """Permanently revoke an API key."""
        query = select(ApiKey).where(ApiKey.id == key_id, ApiKey.tenant_id == tenant_id)
        result = await session.execute(query)
        api_key = result.scalar_one_or_none()

        if not api_key:
            raise NotFoundError("API key not found.")

        api_key.is_revoked = True
        api_key.revoked_at = datetime.now(timezone.utc)

        await session.commit()
        await session.refresh(api_key)
        return api_key

    async def verify_api_key(
        self,
        session: AsyncSession,
        raw_key: str,
    ) -> ApiKey | None:
        """Authenticate a raw API key.

        Returns:
            The valid ApiKey record if active and unexpired, otherwise None.
        """
        if not raw_key.startswith(self.KEY_PREFIX):
            return None

        key_hash = self._hash_key(raw_key)
        query = select(ApiKey).where(ApiKey.key_hash == key_hash)
        result = await session.execute(query)
        api_key = result.scalar_one_or_none()

        if not api_key:
            return None

        if api_key.is_revoked:
            return None

        now = datetime.now(timezone.utc)
        if api_key.expires_at and api_key.expires_at < now:
            return None

        # Update last_used_at timestamp
        api_key.last_used_at = now
        await session.commit()

        return api_key
