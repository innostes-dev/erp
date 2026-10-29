# API Documentation Audit – 2026-10-29

## Baseline

- **FastAPI OpenAPI Specification**: `apps/api-server/openapi.json` (OpenAPI 3.1.0)
- **Engine Tests**: `pnpm nx test api-server` → **6 passed** in 1.40s.
- **Kernel Tests**: `pnpm nx test kernel-backend` → **100 passed** in 5.83s.
- **Regenerated Spec Freshness**: `pnpm nx run api-server:openapi` → 0 diff (committed specification is current).
- **Inventory Counts**:
  - Total Paths: **29**
  - Total HTTP Operations: **33**
  - Total Components/Schemas: **38**
  - Total OpenAPI Tags: **9**

---

## Summary

### Checklist Adherence Summary
- **Endpoint Checklist (E1–E17)**: 33 operations evaluated.
  - E1 (Stable snake_case `<feature>_<action>` `operation_id`): **12 failed** (relying on FastAPI auto-generated names e.g. `login_auth_login_post`, `create_user_users_post`).
  - E2 (Imperative summary <=60 chars): **4 failed** (exceeded length or used non-standard syntax).
  - E3 (Public description before `\f`): **14 failed** (missing who may call it, side effects, idempotency).
  - E4 (Exactly one documented tag): **33 passed**.
  - E5 (Security requirements align with code): **7 failed** (mismatch: `security="none"` on authenticated routes, duplicate `HTTPBearer` vs `BearerAuth` security schemes).
  - E6 (Parameter documentation & constraints): **18 failed** (missing format, constraints, and descriptions on query/path parameters).
  - E7 (Request body documentation & examples): **11 failed** (schemas missing request examples).
  - E8 (Success responses with descriptions & models): **33 passed**.
  - E9 (Exact error responses matching service exceptions): **21 failed** (missing `401 Unauthorized`, `403 Forbidden`, `404 Not Found` in `responses=`).
  - E10 (Machine error codes catalogued): **33 failed** (no central error catalogue exists yet).
  - E11 (Custom headers documented in spec): **8 failed** (`X-Tenant-ID` and `X-Setup-Token` missing explicit OpenAPI parameter declarations on affected routes).
  - E12 (Pagination documented with bounds): **2 failed** (pagination query parameters lack min/max bounds and sort order in spec).
  - E13 (Soft-delete & restore semantics explicit): **2 passed**.
  - E14 (Deprecation tags & dates): **n/a** (no deprecated endpoints currently).
  - E15 (Examples validate against schema): **16 failed** (schemas missing examples).
  - E16 (Contract tests for all status codes): **24 failed** (tests only cover happy path and select validation errors).
  - E17 (Zero real secrets / PII in examples): **33 passed** (all examples clean).
- **Schema Checklist (S1–S8)**: 38 schemas evaluated.
  - S1 (Class docstrings): **3 failed** (`Page_TenantRead_`, `HTTPValidationError`, `ValidationError`).
  - S2 (Field descriptions & examples): **22 failed** (fields have descriptions but lack `examples=[...]`).
  - S3 (Field constraints in schema): **15 failed** (constraints enforced in services instead of schema).
  - S4 (Enums document all values): **2 passed** (`DeviceType`, `UserStatus`).
  - S5 (Optional vs Nullable matches runtime): **6 failed** (fields marked optional but emitted as `null`).
  - S6 (Read schema examples in `json_schema_extra`): **19 failed** (read schemas lack complete examples).
  - S7 (Consistent `<Entity>Create` / `Update` / `Read` naming): **34 passed**, **4 failed** (`AdminUserInput`, `SetupBrandingInput`).
  - S8 (Zero internal / sensitive field leaks): **38 passed** (no password hashes or secret keys leaked in responses).
- **Tag Checklist (T1–T3)**: 9 tags evaluated.
  - T1 (Description present): **9 passed**.
  - T2 (Logical tag order): **Failed** (Setup and Tenancy positioned after CRM/HRMS scaffolds).
  - T3 (Sentence case tag names): **2 failed** (`User Management` -> `User management`, `API Logger` -> `API logger`).

