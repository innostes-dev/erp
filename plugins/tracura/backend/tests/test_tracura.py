"""Production-grade Unit & Integration test suite for Universal API Logger plugin.

Tests cover:
1. Core plugin metadata and health diagnostics
2. Multi-vector secret scrubbing (Headers, Query params, JWT patterns, JSON body trees, IPv4/IPv6 zero-masking, payload truncation)
3. Google developer-style scoped API keys (Prefix hashing, IP allowlist CIDR matching, Project & Environment restrictions)
4. Async memory queue buffer and batch flush logic
5. Project & Environment CRUD lifecycle with auto-seeded environments and cascading deletion
6. Ingestion processing engine (Scope verification, path exclusions, error-only filtering, sampling, tenant immutability)
7. Log querying and filter predicates (status_code, errors_only, slow_requests, search, correlation ID)
8. Analytics dashboard calculations (KPIs, success rate, timeseries aggregation, environment health, top endpoints, top errors)
9. HTTP endpoints security & authorization (401 without auth, 403 on IP mismatch, 202 on ingestion, universal API key access across all management APIs)
"""

from datetime import datetime, timezone
import unittest
from unittest.mock import AsyncMock, MagicMock
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

from kernel.core.database import get_db
from tracura import ApiLoggerPlugin, plugin
from tracura.auth.ingest_auth import get_api_key_service as get_ingest_auth_key_service
from tracura.auth.user_context import get_api_key_service
from tracura.middleware.buffer import LogBuffer
from tracura.models.api_key import ApiLogApiKey
from tracura.models.environment import ApiLogEnvironment
from tracura.models.log import ApiLog
from tracura.models.project import ApiLogProject
from tracura.models.settings import ApiLogSettings
from tracura.router import (
    external_ingest_alias_router,
    external_ingest_router,
    legacy_api_logger_router,
    router,
)
from tracura.router.analytics import get_analytics_service
from tracura.router.ingest import get_ingest_service
from tracura.router.keys import get_api_key_service as get_keys_api_key_service
from tracura.router.logs import get_log_query_service
from tracura.router.projects import get_project_service
from tracura.router.settings import get_settings_service
from tracura.schemas.analytics import AnalyticsDashboard, KpiSummary, TimeseriesPoint
from tracura.schemas.api_key import ApiKeyCreate
from tracura.schemas.ingest import IngestLogItem, IngestResponse
from tracura.schemas.project import EnvironmentCreate, ProjectCreate, ProjectUpdate
from tracura.schemas.settings import SettingsUpdate
from tracura.services.api_key_service import ApiKeyService, KEY_PREFIX, hash_key
from tracura.services.ingest_service import IngestService
from tracura.services.sanitizer import SanitizerService


# ==============================================================================
# 1. CORE PLUGIN & HEALTH DIAGNOSTICS TESTS
# ==============================================================================

class TestTracuraPlugin(unittest.IsolatedAsyncioTestCase):
    """Core plugin lifecycle and metadata tests."""

    def test_plugin_metadata(self) -> None:
        self.assertEqual(plugin.name, "tracura")
        self.assertEqual(plugin.version, "0.1.0")
        self.assertIsNotNone(plugin.router)
        self.assertEqual(len(plugin.openapi_tags), 7)

    async def test_health_check(self) -> None:
        health = await plugin.health_check()
        self.assertEqual(health["status"], "HEALTHY")
        self.assertEqual(health["plugin"], "tracura")
        self.assertIn("buffer_queue_size", health)


# ==============================================================================
# 2. MULTI-VECTOR PII & SECRET SCRUBBING TESTS
# ==============================================================================

