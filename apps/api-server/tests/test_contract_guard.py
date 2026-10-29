"""Undocumented-status guard and Request Example Executability test suite (Prompt 04).

Guards:
1. Undocumented-status guard: verifies that every operation in the application responds
   only with HTTP status codes and response bodies explicitly declared in its OpenAPI specification.
2. Example executability: extracts every requestBody and parameter example from the OpenAPI spec,
   dispatches it against the application, and verifies that it produces a documented response.
"""

from datetime import datetime, timezone
from pathlib import Path
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock
import uuid

app_root = Path(__file__).resolve().parents[1]
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from fastapi.testclient import TestClient

from app.main import app
from kernel.auth.dependencies import get_current_user, get_user_service
from kernel.auth.router import get_api_key_service, get_auth_service
from kernel.auth.schemas import (
    ApiKeyRead,
    ForgotPasswordResponse,
    MessageResponse,
    RefreshTokenResponse,
    TokenResponse,
)
from kernel.core.database import get_db
from kernel.core.security.jwt import create_access_token
from kernel.setup.dependencies import is_installed_cached, require_setup_available, require_setup_token
from kernel.setup.router import get_service as get_setup_service
from kernel.setup.schemas import SetupChecks, SetupResult, SetupStatus
from kernel.tenancy.models import Tenant
from kernel.tenancy.router import (
    get_current_tenant_id,
    get_current_user_dep,
    get_service as get_tenancy_service,
    require_super_admin_dep,
)
from kernel.tenancy.schemas import TenantRead
from kernel.user.models.user import User, UserStatus
from kernel.user.router import (
    get_current_user_dep as user_get_current_user_dep,
    get_service as get_user_svc,
)
from kernel.user.schemas import UserRead
from tests.contract_utils import get_spec, validate_response_contract