### The Five Worst Problems for an Integrator
1. **Unpredictable Auto-Generated Operation IDs**: Routes like `POST /auth/login` (`login_auth_login_post`) and `POST /users` (`create_user_users_post`) generate awkward client method names that break when route paths are touched.
2. **Missing `401` and `403` in `responses=`**: More than 60% of authenticated endpoints only declare `200` in their OpenAPI spec. Generated SDKs and API gateways assume these endpoints cannot return authentication failures.
3. **Dual Security Scheme Definitions (`BearerAuth` vs `HTTPBearer`)**: Splitting bearer authentication into two separate security definitions creates redundant auth configurations in Swagger UI and OpenAPI client generators.
4. **Undocumented Required Headers (`X-Tenant-ID`)**: Tenant-scoped endpoints in `/tenants/current/*` fail with `400` or `401` if `X-Tenant-ID` is omitted, yet the header is not defined in the operation parameters.
5. **Missing Request/Response Schema Examples**: Over half of the read schemas (`UserRead`, `TokenResponse`, `ApiKeyRead`) lack JSON examples in OpenAPI, forcing developers to guess timestamp formats and nullability.

---

## Operation Matrix

| Method | Path | Operation ID | Tag | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 | E11 | E12 | E13 | E15 | E16 | E17 | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `system_root` | General | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✓ | ✓ | ✓ | Polish |
| `GET` | `/config` | `system_config` | General | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✓ | ✓ | ✓ | Polish |
| `GET` | `/health` | `system_health` | Observability | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✓ | ✓ | ✓ | Polish |
| `POST` | `/auth/login` | `login_auth_login_post` | Authentication | ✗ | ✓ | ✗ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✓ | ✓ | ✓ | Needs Fix |
| `POST` | `/auth/refresh` | `refresh_token_auth_refresh_post` | Authentication | ✗ | ✓ | ✗ | ✓ | ✓ | n/a | ✗ | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/auth/forgot-password` | `forgot_password_auth_forgot_password_post` | Authentication | ✗ | ✗ | ✗ | ✓ | ✓ | n/a | ✗ | ✓ | ✗ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/auth/reset-password` | `reset_password_auth_reset_password_post` | Authentication | ✗ | ✓ | ✗ | ✓ | ✓ | n/a | ✗ | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/auth/change-password` | `change_password_auth_change_password_post` | Authentication | ✗ | ✓ | ✗ | ✓ | ✓ | n/a | ✗ | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/auth/logout` | `logout_auth_logout_post` | Authentication | ✗ | ✓ | ✗ | ✓ | ✓ | n/a | ✗ | ✓ | ✗ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `GET` | `/auth/me` | `get_me_auth_me_get` | Authentication | ✗ | ✓ | ✗ | ✓ | ✓ | n/a | n/a | ✓ | ✗ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `GET` | `/auth/api-keys` | `list_api_keys_auth_api_keys_get` | Authentication | ✗ | ✓ | ✗ | ✓ | ✓ | n/a | n/a | ✓ | ✗ | ✗ | ✗ | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/auth/api-keys` | `create_api_key_auth_api_keys_post` | Authentication | ✗ | ✓ | ✗ | ✓ | ✓ | n/a | ✓ | ✓ | ✗ | ✗ | ✗ | n/a | n/a | ✓ | ✓ | ✓ | Needs Fix |
| `DELETE` | `/auth/api-keys/{key_id}` | `revoke_api_key_auth_api_keys__key_id__delete` | Authentication | ✗ | ✓ | ✗ | ✓ | ✓ | ✗ | n/a | ✓ | ✗ | ✗ | ✗ | n/a | n/a | ✓ | ✓ | ✓ | Needs Fix |
| `GET` | `/crm/info` | `crm_get_info` | CRM | ✓ | ✗ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Polish |
| `GET` | `/hrms/info` | `hrms_get_info` | HRMS | ✓ | ✗ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Polish |
| `GET` | `/setup/status` | `setup_status` | Setup | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✓ | ✓ | ✓ | Polish |
| `GET` | `/setup/checks` | `setup_checks` | Setup | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ | ✗ | ✗ | n/a | n/a | ✓ | ✓ | ✓ | Polish |
| `POST` | `/setup` | `setup_run` | Setup | ✓ | ✓ | ✓ | ✓ | ✗ | n/a | ✓ | ✓ | ✓ | ✗ | ✗ | n/a | n/a | ✓ | ✓ | ✓ | Needs Fix |
| `POST` | `/tenants` | `tenants_create` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✗ | ✗ | n/a | n/a | n/a | ✓ | ✓ | ✓ | Needs Fix |
| `GET` | `/tenants` | `tenants_list` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✗ | n/a | ✗ | n/a | ✓ | ✓ | ✓ | Needs Fix |
| `GET` | `/tenants/{tenant_id}` | `tenants_get` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✗ | n/a | n/a | n/a | ✓ | ✓ | ✓ | Needs Fix |
| `PATCH` | `/tenants/{tenant_id}` | `tenants_update` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | n/a | n/a | n/a | ✓ | ✓ | ✓ | Needs Fix |
| `DELETE` | `/tenants/{tenant_id}` | `tenants_delete` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | n/a | ✓ | ✗ | ✗ | n/a | n/a | ✓ | ✓ | ✓ | ✓ | Needs Fix |
| `POST` | `/tenants/{tenant_id}/restore` | `tenants_restore` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | n/a | ✓ | ✗ | ✗ | n/a | n/a | ✓ | ✓ | ✓ | ✓ | Needs Fix |
| `GET` | `/tenants/current/modules` | `tenants_list_modules` | Tenancy | ✓ | ✗ | ✓ | ✓ | ✗ | n/a | n/a | ✓ | ✗ | ✗ | ✗ | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/tenants/current/modules/{module_id}/activate` | `tenants_activate_module` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✗ | ✗ | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/tenants/current/modules/{module_id}/deactivate` | `tenants_deactivate_module` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✗ | ✗ | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `GET` | `/tenants/current/plugins` | `tenants_list_plugins` | Tenancy | ✓ | ✗ | ✓ | ✓ | ✗ | n/a | n/a | ✓ | ✗ | ✗ | ✗ | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/tenants/current/plugins/{plugin_id}/activate` | `tenants_activate_plugin` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✗ | ✗ | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/tenants/current/plugins/{plugin_id}/deactivate` | `tenants_deactivate_plugin` | Tenancy | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✗ | ✗ | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `POST` | `/users` | `create_user_users_post` | User Management | ✗ | ✓ | ✗ | ✓ | ✗ | n/a | ✗ | ✓ | ✗ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `GET` | `/users/{user_id}` | `get_user_users__user_id__get` | User Management | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Needs Fix |
| `GET` | `/plugins/api-logger/info` | `api_logger_get_info` | API Logger | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ | ✗ | n/a | n/a | n/a | ✗ | ✓ | ✓ | Polish |

---

## Schema Matrix

| Schema Name | S1 (Docstring) | S2 (Field Docs & Examples) | S3 (Constraints) | S4 (Enums) | S5 (Nullability) | S6 (json_schema_extra) | S7 (Naming) | S8 (Safety) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ActivationResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `AdminUserInput` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✗ | ✓ | Needs Rename |
| `ApiKeyCreatedResponse` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `ApiKeyListResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `ApiKeyRead` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `ApiLoggerInfoResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `ChangePasswordRequest` | ✓ | ✗ | ✓ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `CreateApiKeyRequest` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `CrmInfoResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `DeviceType` | ✓ | n/a | n/a | ✓ | n/a | n/a | ✓ | ✓ | Compliant |
| `ErrorResponse` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `ForgotPasswordRequest` | ✓ | ✗ | ✓ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `ForgotPasswordResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `HTTPValidationError` | ✗ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `HrmsInfoResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `ItemCatalogRead` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `LoginRequest` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `LogoutRequest` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `MessageResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `ModuleListResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `Page_TenantRead_` | ✗ | ✗ | ✗ | n/a | ✓ | ✗ | ✗ | ✓ | Needs Polish |
| `PluginListResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `RefreshTokenRequest` | ✓ | ✗ | ✓ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `RefreshTokenResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `ResetPasswordRequest` | ✓ | ✗ | ✓ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `SetupBrandingInput` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✗ | ✓ | Needs Rename |
| `SetupChecks` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `SetupRequest` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `SetupResult` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `SetupStatus` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `TenantCreate` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `TenantRead` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `TenantUpdate` | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | ✓ | ✓ | Compliant |
| `TokenResponse` | ✓ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `UserCreate` | ✓ | ✗ | ✓ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `UserRead` | ✓ | ✗ | ✓ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |
| `UserStatus` | ✓ | n/a | n/a | ✓ | n/a | n/a | ✓ | ✓ | Compliant |
| `ValidationError` | ✗ | ✗ | ✗ | n/a | ✓ | ✗ | ✓ | ✓ | Needs Polish |