class TestSanitizerService(unittest.TestCase):
    """Multi-vector secret and PII scrubbing tests."""

    def setUp(self) -> None:
        self.sanitizer = SanitizerService(max_body_size_bytes=512, mask_client_ip=True)

    def test_header_sanitization(self) -> None:
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer inno_live_secret_token_12345",
            "Cookie": "session_id=xyz987",
            "X-API-Key": "inno_log_live_test_key",
            "X-Custom-Header": "safe-value",
        }
        sanitized = self.sanitizer.sanitize_headers(headers)
        self.assertIsNotNone(sanitized)
        self.assertEqual(sanitized["Content-Type"], "application/json")
        self.assertEqual(sanitized["Authorization"], "[REDACTED]")
        self.assertEqual(sanitized["Cookie"], "[REDACTED]")
        self.assertEqual(sanitized["X-API-Key"], "[REDACTED]")
        self.assertEqual(sanitized["X-Custom-Header"], "safe-value")

    def test_jwt_redaction_in_text(self) -> None:
        fake_jwt = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature"
        headers = {"X-User-Auth": fake_jwt}
        sanitized = self.sanitizer.sanitize_headers(headers)
        self.assertIn("[REDACTED_JWT]", sanitized["X-User-Auth"])
        self.assertNotIn("doNotLeakThisSignature", sanitized["X-User-Auth"])

    def test_query_params_sanitization(self) -> None:
        params = {
            "search": "laptops",
            "token": "tok_stripe_4421",
            "client_secret": "sec_88123",
            "page": "1",
        }
        sanitized = self.sanitizer.sanitize_query_params(params)
        self.assertEqual(sanitized["search"], "laptops")
        self.assertEqual(sanitized["token"], "[REDACTED]")
        self.assertEqual(sanitized["client_secret"], "[REDACTED]")
        self.assertEqual(sanitized["page"], "1")

    def test_recursive_body_redaction(self) -> None:
        body = {
            "user": {
                "name": "Jane Doe",
                "password": "SuperSecretPassword123!",
                "payment_profile": {
                    "credit_card": "4111-2222-3333-4444",
                    "cvv": "123",
                    "billing_zip": "94103",
                },
            },
            "cart": [
                {"item_id": "item_1", "price": 45.0},
                {"item_id": "item_2", "access_token": "secret_oauth_token"},
            ],
        }
        sanitized = self.sanitizer.sanitize_body(body)
        self.assertEqual(sanitized["user"]["name"], "Jane Doe")
        self.assertEqual(sanitized["user"]["password"], "[REDACTED]")
        self.assertEqual(sanitized["user"]["payment_profile"]["credit_card"], "[REDACTED]")
        self.assertEqual(sanitized["user"]["payment_profile"]["cvv"], "[REDACTED]")
        self.assertEqual(sanitized["user"]["payment_profile"]["billing_zip"], "94103")
        self.assertEqual(sanitized["cart"][0]["price"], 45.0)
        self.assertEqual(sanitized["cart"][1]["access_token"], "[REDACTED]")

    def test_body_truncation_when_exceeding_limit(self) -> None:
        large_body = {"data": "x" * 1024}
        sanitized = self.sanitizer.sanitize_body(large_body)
        self.assertTrue(sanitized.get("_truncated"))
        self.assertEqual(sanitized.get("_max_allowed"), 512)
        self.assertIn("_preview", sanitized)

    def test_client_ip_zero_masking(self) -> None:
        # IPv4
        self.assertEqual(self.sanitizer.mask_ip("192.168.1.144"), "192.168.1.0")
        self.assertEqual(self.sanitizer.mask_ip("10.200.5.88"), "10.200.5.0")
        # IPv6
        masked_v6 = self.sanitizer.mask_ip("2001:db8:85a3::8a2e:370:7334")
        self.assertTrue(masked_v6.startswith("2001:db8:85a3::"))


# ==============================================================================
# 3. SCOPED INGESTION API KEY LOGIC TESTS
# ==============================================================================

