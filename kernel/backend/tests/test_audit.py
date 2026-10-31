"""Unit & Integration test suite for Kernel Audit Subsystem."""

from datetime import datetime, timezone
import unittest
from unittest.mock import AsyncMock, MagicMock
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

from kernel.audit import AuditModule, audit_service, module
from kernel.audit.models.audit_log import AuditLog
from kernel.audit.router import get_audit_service, router
from kernel.audit.schemas.audit_log import (
    ActionCount,
    ActorSummary,
    AuditLogCreate,
    AuditLogRead,
    AuditSummary,
    EntityActivity,
)
from kernel.audit.services.audit_service import AuditService, compute_field_diff
from kernel.core.database import get_db


class TestComputeFieldDiff(unittest.TestCase):
    """Test field-level before and after state diff calculations."""

    def test_compute_diff_identifies_changed_fields(self) -> None:
        old_state = {"name": "Alice", "role": "Developer", "department": "Engineering"}
        new_state = {"name": "Alice", "role": "Tech Lead", "department": "Platform"}

        diff = compute_field_diff(old_state, new_state)
        self.assertIn("role", diff)
        self.assertEqual(diff["role"], {"old": "Developer", "new": "Tech Lead"})
        self.assertIn("department", diff)
        self.assertEqual(diff["department"], {"old": "Engineering", "new": "Platform"})
        self.assertNotIn("name", diff)

    def test_compute_diff_masks_sensitive_fields(self) -> None:
        old_state = {"email": "user@example.com", "password": "OldPassword123!", "token": "tok_old"}
        new_state = {"email": "user@example.com", "password": "NewPassword456!", "token": "tok_new"}

        diff = compute_field_diff(old_state, new_state)
        self.assertNotIn("password", diff)
        self.assertNotIn("token", diff)
        self.assertEqual(len(diff), 0)

    def test_compute_diff_handles_new_and_deleted_keys(self) -> None:
        old_state = {"status": "pending", "old_flag": True}
        new_state = {"status": "active", "new_flag": True}

        diff = compute_field_diff(old_state, new_state)
        self.assertEqual(diff["status"], {"old": "pending", "new": "active"})
        self.assertEqual(diff["old_flag"], {"old": True, "new": None})
        self.assertEqual(diff["new_flag"], {"old": None, "new": True})


class TestAuditService(unittest.IsolatedAsyncioTestCase):
    """Test AuditService business operations."""

    def setUp(self) -> None:
        self.service = AuditService()
        self.session = MagicMock()
        self.session.add = MagicMock()
        self.session.flush = AsyncMock()

    async def test_record_creates_audit_log(self) -> None:
        tenant_id = uuid.uuid4()
        actor_id = uuid.uuid4()

        record = await self.service.record(
            session=self.session,
            action="UPDATE",
            entity_type="user",
            entity_id="usr_12345",
            entity_name="Bob Smith",
            old_state={"title": "Analyst"},
            new_state={"title": "Senior Analyst"},
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email="admin@acme.org",
            actor_name="System Admin",
            ip_address="192.168.1.50",
            correlation_id="tr-998811",
            reason="Promotion",
        )

        self.assertIsInstance(record, AuditLog)
        self.assertEqual(record.action, "UPDATE")
        self.assertEqual(record.entity_type, "user")
        self.assertEqual(record.entity_id, "usr_12345")
        self.assertEqual(record.actor_email, "admin@acme.org")
        self.assertEqual(record.correlation_id, "tr-998811")
        self.assertIn("title", record.changes)
        self.assertEqual(record.changes["title"], {"old": "Analyst", "new": "Senior Analyst"})
        self.session.add.assert_called_once_with(record)
        self.session.flush.assert_awaited_once()