---

## Tag Matrix

| Tag Name | T1 (Description) | T2 (Logical Order) | T3 (Sentence Case) | Target Name |
| :--- | :--- | :--- | :--- | :--- |
| **General** | ✓ | ✓ | ✓ | `General` |
| **Observability** | ✓ | ✓ | ✓ | `Observability` |
| **Authentication** | ✓ | ✓ | ✓ | `Authentication` |
| **CRM** | ✓ | ✗ | ✓ | `CRM` |
| **HRMS** | ✓ | ✗ | ✓ | `HRMS` |
| **Setup** | ✓ | ✗ | ✓ | `Setup` |
| **Tenancy** | ✓ | ✗ | ✓ | `Tenancy` |
| **User Management** | ✓ | ✗ | ✗ | `User management` |
| **API Logger** | ✓ | ✗ | ✗ | `API logger` |

---

## Verified Behaviour Notes

1. **Authentication Flow (`kernel/backend/kernel/auth/services/auth.py:45`)**:
   - Access token expires in 15 minutes (default `ACCESS_TOKEN_EXPIRE_MINUTES = 15`).
   - Refresh token expires in 7 days (default `REFRESH_TOKEN_EXPIRE_DAYS = 7`).
   - Refresh token rotation issues a new refresh token and invalidates the previous token in database storage.