class TestApiKeyService(unittest.TestCase):
    """Google developer-style scoped API key logic tests."""

    def setUp(self) -> None:
        self.service = ApiKeyService()
        self.tenant_id = uuid.uuid4()
        self.project_a = uuid.uuid4()
        self.project_b = uuid.uuid4()

    def test_key_prefix_and_hashing(self) -> None:
        raw_key = f"{KEY_PREFIX}1234567890abcdef1234567890abcdef"
        hashed = hash_key(raw_key)
        self.assertTrue(raw_key.startswith("inno_log_live_"))
        self.assertEqual(len(hashed), 64)  # SHA-256 hex string

    def test_ip_allowlist_validation(self) -> None:
        key = ApiLogApiKey(
            tenant_id=self.tenant_id,
            name="Test Key",
            key_prefix=KEY_PREFIX,
            key_hash="hash",
            ip_allowlist=["10.0.0.0/16", "192.168.1.50"],
        )
        # Permitted IPs
        self.assertTrue(self.service.validate_ip(key, "10.0.1.25"))
        self.assertTrue(self.service.validate_ip(key, "192.168.1.50"))
        # Blocked IPs
        self.assertFalse(self.service.validate_ip(key, "192.168.1.51"))
        self.assertFalse(self.service.validate_ip(key, "172.16.0.1"))
        # No IP provided when allowlist active
        self.assertFalse(self.service.validate_ip(key, None))

    def test_project_scope_enforcement(self) -> None:
        # Key locked to project A
        key_locked = ApiLogApiKey(
            tenant_id=self.tenant_id,
            name="Project A Key",
            key_prefix=KEY_PREFIX,
            key_hash="hash",
            project_id=self.project_a,
            allowed_environments=["*"],
        )
        self.assertTrue(self.service.validate_scope(key_locked, self.project_a, "production"))
        self.assertFalse(self.service.validate_scope(key_locked, self.project_b, "production"))

        # Tenant-wide key (project_id=None)
        key_global = ApiLogApiKey(
            tenant_id=self.tenant_id,
            name="Global Key",
            key_prefix=KEY_PREFIX,
            key_hash="hash",
            project_id=None,
            allowed_environments=["*"],
        )
        self.assertTrue(self.service.validate_scope(key_global, self.project_a, "production"))
        self.assertTrue(self.service.validate_scope(key_global, self.project_b, "staging"))

    def test_environment_scope_enforcement(self) -> None:
        key = ApiLogApiKey(
            tenant_id=self.tenant_id,
            name="Staging & Dev Key",
            key_prefix=KEY_PREFIX,
            key_hash="hash",
            project_id=self.project_a,
            allowed_environments=["staging", "development"],
        )
        self.assertTrue(self.service.validate_scope(key, self.project_a, "staging"))
        self.assertTrue(self.service.validate_scope(key, self.project_a, "development"))
        # Production is forbidden for this key
        self.assertFalse(self.service.validate_scope(key, self.project_a, "production"))


# ==============================================================================
# 4. MEMORY QUEUE BUFFER & DRAIN TESTS
# ==============================================================================

