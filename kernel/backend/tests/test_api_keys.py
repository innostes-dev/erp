"""Tests for API Key generation, verification, and revocation."""

from datetime import datetime, timezone
import unittest
from unittest.mock import AsyncMock, MagicMock
import uuid

from kernel.auth.models.api_key import ApiKey
from kernel.auth.services.api_key_service import ApiKeyService


def mock_session_factory():
    """Mock async session simulating database operations for API key tests."""
    session = MagicMock()
    items = []

    def mock_add(obj):
        if not getattr(obj, "id", None):
            obj.id = uuid.uuid4()
        if hasattr(obj, "created_at") and obj.created_at is None:
            obj.created_at = datetime.now(timezone.utc)
        if hasattr(obj, "updated_at") and obj.updated_at is None:
            obj.updated_at = datetime.now(timezone.utc)
        items.append(obj)

    session.add = MagicMock(side_effect=mock_add)
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    async def mock_execute(stmt):
        lookup = MagicMock()
        # Find item in items
        key_hash = None
        for item in items:
            # Check if stmt is querying by key_hash or id
            pass
        lookup.scalar_one_or_none = MagicMock(return_value=items[0] if items else None)
        lookup.scalars.return_value.all = MagicMock(return_value=list(items))
        return lookup

    session.execute = AsyncMock(side_effect=mock_execute)

    async def mock_refresh(obj):
        pass

    session.refresh = AsyncMock(side_effect=mock_refresh)
    session._items = items
    return session


class ApiKeyServiceTestCase(unittest.IsolatedAsyncioTestCase):
    """Verify cryptographic API Key operations."""

    def setUp(self) -> None:
        self.service = ApiKeyService()
        self.tenant_id = uuid.uuid4()
        self.user_id = uuid.uuid4()

    async def test_create_and_verify_api_key(self) -> None:
        """Generating an API key produces a raw token that verifies successfully against its hash."""
        session = mock_session_factory()

        # 1. Generate key
        api_key, raw_key = await self.service.create_api_key(
            session=session,
            tenant_id=self.tenant_id,
            user_id=self.user_id,
            name="Zapier CRM Sync",
            scopes=["crm:read", "crm:write"],
            expires_in_days=30,
        )

        self.assertTrue(raw_key.startswith("inno_live_"))
        self.assertEqual(api_key.name, "Zapier CRM Sync")
        self.assertFalse(api_key.is_revoked)
        self.assertIsNotNone(api_key.expires_at)
        self.assertEqual(api_key.key_prefix[:10], raw_key[:10])
        self.assertEqual(len(session._items), 1)

        # 2. Verify key with matching hash
        verified = await self.service.verify_api_key(session, raw_key)
        self.assertIsNotNone(verified)
        self.assertEqual(verified.id, api_key.id)
        self.assertIsNotNone(verified.last_used_at)

        # 3. Invalid prefix fails immediately without lookup
        invalid = await self.service.verify_api_key(session, "invalid_prefix_123")
        self.assertIsNone(invalid)

    async def test_revoke_api_key(self) -> None:
        """Revoking sets is_revoked and revoked_at."""
        session = mock_session_factory()

        api_key, raw_key = await self.service.create_api_key(
            session=session,
            tenant_id=self.tenant_id,
            user_id=self.user_id,
            name="To Revoke",
        )

        revoked = await self.service.revoke_api_key(session, api_key.id, self.tenant_id)
        self.assertTrue(revoked.is_revoked)
        self.assertIsNotNone(revoked.revoked_at)


if __name__ == "__main__":
    unittest.main()
