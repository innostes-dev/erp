"""Tests for shared columns/service and the tenancy feature (no database needed)."""

from datetime import datetime, timezone
import unittest
from unittest.mock import AsyncMock, MagicMock
import uuid

from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from pydantic import ValidationError

from kernel.core.http import register_error_handlers
from kernel.core.security import create_access_token
from kernel.tenancy import (
    SlugTakenError,
    Tenant,
    TenantCreate,
    TenantRead,
    TenantService,
    TenantUpdate,
    module,
)
from kernel.tenancy.router import get_service

COMMON = ["id", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by"]
OWN = ["name", "slug", "country", "timezone", "language", "date_format"]


def fake_session(existing: object | None = None) -> MagicMock:
    """A session mock; `existing` is what a lookup query returns."""
    session = MagicMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = existing
    session.execute = AsyncMock(return_value=result)
    return session


class TestTenantModel(unittest.TestCase):
    def test_columns_in_order(self) -> None:
        cols = [c.name for c in Tenant.__table__.columns]
        self.assertEqual(cols, ["id", *OWN, *COMMON[1:]])

    def test_slug_is_unique(self) -> None:
        self.assertTrue(Tenant.__table__.c.slug.unique)

    def test_soft_delete_and_restore(self) -> None:
        actor = uuid.uuid4()
        t = Tenant(name="Acme", slug="acme")
        self.assertFalse(t.is_deleted)
        t.mark_deleted(actor)
        self.assertTrue(t.is_deleted)
        self.assertEqual(t.deleted_by, actor)
        t.restore()
        self.assertFalse(t.is_deleted)
        self.assertIsNone(t.deleted_by)


class TestTenantSchemas(unittest.TestCase):
    def test_read_schema_has_common_fields(self) -> None:
        self.assertEqual(set(TenantRead.model_fields), {*OWN, *COMMON})

    def test_create_requires_name_and_slug(self) -> None:
        with self.assertRaises(ValidationError):
            TenantCreate(name="", slug="acme")
        with self.assertRaises(ValidationError):
            TenantCreate(name="Acme")  # type: ignore[call-arg]

    def test_slug_format(self) -> None:
        TenantCreate(name="Acme", slug="acme-india-2")
        for bad in ["Acme", "acme corp", "-acme", "acme-", "acme_corp"]:
            with self.assertRaises(ValidationError, msg=bad):
                TenantCreate(name="Acme", slug=bad)


class TestTenantService(unittest.IsolatedAsyncioTestCase):
    async def test_create_sets_created_and_updated_by(self) -> None:
        actor = uuid.uuid4()
        service = TenantService(fake_session())
        t = await service.create(TenantCreate(name="Acme", slug="acme"), actor)
        self.assertEqual((t.name, t.slug, t.created_by, t.updated_by), ("Acme", "acme", actor, actor))
        service.session.add.assert_called_once_with(t)

    async def test_create_rejects_taken_slug(self) -> None:
        service = TenantService(fake_session(existing=Tenant(name="Other", slug="acme")))
        with self.assertRaises(SlugTakenError):
            await service.create(TenantCreate(name="Acme", slug="acme"))

    async def test_update_only_changes_sent_fields(self) -> None:
        actor = uuid.uuid4()
        service = TenantService(fake_session())
        t = Tenant(name="Old", slug="old")
        await service.update(t, TenantUpdate(), actor)
        self.assertEqual(t.name, "Old")
        await service.update(t, TenantUpdate(name="New"), actor)
        self.assertEqual((t.name, t.slug, t.updated_by), ("New", "old", actor))

    async def test_update_rejects_slug_of_another_tenant(self) -> None:
        service = TenantService(fake_session(existing=Tenant(name="Other", slug="taken")))
        with self.assertRaises(SlugTakenError):
            await service.update(Tenant(name="Acme", slug="acme"), TenantUpdate(slug="taken"))

    async def test_soft_delete(self) -> None:
        actor = uuid.uuid4()
        service = TenantService(fake_session())
        t = Tenant(name="Acme", slug="acme")
        await service.soft_delete(t, actor)
        self.assertIsNotNone(t.deleted_at)
        self.assertEqual(t.deleted_by, actor)


class TestTenantRouter(unittest.TestCase):
    def setUp(self) -> None:
        now = datetime.now(timezone.utc)

        async def create(data, actor_id=None):
            if data.slug == "taken":
                raise SlugTakenError(data.slug)
            return Tenant(**data.model_dump(), created_at=now, updated_at=now,
                          created_by=actor_id, updated_by=actor_id)

        self.service = MagicMock()
        self.service.create = AsyncMock(side_effect=create)
        self.service.get = AsyncMock(return_value=None)

        app = FastAPI()
        register_error_handlers(app)
        app.include_router(module.router)
        app.dependency_overrides[get_service] = lambda: self.service
        self.client = TestClient(app)

    def test_create_records_actor_from_token(self) -> None:
        user_id = uuid.uuid4()
        token = create_access_token({"sub": str(user_id)})
        res = self.client.post("/tenants", json={"name": "Acme", "slug": "acme", "country": "IN"},
                               headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        body = res.json()
        self.assertEqual((body["name"], body["slug"], body["country"]), ("Acme", "acme", "IN"))
        self.assertEqual(body["created_by"], str(user_id))
        self.assertIsNone(body["deleted_at"])

    def test_create_taken_slug_returns_409(self) -> None:
        res = self.client.post("/tenants", json={"name": "Acme", "slug": "taken"})
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("already in use", res.json()["detail"])

    def test_get_missing_returns_404(self) -> None:
        res = self.client.get(f"/tenants/{uuid.uuid4()}")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_validates_body(self) -> None:
        self.assertEqual(self.client.post("/tenants", json={"name": "", "slug": "a"}).status_code, status.HTTP_422_UNPROCESSABLE_CONTENT)
        self.assertEqual(self.client.post("/tenants", json={"name": "A", "slug": "Bad Slug"}).status_code, status.HTTP_422_UNPROCESSABLE_CONTENT)


class TestTenantApiDocs(unittest.TestCase):
    """The generated OpenAPI spec documents every tenant endpoint."""

    def test_endpoints_documented(self) -> None:
        app = FastAPI(openapi_tags=module.openapi_tags)
        app.include_router(module.router)
        spec = app.openapi()
        self.assertEqual(spec["tags"][0]["name"], "Tenancy")
        for path, ops in spec["paths"].items():
            for method, op in ops.items():
                where = f"{method.upper()} {path}"
                self.assertTrue(op.get("summary"), f"{where} has no summary")
                self.assertTrue(op.get("description"), f"{where} has no description")
                self.assertNotIn("Args:", op["description"], f"{where} leaks developer docs")
                self.assertTrue(op["operationId"].startswith("tenants_"), where)
                if "{tenant_id}" in path:
                    self.assertIn(str(status.HTTP_404_NOT_FOUND), op["responses"], f"{where} missing 404 doc")
        self.assertIn(str(status.HTTP_409_CONFLICT), spec["paths"]["/tenants"]["post"]["responses"])


if __name__ == "__main__":
    unittest.main()