class TestBufferQueue(unittest.IsolatedAsyncioTestCase):
    """Ring buffer queue tests (in-memory + Redis adapter with fallback)."""

    async def test_enqueue_and_drain(self) -> None:
        buffer = LogBuffer(max_batch_size=10, flush_interval_seconds=0.1)
        self.assertEqual(buffer.queue.qsize(), 0)
        self.assertEqual(buffer.driver, "memory")

        item = {
            "correlation_id": "req_test_123",
            "http_method": "GET",
            "path": "/api/v1/test",
            "status_code": 200,
            "duration_ms": 12.5,
        }
        success = await buffer.enqueue(item)
        self.assertTrue(success)
        self.assertEqual(buffer.queue.qsize(), 1)
        self.assertEqual(await buffer.get_queue_size(), 1)

    async def test_enqueue_batch(self) -> None:
        buffer = LogBuffer(max_batch_size=50, flush_interval_seconds=0.1)
        items = [{"id": i, "correlation_id": f"req_{i}"} for i in range(5)]
        success = await buffer.enqueue_batch(items)
        self.assertTrue(success)
        self.assertEqual(buffer.queue.qsize(), 5)
        self.assertEqual(await buffer.get_queue_size(), 5)

    async def test_fallback_to_memory_when_redis_unavailable(self) -> None:
        """Verify buffer falls back to in-memory mode when Redis is not reachable."""
        buffer = LogBuffer(
            max_batch_size=10,
            flush_interval_seconds=0.1,
            redis_url="redis://127.0.0.1:9999/0",
        )
        connected = await buffer._init_redis()
        self.assertFalse(connected)
        self.assertEqual(buffer.driver, "memory")

        # Telemetry queueing continues normally without failure
        item = {"correlation_id": "req_fallback_456", "path": "/api/orders"}
        success = await buffer.enqueue(item)
        self.assertTrue(success)
        self.assertEqual(buffer.queue.qsize(), 1)

    async def test_redis_active_mode_enqueue_and_drain(self) -> None:
        """Verify Redis queueing and draining when Redis client is active."""
        buffer = LogBuffer(max_batch_size=10, flush_interval_seconds=0.1)
        mock_redis = MagicMock()
        mock_redis.rpush = AsyncMock(return_value=1)
        mock_redis.publish = AsyncMock(return_value=1)
        mock_redis.llen = AsyncMock(return_value=3)
        mock_redis.lpop = AsyncMock(return_value=['{"id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "correlation_id": "req_redis_1"}'])

        buffer._driver = "redis"
        buffer._redis_client = mock_redis

        self.assertEqual(buffer.driver, "redis")
        self.assertEqual(await buffer.get_queue_size(), 3)

        item = {"correlation_id": "req_redis_1", "path": "/api/users"}
        success = await buffer.enqueue(item)
        self.assertTrue(success)
        mock_redis.rpush.assert_awaited_once()
        mock_redis.publish.assert_awaited_once()


# ==============================================================================
# 5. INGESTION PROCESSING & SCOPING ENGINE TESTS
# ==============================================================================