class TestAuditRouterEndpoints(unittest.TestCase):
    """Test HTTP API routes under /audit."""

    def setUp(self) -> None:
        self.mock_service = MagicMock(spec=AuditService)
        self.log_id = uuid.uuid4()
        self.tenant_id = uuid.uuid4()
        self.actor_id = uuid.uuid4()

        self.mock_log = AuditLog(
            id=self.log_id,
            tenant_id=self.tenant_id,
            actor_id=self.actor_id,
            actor_email="admin@acme.org",
            actor_name="Admin User",
            action="UPDATE",
            entity_type="user",
            entity_id="usr_8829",
            entity_name="Jane Doe",
            changes={"role": {"old": "Member", "new": "Admin"}},
            ip_address="10.0.0.1",
            user_agent="Mozilla/5.0",
            correlation_id="req_test_trace",
            reason="Granted admin access",
            status="SUCCESS",
            created_at=datetime.now(timezone.utc),
        )

        self.mock_service.query = AsyncMock(return_value=([self.mock_log], 1))
        self.mock_service.get_by_id = AsyncMock(return_value=self.mock_log)
        self.mock_service.get_entity_history = AsyncMock(return_value=[self.mock_log])
        self.mock_service.record_from_schema = AsyncMock(return_value=self.mock_log)

        self.mock_summary = AuditSummary(
            total_events=142,
            mutations_count=118,
            security_count=24,
            unique_actors_count=8,
            actions_breakdown=[ActionCount(action="UPDATE", count=80), ActionCount(action="CREATE", count=38)],
            entity_breakdown=[EntityActivity(entity_type="user", count=60), EntityActivity(entity_type="role", count=25)],
            top_actors=[ActorSummary(actor_id=str(self.actor_id), actor_email="admin@acme.org", actor_name="Admin User", count=45)],
        )
        self.mock_service.get_summary = AsyncMock(return_value=self.mock_summary)

        # Build FastAPI test client
        self.app = FastAPI()
        self.app.include_router(router)
        self.app.dependency_overrides[get_audit_service] = lambda: self.mock_service
        self.app.dependency_overrides[get_db] = lambda: AsyncMock()

        self.client = TestClient(self.app)

    def test_list_audit_logs_returns_200(self) -> None:
        res = self.client.get("/audit/logs?limit=10&offset=0")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["action"], "UPDATE")
        self.assertEqual(data["items"][0]["entity_type"], "user")

    def test_get_audit_summary_returns_200(self) -> None:
        res = self.client.get("/audit/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_events"], 142)
        self.assertEqual(data["mutations_count"], 118)
        self.assertEqual(len(data["actions_breakdown"]), 2)
        self.assertEqual(len(data["top_actors"]), 1)

    def test_get_single_log_returns_200(self) -> None:
        res = self.client.get(f"/audit/logs/{self.log_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], str(self.log_id))
        self.assertEqual(data["correlation_id"], "req_test_trace")

    def test_get_single_log_not_found_returns_404(self) -> None:
        self.mock_service.get_by_id = AsyncMock(return_value=None)
        res = self.client.get(f"/audit/logs/{uuid.uuid4()}")
        self.assertEqual(res.status_code, 404)

    def test_get_entity_history_returns_200(self) -> None:
        res = self.client.get("/audit/entities/user/usr_8829")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["entity_id"], "usr_8829")

    def test_create_programmatic_log_returns_201(self) -> None:
        payload = {
            "action": "CREATE",
            "entity_type": "employee",
            "entity_id": "emp_101",
            "entity_name": "New Hire",
            "changes": {"status": {"old": None, "new": "active"}},
            "reason": "Onboarding",
        }
        res = self.client.post("/audit/logs", json=payload)
        self.assertEqual(res.status_code, 201)
        self.mock_service.record_from_schema.assert_awaited_once()


class TestAuditModuleMetadata(unittest.TestCase):
    """Verify AuditModule registration contract."""

    def test_module_metadata(self) -> None:
        self.assertEqual(module.name, "audit")
        self.assertEqual(module.version, "0.1.0")
        self.assertEqual(len(module.openapi_tags), 1)
        self.assertEqual(module.openapi_tags[0]["name"], "Audit Trail")
        self.assertIsNotNone(module.router)


if __name__ == "__main__":
    unittest.main()