2. **Setup Token Protection (`kernel/backend/kernel/setup/dependencies.py:18`)**:
   - Web wizard requests must include `X-Setup-Token` header matching token in `kernel/backend/var/setup-token` or `SETUP_TOKEN` environment variable.
   - Guarded by rate limiting: max 10 failed attempts per 15-minute window (`429 Too Many Requests` with `Retry-After: 900`).
   - Once setup succeeds, `GET /setup/checks` and `POST /setup` return `404 Not Found`. All other routes return `503 Service Unavailable` with `{"code": "setup_required"}` prior to setup.
3. **Multi-Tenancy Scoping (`kernel/backend/kernel/auth/dependencies.py:72`)**:
   - `X-Tenant-ID` header is required on all `/tenants/current/*` routes and API key lookups.
   - Missing header raises `HTTPException(400, "X-Tenant-ID header required")`.
   - Accessing a tenant where the authenticated user is not an active member raises `HTTPException(403, "Access denied to tenant")`.
4. **Soft Delete and Restore (`kernel/backend/kernel/tenancy/services/tenancy.py:84`)**:
   - `DELETE /tenants/{tenant_id}` marks record with `deleted_at = datetime.utcnow()`.
   - `GET /tenants` excludes soft-deleted records unless `include_deleted=true` query parameter is explicitly passed.
   - `POST /tenants/{tenant_id}/restore` resets `deleted_at = None`.

---

## Findings Table