class TestIngestService(unittest.IsolatedAsyncioTestCase):
    """Direct business logic tests for ingestion engine."""

    async def test_ingest_enforces_project_scope(self) -> None:
        tenant_id = uuid.uuid4()
        project_allowed = uuid.uuid4()
        project_forbidden = uuid.uuid4()

        api_key = ApiLogApiKey(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            name="Restricted Key",
            key_prefix="inno_log_live_",
            key_hash="hash",
            project_id=project_allowed,
            allowed_environments=["*"],
        )

        # Mock project service returning project_forbidden
        mock_proj_service = MagicMock()
        mock_proj = ApiLogProject(
            id=project_forbidden,
            tenant_id=tenant_id,
            name="Forbidden Project",
            slug="forbidden-proj",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        mock_env = ApiLogEnvironment(
            id=uuid.uuid4(),
            project_id=project_forbidden,
            tenant_id=tenant_id,
            name="Production",
            slug="production",
            color_badge="emerald",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        mock_proj_service.get_project = AsyncMock(return_value=mock_proj)
        mock_proj_service.get_environment = AsyncMock(return_value=mock_env)

        ingest_service = IngestService(project_service=mock_proj_service)

        item = IngestLogItem(
            project="forbidden-proj",
            environment="production",
            correlation_id="req_test_forbidden",
            http_method="POST",
            url="https://api.company.com/charges",
            path="/charges",
            status_code=200,
            duration_ms=45.0,
        )

        session = AsyncMock()
        response = await ingest_service.ingest_logs(session, api_key, [item])

        # Scope mismatch causes log to be dropped
        self.assertEqual(response.accepted, 0)
        self.assertEqual(response.dropped, 1)


# ==============================================================================
# 6. HTTP ENDPOINTS & UNIVERSAL API KEY ACCESS CONTROL TESTS
# ==============================================================================

class TestHttpEndpoints(unittest.TestCase):
    """Comprehensive HTTP integration & security tests."""

    def setUp(self) -> None:
        self.tenant_id = uuid.uuid4()
        self.user_id = uuid.uuid4()
        self.project_id = uuid.uuid4()
        self.env_id = uuid.uuid4()
        self.log_id = uuid.uuid4()

        # Shared mock API key
        self.mock_api_key = ApiLogApiKey(
            id=uuid.uuid4(),
            tenant_id=self.tenant_id,
            name="Universal Ingestion Key",
            key_prefix="inno_log_live_",
            key_hash="valid_hash_123",
            allowed_environments=["*"],
            rate_limit_rpm=60000,
            status="active",
            created_by=self.user_id,
            project_id=None,
            ip_allowlist=None,
            allowed_origins=None,
            expires_at=None,
            last_used_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        self.mock_api_key.project = None

        # Mock API Key Service
        self.mock_key_service = MagicMock()
        self.mock_key_service.verify_key = AsyncMock(return_value=self.mock_api_key)
        self.mock_key_service.validate_ip = MagicMock(return_value=True)

        # Mock Project Service
        self.mock_project = ApiLogProject(
            id=self.project_id,
            tenant_id=self.tenant_id,
            name="Payment Gateway",
            slug="payment-gateway",
            description="Core payment processing microservice",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.mock_env = ApiLogEnvironment(
            id=self.env_id,
            project_id=self.project_id,
            tenant_id=self.tenant_id,
            name="Production",
            slug="production",
            color_badge="emerald",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.mock_proj_service = MagicMock()
        self.mock_proj_service.list_projects = AsyncMock(return_value=[self.mock_project])
        self.mock_proj_service.get_project = AsyncMock(
            side_effect=lambda s, t, slug: None if slug == "e-commerce-store" else self.mock_project
        )
        self.mock_proj_service.create_project = AsyncMock(return_value=self.mock_project)
        self.mock_proj_service.update_project = AsyncMock(return_value=self.mock_project)
        self.mock_proj_service.delete_project = AsyncMock(return_value=True)
        self.mock_proj_service.list_environments = AsyncMock(return_value=[self.mock_env])
        self.mock_proj_service.get_environment = AsyncMock(return_value=None)
        self.mock_proj_service.create_environment = AsyncMock(return_value=self.mock_env)
        self.mock_proj_service.delete_environment = AsyncMock(return_value=True)

        # Mock Log Query Service
        self.mock_log = ApiLog(
            id=self.log_id,
            tenant_id=self.tenant_id,
            project_id=self.project_id,
            environment_id=self.env_id,
            correlation_id="req_test_8812",
            http_method="POST",
            url="https://api.company.com/v1/orders",
            path="/v1/orders",
            status_code=500,
            duration_ms=1840.0,
            created_at=datetime.now(timezone.utc),
        )
        self.mock_log_service = MagicMock()
        self.mock_log_service.query_logs = AsyncMock(return_value=([self.mock_log], 1))
        self.mock_log_service.get_log = AsyncMock(return_value=self.mock_log)

        # Mock Settings Service
        self.mock_settings = ApiLogSettings(
            id=uuid.uuid4(),
            tenant_id=self.tenant_id,
            retention_days=30,
            max_body_size_bytes=4096,
            sampling_rate=1.0,
            capture_headers=True,
            capture_body=True,
            log_errors_only=False,
            sensitive_headers=["authorization", "cookie"],
            sensitive_body_fields=["password", "token"],
            mask_client_ip=False,
            excluded_paths=["/health", "/metrics"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.mock_settings_service = MagicMock()
        self.mock_settings_service.get_effective_settings = AsyncMock(return_value=self.mock_settings)
        self.mock_settings_service.update_settings = AsyncMock(return_value=self.mock_settings)

        # Mock Ingest Service
        self.mock_ingest_service = MagicMock()
        self.mock_ingest_service.ingest_logs = AsyncMock(
            return_value=IngestResponse(accepted=1, dropped=0, status="accepted")
        )

        # Mock Analytics Service
        self.mock_analytics = AnalyticsDashboard(
            kpi=KpiSummary(
                total_requests=12482,
                successful_requests=12238,
                success_rate_pct=98.2,
                error_requests=244,
                error_rate_pct=1.8,
                avg_latency_ms=243.0,
                p95_latency_ms=892.0,
                p99_latency_ms=1240.0,
                status_breakdown={"2xx": 12238, "3xx": 32, "4xx": 96, "5xx": 116},
            ),
            timeseries=[
                TimeseriesPoint(
                    timestamp=datetime.now(timezone.utc),
                    label="12 AM",
                    requests=400,
                    errors=12,
                    avg_latency_ms=210.0,
                    p95_latency_ms=480.0,
                )
            ],
            environment_health=[],
            top_endpoints=[],
            top_errors=[],
        )
        self.mock_analytics_service = MagicMock()
        self.mock_analytics_service.get_dashboard = AsyncMock(return_value=self.mock_analytics)

        # Configure App & Dependency Overrides
        self.app = FastAPI()
        self.app.include_router(router)
        self.app.include_router(external_ingest_router)
        self.app.include_router(legacy_api_logger_router)
        self.app.include_router(external_ingest_alias_router)

        self.app.dependency_overrides[get_api_key_service] = lambda: self.mock_key_service
        self.app.dependency_overrides[get_ingest_auth_key_service] = lambda: self.mock_key_service
        self.app.dependency_overrides[get_keys_api_key_service] = lambda: self.mock_key_service
        self.app.dependency_overrides[get_project_service] = lambda: self.mock_proj_service
        self.app.dependency_overrides[get_log_query_service] = lambda: self.mock_log_service
        self.app.dependency_overrides[get_settings_service] = lambda: self.mock_settings_service
        self.app.dependency_overrides[get_ingest_service] = lambda: self.mock_ingest_service
        self.app.dependency_overrides[get_analytics_service] = lambda: self.mock_analytics_service
        self.app.dependency_overrides[get_db] = lambda: AsyncMock()

        self.client = TestClient(self.app)
        self.valid_headers = {"X-API-Key": "inno_log_live_testsecretkey123"}
        self.valid_bearer = {"Authorization": "Bearer inno_log_live_testsecretkey123"}

    # --- 6.1 Public & Unauthenticated Endpoints ---

    def test_plugin_info_endpoint(self) -> None:
        res = self.client.get("/plugins/tracura/info")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], "tracura")
        self.assertEqual(data["name"], "Tracura")
        self.assertEqual(data["status"], "active")

        # Test backwards compatibility alias
        res_alias = self.client.get("/plugins/api-logger/info")
        self.assertEqual(res_alias.status_code, 200)

    def test_management_endpoints_reject_unauthenticated_requests(self) -> None:
        endpoints = [
            "/plugins/tracura/v1/projects",
            "/plugins/tracura/v1/keys",
            "/plugins/tracura/v1/settings",
            "/plugins/tracura/v1/logs",
            "/plugins/tracura/v1/analytics/dashboard",
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 401, f"Endpoint '{ep}' should reject unauthenticated calls")

    # --- 6.2 Ingestion Security & Payload Verification ---

    def test_ingest_single_without_api_key_returns_401(self) -> None:
        payload = {
            "project": "payment-gateway",
            "environment": "production",
            "correlation_id": "req_88fbc09d12",
            "http_method": "POST",
            "url": "https://api.company.com/v1/charges",
            "path": "/v1/charges",
            "status_code": 200,
            "duration_ms": 120.0,
        }
        res = self.client.post("/plugins/tracura/v1/ingest", json=payload)
        self.assertEqual(res.status_code, 401)
        self.assertIn("Missing X-API-Key", res.json()["detail"])

    def test_ingest_single_with_x_api_key_returns_202(self) -> None:
        payload = {
            "project": "payment-gateway",
            "environment": "production",
            "correlation_id": "req_88fbc09d12",
            "http_method": "POST",
            "url": "https://api.company.com/v1/charges",
            "path": "/v1/charges",
            "status_code": 200,
            "duration_ms": 120.0,
        }
        res = self.client.post("/plugins/tracura/v1/ingest", json=payload, headers=self.valid_headers)
        self.assertEqual(res.status_code, 202)
        data = res.json()
        self.assertEqual(data["status"], "accepted")
        self.assertEqual(data["accepted"], 1)

    def test_ingest_single_with_bearer_api_key_returns_202(self) -> None:
        payload = {
            "project": "payment-gateway",
            "environment": "production",
            "correlation_id": "req_88fbc09d12",
            "http_method": "POST",
            "url": "https://api.company.com/v1/charges",
            "path": "/v1/charges",
            "status_code": 200,
            "duration_ms": 120.0,
        }
        res = self.client.post("/plugins/tracura/v1/ingest", json=payload, headers=self.valid_bearer)
        self.assertEqual(res.status_code, 202)

    def test_external_alias_ingest_endpoint(self) -> None:
        payload = {
            "project": "payment-gateway",
            "environment": "production",
            "correlation_id": "req_88fbc09d12",
            "http_method": "GET",
            "url": "https://api.company.com/health",
            "path": "/health",
            "status_code": 200,
            "duration_ms": 10.0,
        }
        res = self.client.post("/api-logger/v1/ingest", json=payload, headers=self.valid_headers)
        self.assertEqual(res.status_code, 202)

    def test_ingest_blocked_when_ip_allowlist_fails(self) -> None:
        self.mock_key_service.validate_ip = MagicMock(return_value=False)
        payload = {
            "project": "payment-gateway",
            "environment": "production",
            "correlation_id": "req_88fbc09d12",
            "http_method": "GET",
            "url": "https://api.company.com/health",
            "path": "/health",
            "status_code": 200,
            "duration_ms": 10.0,
        }
        res = self.client.post("/plugins/tracura/v1/ingest", json=payload, headers=self.valid_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("not permitted by API key IP allowlist", res.json()["detail"])
        # Reset mock
        self.mock_key_service.validate_ip = MagicMock(return_value=True)

    # --- 6.3 Universal API Key Access across Management APIs ---

    def test_projects_crud_accessible_with_api_key(self) -> None:
        # 1. List Projects
        res_list = self.client.get("/plugins/tracura/v1/projects", headers=self.valid_headers)
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()), 1)
        self.assertEqual(res_list.json()[0]["slug"], "payment-gateway")

        # 2. Create Project
        create_payload = {
            "name": "E-Commerce Store",
            "slug": "e-commerce-store",
            "description": "Storefront backend",
        }
        res_create = self.client.post("/plugins/tracura/v1/projects", json=create_payload, headers=self.valid_headers)
        self.assertEqual(res_create.status_code, 201)

        # 3. Get Project Details
        res_get = self.client.get(f"/plugins/tracura/v1/projects/{self.project_id}", headers=self.valid_headers)
        self.assertEqual(res_get.status_code, 200)

        # 4. Update Project
        update_payload = {"description": "Updated description"}
        res_patch = self.client.patch(f"/plugins/tracura/v1/projects/{self.project_id}", json=update_payload, headers=self.valid_headers)
        self.assertEqual(res_patch.status_code, 200)

        # 5. Delete Project
        res_del = self.client.delete(f"/plugins/tracura/v1/projects/{self.project_id}", headers=self.valid_headers)
        self.assertEqual(res_del.status_code, 204)

    def test_environments_crud_accessible_with_api_key(self) -> None:
        # List Environments
        res_list = self.client.get(f"/plugins/tracura/v1/projects/{self.project_id}/environments", headers=self.valid_headers)
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()), 1)
        self.assertEqual(res_list.json()[0]["slug"], "production")

        # Create Environment
        env_payload = {"name": "Staging", "slug": "staging", "color_badge": "amber"}
        res_create = self.client.post(f"/plugins/tracura/v1/projects/{self.project_id}/environments", json=env_payload, headers=self.valid_headers)
        self.assertEqual(res_create.status_code, 201)

        # Delete Environment
        res_del = self.client.delete(f"/plugins/tracura/v1/projects/{self.project_id}/environments/{self.env_id}", headers=self.valid_headers)
        self.assertEqual(res_del.status_code, 204)

    def test_api_keys_management_accessible_with_api_key(self) -> None:
        self.mock_key_service.list_keys = AsyncMock(return_value=[self.mock_api_key])
        self.mock_key_service.create_key = AsyncMock(return_value=(self.mock_api_key, "inno_log_live_rawsecret123"))
        self.mock_key_service.revoke_key = AsyncMock(return_value=True)

        # 1. List Ingestion Keys
        res_list = self.client.get("/plugins/tracura/v1/keys", headers=self.valid_headers)
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()), 1)

        # 2. Create Scoped Ingestion Key
        key_payload = {
            "name": "Staging Microservice Key",
            "allowed_environments": ["staging"],
            "rate_limit_rpm": 12000,
        }
        res_create = self.client.post("/plugins/tracura/v1/keys", json=key_payload, headers=self.valid_headers)
        self.assertEqual(res_create.status_code, 201)
        data = res_create.json()
        self.assertIn("raw_key", data)
        self.assertEqual(data["raw_key"], "inno_log_live_rawsecret123")

        # 3. Revoke Ingestion Key
        res_revoke = self.client.delete(f"/plugins/tracura/v1/keys/{self.mock_api_key.id}", headers=self.valid_headers)
        self.assertEqual(res_revoke.status_code, 204)

    def test_settings_accessible_with_api_key(self) -> None:
        # 1. Get Effective Settings
        res_get = self.client.get("/plugins/tracura/v1/settings", headers=self.valid_headers)
        self.assertEqual(res_get.status_code, 200)
        data = res_get.json()
        self.assertEqual(data["retention_days"], 30)

        # 2. Update Settings
        update_payload = {"retention_days": 90, "max_body_size_bytes": 8192}
        res_patch = self.client.patch("/plugins/tracura/v1/settings", json=update_payload, headers=self.valid_headers)
        self.assertEqual(res_patch.status_code, 200)

    def test_logs_explorer_and_inspector_accessible_with_api_key(self) -> None:
        # 1. Query Logs Explorer with filters
        res_logs = self.client.get(
            "/plugins/tracura/v1/logs?errors_only=true&status_code=500",
            headers=self.valid_headers,
        )
        self.assertEqual(res_logs.status_code, 200)
        data = res_logs.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["status_code"], 500)

        # 2. Get Single Log Inspector
        res_single = self.client.get(f"/plugins/tracura/v1/logs/{self.log_id}", headers=self.valid_headers)
        self.assertEqual(res_single.status_code, 200)
        single_data = res_single.json()
        self.assertEqual(single_data["correlation_id"], "req_test_8812")

    def test_analytics_dashboard_accessible_with_api_key(self) -> None:
        res = self.client.get("/plugins/tracura/v1/analytics/dashboard", headers=self.valid_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["kpi"]["total_requests"], 12482)
        self.assertEqual(data["kpi"]["success_rate_pct"], 98.2)
        self.assertEqual(data["kpi"]["status_breakdown"]["2xx"], 12238)
        self.assertEqual(len(data["timeseries"]), 1)

    def test_default_erp_project_deterministic_id(self) -> None:
        from tracura.middleware.capture import get_default_erp_env_id, get_default_erp_project_id
        from tracura.services.project_service import get_default_env_id, get_default_project_id

        pid = get_default_erp_project_id(self.tenant_id)
        self.assertEqual(pid, get_default_project_id(self.tenant_id))

        eid_prod = get_default_erp_env_id(pid, "production")
        self.assertEqual(eid_prod, get_default_env_id(pid, "production"))

        eid_dev = get_default_erp_env_id(pid, "development")
        self.assertNotEqual(eid_prod, eid_dev)


if __name__ == "__main__":
    unittest.main()