class TestContractGuard(unittest.TestCase):
    """Guards asserting all runtime responses adhere to the OpenAPI specification."""

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.spec = get_spec()
        self.user_id = uuid.UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        self.tenant_id = uuid.UUID("3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f")
        self.now = datetime.now(timezone.utc)

        self.mock_user = User(
            id=self.user_id,
            first_name="Priya",
            last_name="Shah",
            email_hash="hash",
            email_encrypted="enc",
            password_hash="pass",
            status=UserStatus.ACTIVE,
            is_super_admin=True,
            token_version=1,
            created_at=self.now,
            updated_at=self.now,
        )

        self.mock_user_read = UserRead(
            id=self.user_id,
            first_name="Priya",
            last_name="Shah",
            email="priya.shah@northwind.example",
            status=UserStatus.ACTIVE,
            is_super_admin=True,
            token_version=1,
            created_at=self.now,
            updated_at=self.now,
        )

        self.mock_tenant = Tenant(
            id=self.tenant_id,
            name="Northwind Traders Pvt Ltd",
            slug="northwind-traders",
            country="IN",
            timezone="Asia/Kolkata",
            language="en-IN",
            date_format="DD/MM/YYYY",
            created_at=self.now,
            updated_at=self.now,
        )

        async def fake_db():
            session = MagicMock()
            session.commit = AsyncMock()
            session.rollback = AsyncMock()
            session.flush = AsyncMock()
            lookup = MagicMock()
            lookup.scalar_one_or_none.return_value = None
            lookup.scalars.return_value.all.return_value = []
            session.execute = AsyncMock(return_value=lookup)
            yield session

        app.dependency_overrides[get_db] = fake_db

        async def fake_current_user():
            return self.mock_user

        async def fake_super_admin():
            return self.mock_user

        async def fake_tenant_id():
            return self.tenant_id

        app.dependency_overrides[get_current_user] = fake_current_user
        app.dependency_overrides[get_current_user_dep] = fake_current_user
        app.dependency_overrides[user_get_current_user_dep] = fake_current_user
        app.dependency_overrides[require_super_admin_dep] = fake_super_admin
        app.dependency_overrides[get_current_tenant_id] = fake_tenant_id

        # Setup service overrides
        mock_setup = MagicMock()
        mock_setup.session = MagicMock()
        mock_setup.session.commit = AsyncMock()
        mock_setup.checks = AsyncMock(return_value=SetupChecks(database_connected=True, migrations_pending=0))
        mock_setup.install = AsyncMock(
            return_value=SetupResult(
                tenant=TenantRead(
                    id=self.tenant_id,
                    name="Northwind Traders Pvt Ltd",
                    slug="northwind-traders",
                    country="IN",
                    created_at=self.now,
                    updated_at=self.now,
                ),
                admin=self.mock_user_read,
                installed_at=self.now,
            )
        )
        app.dependency_overrides[get_setup_service] = lambda: mock_setup
        app.dependency_overrides[require_setup_available] = lambda: None
        app.dependency_overrides[require_setup_token] = lambda: "inno_setup_secret_token_123"
        async def fake_installed():
            return False

        app.dependency_overrides[is_installed_cached] = fake_installed

        # Auth service overrides
        mock_auth = MagicMock()
        mock_auth.login = AsyncMock(
            return_value=TokenResponse(
                access_token="sample_jwt",
                refresh_token="rt_sample",
                token_type="bearer",
                expires_in=1800,
                must_change_password=False,
                user=self.mock_user_read,
            )
        )
        mock_auth.refresh_token = AsyncMock(
            return_value=RefreshTokenResponse(
                access_token="sample_jwt",
                refresh_token="rt_sample",
                token_type="bearer",
                expires_in=1800,
            )
        )
        mock_auth.forgot_password = AsyncMock(return_value=ForgotPasswordResponse())
        mock_auth.reset_password = AsyncMock(return_value=MessageResponse(message="Reset."))
        mock_auth.change_password = AsyncMock(return_value=MessageResponse(message="Changed."))
        mock_auth.logout = AsyncMock(return_value=MessageResponse(message="Logged out."))
        app.dependency_overrides[get_auth_service] = lambda: mock_auth

        # API key service overrides
        mock_api_key = MagicMock()
        mock_key_read = ApiKeyRead(
            id=uuid.uuid4(),
            name="Northwind Key",
            key_prefix="inno_live_test",
            scopes=["*"],
            expires_at=None,
            last_used_at=None,
            is_revoked=False,
            created_at=self.now,
        )
        mock_api_key.create_api_key = AsyncMock(return_value=(mock_key_read, "secret"))
        mock_api_key.list_api_keys = AsyncMock(return_value=[mock_key_read])
        mock_api_key.revoke_api_key = AsyncMock(return_value=mock_key_read)
        app.dependency_overrides[get_api_key_service] = lambda: mock_api_key

        # User service overrides
        mock_user_svc = MagicMock()
        mock_user_svc.get_by_id = AsyncMock(return_value=self.mock_user)
        mock_user_svc.to_user_read = MagicMock(return_value=self.mock_user_read)
        mock_user_svc.create_user = AsyncMock(return_value=self.mock_user)
        app.dependency_overrides[get_user_service] = lambda: mock_user_svc
        app.dependency_overrides[get_user_svc] = lambda: mock_user_svc

        # Tenancy service overrides
        mock_tenancy = MagicMock()
        mock_tenancy.create = AsyncMock(return_value=self.mock_tenant)
        mock_tenancy.get = AsyncMock(return_value=self.mock_tenant)
        mock_tenancy.update = AsyncMock(return_value=self.mock_tenant)
        mock_tenancy.delete = AsyncMock(return_value=self.mock_tenant)
        mock_tenancy.soft_delete = AsyncMock(return_value=self.mock_tenant)
        mock_tenancy.restore = AsyncMock(return_value=self.mock_tenant)
        mock_tenancy.list = AsyncMock(return_value=([self.mock_tenant], 1))
        app.dependency_overrides[get_tenancy_service] = lambda: mock_tenancy

        self.token = create_access_token({"sub": str(self.user_id), "type": "access", "token_version": 1})
        self.auth_headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Setup-Token": "inno_setup_secret_token_123",
            "X-Tenant-ID": str(self.tenant_id),
        }

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    # --- 1. Undocumented-Status Guard ---

    def test_guard__all_operations_return_documented_statuses(self) -> None:
        """Asserts every route returns status codes explicitly declared in its OpenAPI specification."""
        paths = self.spec.get("paths", {})
        self.assertGreater(len(paths), 0)

        for path_pattern, methods in paths.items():
            for method, op in methods.items():
                if method.lower() not in ("get", "post", "patch", "delete", "put"):
                    continue

                documented_codes = set(op.get("responses", {}).keys())
                resolved_path = (
                    path_pattern
                    .replace("{tenant_id}", str(self.tenant_id))
                    .replace("{user_id}", str(self.user_id))
                    .replace("{key_id}", str(uuid.uuid4()))
                    .replace("{module_id}", "hrms")
                    .replace("{plugin_id}", "api-logger")
                )

                # Send standard request
                res = self.client.request(
                    method=method.upper(),
                    url=resolved_path,
                    headers=self.auth_headers,
                    json={},
                )

                status_code_str = str(res.status_code)
                self.assertIn(
                    status_code_str,
                    documented_codes,
                    f"Operation {op.get('operationId')} at {method.upper()} {resolved_path} "
                    f"returned undocumented HTTP status code {res.status_code}. "
                    f"Documented statuses: {sorted(list(documented_codes))}"
                )
                validate_response_contract(res.json(), path_pattern, method, res.status_code)

    # --- 2. Request Example Executability ---

    def test_guard__all_request_examples_execute_successfully(self) -> None:
        """Extracts and executes every request body example from OpenAPI, asserting documented success."""
        paths = self.spec.get("paths", {})

        for path_pattern, methods in paths.items():
            for method, op in methods.items():
                req_body = op.get("requestBody", {})
                content = req_body.get("content", {}).get("application/json", {})
                examples_dict = content.get("examples", {})

                for ex_name, ex_obj in examples_dict.items():
                    sample_payload = ex_obj.get("value")
                    if sample_payload is None:
                        continue

                    resolved_path = (
                        path_pattern
                        .replace("{tenant_id}", str(self.tenant_id))
                        .replace("{user_id}", str(self.user_id))
                        .replace("{key_id}", str(uuid.uuid4()))
                        .replace("{module_id}", "hrms")
                        .replace("{plugin_id}", "api-logger")
                    )

                    res = self.client.request(
                        method=method.upper(),
                        url=resolved_path,
                        headers=self.auth_headers,
                        json=sample_payload,
                    )

                    success_codes = {c for c in op.get("responses", {}).keys() if c.startswith("2")}
                    self.assertIn(
                        str(res.status_code),
                        success_codes,
                        f"Request example '{ex_name}' for {op.get('operationId')} at {method.upper()} {resolved_path} "
                        f"failed with HTTP {res.status_code}: {res.text}. Expected one of {success_codes}"
                    )
                    validate_response_contract(res.json(), path_pattern, method, res.status_code)


if __name__ == "__main__":
    unittest.main()