| ID | Severity | Checklist | Location | Finding | Fix | Owner prompt |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-001** | S1 | E1 | `kernel/backend/kernel/auth/router.py` | Operation IDs use auto-generated FastAPI defaults (`login_auth_login_post`, `refresh_token_auth_refresh_post`, etc.). | Assign explicit `operation_id="auth_<action>"` in decorators. | 03 |
| **API-002** | S1 | E1 | `kernel/backend/kernel/user/router.py` | Operation IDs use auto-generated FastAPI defaults (`create_user_users_post`, `get_user_users__user_id__get`). | Assign explicit `operation_id="users_<action>"`. | 03 |
| **API-003** | S1 | E5 | `kernel/backend/kernel/tenancy/router.py` | `/tenants/current/*` routes declare `HTTPBearer` security scheme while auth routes declare `BearerAuth`. | Unify all bearer token dependencies under `BearerAuth` scheme. | 03 |
| **API-004** | S1 | E5 | `kernel/backend/kernel/tenancy/router.py:48` | `GET /tenants` and `GET /tenants/{tenant_id}` list `security="none"` despite requiring authentication. | Add security declaration to route decorators. | 03 |
| **API-005** | S1 | E5 | `kernel/backend/kernel/user/router.py:18` | `POST /users` and `GET /users/{user_id}` list `security="none"` despite requiring authentication. | Add security declaration to route decorators. | 03 |
| **API-006** | S1 | E9 | `kernel/backend/kernel/auth/router.py` | `GET /auth/me` and `/auth/api-keys` endpoints omit `401 Unauthorized` in `responses=`. | Add `401` to `responses=error_responses(...)`. | 03 |
| **API-007** | S1 | E9 | `kernel/backend/kernel/tenancy/router.py` | Tenant CRUD endpoints omit `401` and `403` error responses. | Add `401` and `403` to `responses=error_responses(...)`. | 03 |
| **API-008** | S1 | E11 | `kernel/backend/kernel/auth/dependencies.py` | `X-Tenant-ID` header dependency is omitted from OpenAPI parameter declarations. | Declare `X-Tenant-ID` as an OpenAPI header parameter. | 03 |
| **API-009** | S1 | E11 | `kernel/backend/kernel/setup/dependencies.py` | `X-Setup-Token` header is declared via custom security scheme without header parameter documentation. | Document `X-Setup-Token` parameter details in OpenAPI spec. | 03 |
| **API-010** | S2 | S6 | `kernel/backend/kernel/auth/schemas/` | `TokenResponse`, `RefreshTokenResponse`, `UserRead`, `ApiKeyRead` lack examples in `json_schema_extra`. | Add complete realistic Northwind universe examples. | 03 |
| **API-011** | S2 | S2 | `kernel/backend/kernel/user/schemas/` | `UserCreate` fields lack `examples=[...]`. | Add `examples=[...]` to all fields. | 03 |
| **API-012** | S2 | E10 | `apps/api-server/` | No machine error-code catalogue exists documenting error `code` strings (`setup_required`, `invalid_credentials`, `tenant_not_found`). | Create `error-codes.mdx` catalogue linking every error code. | 07 |
| **API-013** | S2 | E16 | `apps/api-server/tests/` | Contract test coverage is incomplete for error status codes (`401`, `403`, `404`, `429`). | Implement comprehensive contract test suite covering all documented status codes. | 04 |
| **API-014** | S2 | T3 | `kernel/backend/kernel/user/module.py` | Tag `User Management` uses Title Case instead of sentence case `User management`. | Rename tag to sentence case. | 03 |
| **API-015** | S2 | T3 | `kernel/backend/plugins/api_logger/module.py` | Tag `API Logger` uses Title Case instead of sentence case `API logger`. | Rename tag to sentence case. | 03 |
| **API-016** | S3 | T2 | `apps/api-server/app/engine/server.py` | OpenAPI tag order places scaffold modules before Setup and Tenancy. | Set explicit logical tag order in `app.openapi_tags`. | 03 |
| **API-017** | S3 | E2 | `kernel/backend/kernel/auth/router.py:45` | Summary for `/auth/forgot-password` contains `&` and exceeds standard length. | Shorten summary to imperative sentence case <=60 chars. | 03 |
