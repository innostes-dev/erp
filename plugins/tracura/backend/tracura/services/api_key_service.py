"""API Logger Ingestion Key Service (Generation, Verification, and Scoping)."""

from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import ipaddress
import secrets
import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from tracura.models.api_key import ApiLogApiKey
from tracura.schemas.api_key import ApiKeyCreate, ApiKeyCreatedResponse


KEY_PREFIX = "inno_log_live_"


def hash_key(raw_key: str) -> str:
    """Compute SHA-256 hex digest of the raw API key."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


class ApiKeyService:
    """Manages creation, verification, and revocation of Ingestion API keys."""

    async def create_key(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        payload: ApiKeyCreate,
        actor_id: uuid.UUID | None = None,
    ) -> tuple[ApiLogApiKey, str]:
        """Generate a new high-entropy ingestion API key and save its hash."""
        random_entropy = secrets.token_hex(32)
        raw_key = f"{KEY_PREFIX}{random_entropy}"
        key_hash = hash_key(raw_key)

        expires_at: datetime | None = None
        if payload.expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=payload.expires_in_days)

        api_key = ApiLogApiKey(
            tenant_id=tenant_id,
            name=payload.name,
            key_prefix=KEY_PREFIX,
            key_hash=key_hash,
            status="active",
            project_id=payload.project_id,
            allowed_environments=payload.allowed_environments or ["*"],
            ip_allowlist=payload.ip_allowlist,
            allowed_origins=payload.allowed_origins,
            rate_limit_rpm=payload.rate_limit_rpm,
            expires_at=expires_at,
            created_by=actor_id,
        )
        session.add(api_key)
        await session.flush()
        return api_key, raw_key

    async def verify_key(
        self,
        session: AsyncSession,
        raw_key: str,
    ) -> ApiLogApiKey | None:
        """Verify an incoming raw API key against stored active key hashes."""
        if not raw_key or not raw_key.startswith(KEY_PREFIX):
            return None

        key_hash = hash_key(raw_key)

        stmt = select(ApiLogApiKey).where(
            ApiLogApiKey.key_prefix == KEY_PREFIX,
            ApiLogApiKey.status == "active",
            ApiLogApiKey.deleted_at.is_(None),
        )
        candidates = (await session.execute(stmt)).scalars().all()

        for key_record in candidates:
            if hmac.compare_digest(key_record.key_hash, key_hash):
                # Check expiration
                if key_record.expires_at and key_record.expires_at < datetime.now(timezone.utc):
                    key_record.status = "expired"
                    await session.flush()
                    return None

                # Update last_used_at
                key_record.last_used_at = datetime.now(timezone.utc)
                await session.flush()
                return key_record

        return None

    def validate_ip(self, key_record: ApiLogApiKey, client_ip: str | None) -> bool:
        """Check if client IP is permitted by key's ip_allowlist."""
        if not key_record.ip_allowlist:
            return True  # No restriction
        if not client_ip:
            return False

        try:
            client_addr = ipaddress.ip_address(client_ip.strip())
            for allowed in key_record.ip_allowlist:
                allowed_str = allowed.strip()
                if "/" in allowed_str:
                    if client_addr in ipaddress.ip_network(allowed_str, strict=False):
                        return True
                else:
                    if client_addr == ipaddress.ip_address(allowed_str):
                        return True
        except ValueError:
            return False

        return False

    def validate_scope(
        self,
        key_record: ApiLogApiKey,
        target_project_id: uuid.UUID,
        target_environment_slug: str,
    ) -> bool:
        """Enforce Google-style project and environment scoping restrictions."""
        # 1. Project Scope: If key is restricted to a specific project, it must match
        if key_record.project_id is not None and key_record.project_id != target_project_id:
            return False

        # 2. Environment Scope: If key specifies environments and doesn't contain "*", slug must match
        allowed = key_record.allowed_environments or ["*"]
        if "*" not in allowed and target_environment_slug.lower() not in [e.lower() for e in allowed]:
            return False

        return True

    async def list_keys(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID | None = None,
    ) -> list[ApiLogApiKey]:
        """List active and revoked keys for a tenant/project."""
        stmt = (
            select(ApiLogApiKey)
            .where(
                ApiLogApiKey.tenant_id == tenant_id,
                ApiLogApiKey.deleted_at.is_(None),
            )
            .order_by(ApiLogApiKey.created_at.desc())
        )
        if project_id:
            stmt = stmt.where(ApiLogApiKey.project_id == project_id)

        return list((await session.execute(stmt)).scalars().all())

    async def revoke_key(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        key_id: uuid.UUID,
        actor_id: uuid.UUID | None = None,
    ) -> bool:
        """Revoke an API key immediately."""
        stmt = select(ApiLogApiKey).where(
            ApiLogApiKey.id == key_id,
            ApiLogApiKey.tenant_id == tenant_id,
            ApiLogApiKey.deleted_at.is_(None),
        )
        key_record = (await session.execute(stmt)).scalar_one_or_none()
        if not key_record:
            return False

        key_record.status = "revoked"
        key_record.revoked_at = datetime.now(timezone.utc)
        key_record.updated_by = actor_id
        await session.flush()
        return True
