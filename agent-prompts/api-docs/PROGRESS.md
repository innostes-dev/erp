# Progress log

Each agent appends one entry, in the format from `STANDARDS.md` §8, at the bottom.

## 00 – Seed notes – 2026-10-28

Facts observed before the runbook started. Prompt 01 must verify them.

- The committed `apps/api-server/openapi.json` (OpenAPI 3.1.0, `info.version` 0.1.0) has 21
  operations across the tags General, Observability, Authentication, Setup, Tenancy and User
  Management. Tag casing is inconsistent with sentence case.
- There's no CI check that the committed spec matches the code (`.github/workflows/ci.yml` has no
  OpenAPI step).
- The API docs today are only FastAPI's Swagger UI (`/docs`) and ReDoc (`/redoc`) on the running
  server. The docs site (`apps/landing`) has no API reference. `content/dev-docs/apps/api-server.mdx`
  is a developer page, not a consumer page.
- The spec description says the bearer token is "optional and only used to record who made a
  change". Verify this per endpoint: `/auth/me`, `/auth/change-password` and `/auth/logout` must
  require authentication.
- Real behaviours that aren't documented as API contracts:
  - the `X-Tenant-ID` header
  - the setup-token header and its attempt limiting
  - refresh-token rotation
  - token lifetimes (access 30 minutes, refresh 7 days, reset link 60 minutes, temporary password
    24 hours by default)
  - CORS origins
  - `Retry-After`
- There's no URL versioning (`/v1`), no deprecation policy and no API changelog.
- The `user` module has models for roles and permissions (RBAC), devices and profiles. Check which
  have endpoints. Document only what's exposed.


## 01 – Audit – 2026-10-29

**Summary**: Completed exhaustive audit of the FastAPI HTTP API across all 33 endpoints, 38 schemas, and 9 tags. Scored all operations against E1–E17, schemas against S1–S8, and tags against T1–T3. Catalogued 17 discrete findings (API-001 through API-017) mapped to owner prompts 02–07 in `AUDIT.md`.

**Changed**:
- Created `agent-prompts/api-docs/AUDIT.md` (baseline metrics, checklist adherence summary, full operation matrix, schema matrix, tag matrix, verified runtime behaviour notes, and findings table).

**API changes**: none.

**Decisions**:
- Stay on `main` branch per continuous integration workflow.
- All auto-generated FastAPI `operation_id` values will be standardised to `<feature>_<action>` (e.g. `auth_login`, `users_create`).
- Unify bearer authentication under a single consistent `BearerAuth` scheme across all modules.
- Ensure all authenticated endpoints explicitly declare `401 Unauthorized` and `403 Forbidden` error responses.

**Verification**:
- `pnpm nx test api-server`: PASS (6 tests in 1.40s).
- `pnpm nx test kernel-backend`: PASS (100 tests in 5.83s).
- `pnpm nx run api-server:openapi`: PASS (0 diff against committed spec).

**Open issues**:
- Blocking: none.
- Non-blocking: Prompt 02 (Quality gates).

## 02 – Quality gates for the API spec – 2026-10-29

**Summary**: Implemented automated spec freshness and spec linting quality gates. Wired `api-server:openapi-check` and `api-server:openapi-lint` into Nx and GitHub Actions CI. Spectral OAS ruleset and custom Python checklist validator cover E1–E17, S1–S8, and T1–T3. Report-mode rules configured to track violations without breaking builds; all enforced rules pass.

**Changed**:
- Created `apps/api-server/scripts/check_openapi.py` & `apps/api-server/scripts/check-openapi.js` (freshness check with diff output).
- Created `apps/api-server/scripts/lint_openapi.py` & `apps/api-server/scripts/lint-openapi.js` (checklist validation and Spectral OAS execution).
- Created `apps/api-server/.spectral.yaml` (Spectral OAS rule configuration).
- Created `apps/api-server/openapi-lint-exceptions.yaml` (report-mode rule configuration and exceptions).
- Updated `apps/api-server/project.json` (added `openapi-check` and `openapi-lint` targets).
- Updated `.github/workflows/ci.yml` (added Python 3.11 setup, `api-server:install`, and quality gate targets).
- Updated `kernel/backend/README.md` (documented quality gate commands, modes, and exception process).

**Report-mode metrics (296 observations tracking toward prompt 10)**:
- `E1` (operation_id snake_case / uniqueness): 12 occurrences
- `E5` (explicit security declaration): 21 occurrences
- `E6` (parameter descriptions / UUID format): 10 occurrences
- `E9` (declared 401/422 responses): 15 occurrences
- `E11` (custom header declarations): 8 occurrences
- `S1` (schema docstrings): 3 occurrences
- `S2` (field descriptions and examples): 209 occurrences
- `S6` (read-schema json_schema_extra example): 15 occurrences
- `S7` (consistent schema naming): 1 occurrence
- `T3` (sentence case tag names): 2 occurrences

**Decisions**:
- Enforce strict rules (E4, E8, E14, E17, S4, S8, T1) immediately, failing if invalid tags, missing 2xx schemas, deprecated routes without replacement, or unsafe emails are introduced.
- Run remaining rules in report mode via `openapi-lint-exceptions.yaml`; prompt 03 will address these in code.

**Verification**:
- `pnpm nx run api-server:openapi-check`: PASS (spec is in sync with code).
- `pnpm nx run api-server:openapi-lint`: PASS (Spectral clean, 0 enforced defects, 296 report-mode observations).
- `pnpm nx test api-server`: PASS (6 tests in 1.35s).
- `pnpm nx test kernel-backend`: PASS (100 tests in 5.80s).

**Open issues**:
- Blocking: none.
- Non-blocking: none.

## 03 – Endpoint documentation in code – 2026-10-29

**Summary**: Completely overhauled in-code endpoint and schema documentation across all 33 operations and 38 schemas. Standardised operation IDs to `<feature>_<action>`, separated public callers from internal developer notes via `\f`, unified authentication under `BearerAuth`, documented header parameters (`X-Tenant-ID`, `X-Setup-Token`), updated tag names to sentence case, added field descriptions and Northwind universe examples to all schemas, and reduced report-mode lint observations from 296 to 0.

**Changed**:
- `apps/api-server/app/engine/server.py`: Standardised app metadata (title, version, description, contact, license, servers), defined schemas (`ServiceInfoRead`, `AppConfigRead`, `HealthCheckRead`), enforced canonical tag ordering, and registered custom OpenAPI generator.
- `kernel/backend/kernel/auth/router.py`: Assigned operation IDs (`auth_*`), formatted summaries, added `\f` split, configured explicit security, added 401/422 error responses.
- `kernel/backend/kernel/auth/schemas/`: Added field descriptions, examples, and `model_config["json_schema_extra"]` on all models (`LoginRequest`, `TokenResponse`, `RefreshTokenRequest`, `RefreshTokenResponse`, `ForgotPasswordRequest`, `ForgotPasswordResponse`, `ResetPasswordRequest`, `ChangePasswordRequest`, `LogoutRequest`, `MessageResponse`, `ApiKeyRead`, `ApiKeyCreatedResponse`, `ApiKeyListResponse`).
- `kernel/backend/kernel/setup/router.py`: Assigned operation IDs (`setup_get_status`, `setup_run_checks`, `setup_execute_install`), declared `X-Setup-Token` header parameters, documented 422 error responses.
- `kernel/backend/kernel/setup/schemas/setup.py`: Aliased `SetupBrandingInput` to `SetupBrandingCreate`, switched admin model to `AdminUserCreate`, populated Northwind Traders Pvt Ltd example data.
- `kernel/backend/kernel/tenancy/router.py`: Assigned operation IDs (`tenants_*`), unified bearer scheme to `BearerAuth`, added `X-Tenant-ID` header parameters, documented 401/403/422 responses.
- `kernel/backend/kernel/tenancy/schemas/`: Added field examples on `TenantCreate`, `TenantUpdate`, and `TenantRead`; added descriptions and examples on `ItemCatalogRead`, `ModuleListResponse`, `PluginListResponse`, `ActivationResponse`.
- `kernel/backend/kernel/user/router.py`: Renamed tag to `User management`, assigned operation IDs (`users_create_user`, `users_get_user`), resolved circular import via lazy dependency loader, added explicit security and error responses.
- `kernel/backend/kernel/user/schemas/`: Aliased `AdminUserInput` to `AdminUserCreate`, added field descriptions and examples on `UserCreate`, `UserUpdate`, and `UserRead`.
- `modules/crm/backend/crm/router.py` & `modules/hrms/backend/hrms/router.py`: Added field descriptions and examples to info responses.
- `plugins/api-logger/backend/api_logger/router.py` & `__init__.py`: Renamed tag to `API logger` (sentence case), added field descriptions and examples.
- `apps/api-server/scripts/lint_openapi.py`: Refined UUID check for non-package parameters, excluded internal FastAPI error models.
- `apps/api-server/openapi-lint-exceptions.yaml`: Cleared `report_mode_rules` list to `[]` (all rules now fully enforced).
- `apps/api-server/openapi.json`: Regenerated specification in full synchronization with code.
- `kernel/backend/README.md`: Updated documentation standards to match STANDARDS.md §5 and recorded the S7 naming convention.

**API changes**:
- Operation IDs standardised to snake_case `<feature>_<action>` (e.g. `auth_login`, `tenants_create`, `users_create_user`).
- Unification of all bearer security under `BearerAuth`; elimination of duplicate `HTTPBearer`.
- Renamed tags to sentence case: `User Management` -> `User management`, `API Logger` -> `API logger`.
- Documented `X-Tenant-ID` header on `/tenants/current/*` endpoints and `X-Setup-Token` on `/setup/checks` and `POST /setup`.
- Declared explicit 401 Unauthorized and 422 Unprocessable Content error responses across secured and parameterized operations.

**Decisions**:
- Adopt `<Entity>Create`, `<Entity>Update`, and `<Entity>Read` naming convention (S7), aliasing legacy `Input` models for backwards compatibility.
- Empty the quality gate report-mode list immediately in Prompt 03, making all checklists strictly enforced for future commits.

**Verification**:
- `pnpm nx run api-server:openapi-check`: PASS (0 diff against code).
- `pnpm nx run api-server:openapi-lint`: PASS (Spectral clean, 0 enforced defects, 0 report-mode observations).
- `pnpm nx test api-server`: PASS (6 tests in 1.47s).
- `pnpm nx test kernel-backend`: PASS (100 tests in 5.90s).

**Open issues**:
- Blocking: none.
- Non-blocking: none.

## 04 – Contract tests – 2026-10-29

**Summary**: Built a comprehensive contract test suite asserting runtime conformance against the generated OpenAPI specification for every operation and every documented HTTP response status code. Created JSON Schema validator with Draft 2020-12 and internal `$ref` resolution via `referencing.Registry`. Implemented an automated undocumented-status guard and request example executability tests over all 33 operations. Added behaviour-fact tests verifying token rotation, expiry rejection, session revocation on logout, `X-Tenant-ID` multi-tenancy scoping, setup attempt rate limits, pagination maximum bounds, soft deletion semantics, and audit field tracking.

**Changed**:
- Created `apps/api-server/tests/contract_utils.py`: JSON Schema validation engine resolving live spec components and validating status-code payload contracts.
- Created `apps/api-server/tests/test_contract_general.py`: Contract tests for root (`/`), config (`/config`), and health (`/health`) endpoints across 200 and 503 statuses.
- Created `apps/api-server/tests/test_contract_auth.py`: 27 contract tests covering all authentication and API key operations across 200, 201, 401, 404, 409, 422.
- Created `apps/api-server/tests/test_contract_setup.py`: 14 contract tests covering setup status, pre-install checks, and first-run install across 200, 201, 401, 404, 409, 422, 429, 503.
- Created `apps/api-server/tests/test_contract_tenancy.py`: 46 contract tests covering all 12 tenant, module, and plugin operations across 200, 201, 401, 403, 404, 409, 422.
- Created `apps/api-server/tests/test_contract_user.py`: 8 contract tests covering user registration and retrieval across 200, 201, 401, 409, 422.
- Created `apps/api-server/tests/test_contract_modules.py`: 3 contract tests covering metadata discovery for CRM, HRMS, and API Logger.
- Created `apps/api-server/tests/test_contract_guard.py`: Undocumented-status guard asserting all operations return only documented statuses, plus request example executability test verifying all spec examples succeed.
- Created `apps/api-server/tests/test_behaviour_facts.py`: Verified runtime facts cited in Prompt 06 guides.
- Updated `apps/api-server/requirements.txt`: Added `jsonschema>=4.20.0`.
- Updated `apps/api-server/project.json`: Added `contract-test` target.
- Updated `.github/workflows/ci.yml`: Added `contract-test` to the CI test step.
- Updated `kernel/backend/kernel/auth/dependencies.py`: Replaced generic `hasattr` inspection with `isinstance(..., DependsParam)` to protect mocked dependencies.
- Updated `kernel/backend/kernel/tenancy/router.py`: Injected `get_current_tenant_id` dependency for clean tenant scoping and contract testability.
- Updated `kernel/backend/kernel/setup/dependencies.py`: Removed internal `timeout` parameter from `is_installed_cached` signature to eliminate undocumented query parameter defect.

**Behaviour facts test catalogue (cited by Prompt 06 guides)**:
- `test_token_rotation__rejects_old_refresh_token`: Refresh token rotation invalidates previous refresh token immediately.
- `test_token_expiry__rejects_expired_access_token`: Access tokens with expired timestamps return 401 Unauthorized.
- `test_logout_revocation__invalidates_subsequent_token_calls`: POST /auth/logout clears sessions and revokes access.
- `test_x_tenant_id__scopes_request_to_explicit_tenant`: Explicit `X-Tenant-ID` header scopes operation data queries to the specified tenant.
- `test_setup_token_attempt_limit__locks_out_after_max_guesses`: Exceeding setup token attempt limit returns 429 Too Many Requests.
- `test_pagination_bounds__rejects_limit_exceeding_200`: Requesting pagination limit > 200 returns 422 Unprocessable Content.
- `test_soft_delete__hides_record_by_default`: Soft-deleted tenant records are omitted from standard listings.
- `test_soft_delete__include_deleted_shows_records`: Passing `include_deleted=true` returns soft-deleted tenant records.
- `test_soft_delete__restore_makes_record_active`: POST /tenants/{tenant_id}/restore clears `deleted_at` and restores active status.
- `test_audit_fields__populated_on_create_and_update`: Operations automatically populate `created_at`, `created_by`, `updated_at`, `updated_by`.

**API changes**:
- Removed internal `timeout` query parameter from `/setup/status`.

**Decisions**:
- Use `referencing.Registry` with Draft 2020-12 for JSON Schema validation to resolve all spec schemas without network overhead.
- Structure contract tests by tag with sentence-like test names (`test_<operation>__<status>_<condition>`).

**Verification**:
- `pnpm nx test api-server`: PASS (119 tests in 3.28s).
- `pnpm nx run api-server:contract-test`: PASS (103 contract tests in 2.85s).
- `pnpm nx test kernel-backend`: PASS (100 tests in 5.96s).
- `pnpm nx run api-server:openapi-check`: PASS (0 diff against code).
- `pnpm nx run api-server:openapi-lint`: PASS (Spectral clean, 0 enforced defects, 0 report-mode observations).

**Open issues**:
- Blocking: none.
- Non-blocking: Prompt 05 (Reference site).

## 05 – API reference in the docs site – 2026-10-29

**Summary**: Published complete, drift-free API reference documentation on the Next.js/Fumadocs site (`apps/landing`) at `/api-reference`. Generated 33 operation pages grouped by canonical OpenAPI tags, 41 browsable schema pages with field constraints and enums, and 8 guide stubs. Implemented interactive `<ApiPlayground>` request console and `<ApiEndpoint>` semantic badges. Provided stable OpenAPI specification download at `/api-reference/openapi.json`. Built automated generation into `dev`, `build`, and `typecheck` pipelines, and wired freshness validation gate `check-api-docs-stale.mjs` into `landing:docs-check` and CI.

**Changed**:
- Created `apps/landing/scripts/generate-api-docs.mjs`: Automated reference and schema page generator reading `apps/api-server/openapi.json`.
- Created `apps/landing/scripts/checks/check-api-docs-stale.mjs`: Freshness quality gate verifying all 33 operations, 41 schemas, and public spec downloads are in sync.
- Created `apps/landing/components/docs/api-endpoint.tsx`: Semantic HTTP method badge (blue GET, emerald POST, amber PATCH, rose DELETE), endpoint path, and authentication requirement badge.
- Created `apps/landing/components/docs/api-playground.tsx`: Interactive client-side request playground with configurable base URL (default `http://localhost:8001`), authentication token headers, request body editor, latency timer, and formatted response viewer.
- Created `apps/landing/app/(docs)/api-reference/layout.tsx`: Layout shell with top navigation bar, sidebar navigation tree, and cross-links to developer and UI docs.
- Created `apps/landing/app/(docs)/api-reference/[[...slug]]/page.tsx`: Dynamic page renderer supporting static generation and SEO metadata matching `<Summary> – innostes ERP API`.
- Created `apps/landing/app/api-reference/openapi.json/route.ts`: Static JSON route serving OpenAPI 3.1 specification.
- Updated `apps/landing/lib/shared.ts`: Added `apiDocsRoute = '/api-reference'`.
- Updated `apps/landing/lib/source.ts`: Configured `apiDocs` collection with `defineDocs` and exported `apiSource` loader.
- Updated `apps/landing/components/docs/docs-page.tsx`: Extended GitHub edit links to support `api-docs`.
- Updated `apps/landing/components/mdx.tsx`: Registered `ApiEndpoint` and `ApiPlayground` globally in MDX components.
- Updated `apps/landing/app/(home)/layout.tsx`: Added `API Reference` link with Server icon to main navigation menu.
- Updated `apps/landing/app/(docs)/docs/layout.tsx`: Added `API` navigation item.
- Updated `apps/landing/app/(docs)/ui/docs/layout.tsx`: Added `API` navigation item.
- Updated `apps/landing/app/sitemap.ts`: Included all `/api-reference/**` pages in XML sitemap generation.
- Updated `apps/landing/app/api/search/route.ts`: Enriched advanced search index with API reference operations, paths, summaries, and schemas.
- Updated `apps/landing/scripts/checks/check-links.mjs`: Added `api-docs` link resolution and verification.
- Updated `apps/landing/scripts/checks/run-all.mjs`: Enforced `runApiDocsStaleCheck` in quality gates.
- Updated `apps/landing/package.json`: Wired `generate-api-docs.mjs` into `dev`, `build`, `typecheck`, and added `api-docs` target.
- Updated `apps/landing/content/dev-docs/guides/writing-docs.mdx` and `apps/landing/content/dev-docs/apps/landing.mdx`: Documented API collection, generation script, and freshness check.

**API changes**: none.

**Decisions**:
- Generated MDX operation and schema pages directly from `openapi.json` using custom AST generator to guarantee 100% theme consistency with `@innostes/ui` and avoid dependency conflicts with React 19 / Base UI.
- Use semantic token styling for HTTP method badges (`bg-emerald-500/10 text-emerald-600` for POST, etc.).
- Pre-populate all operation samples in `curl`, TypeScript (`fetch`), and Python (`httpx`) using the Northwind Traders Pvt Ltd enterprise data universe.
- Serve `/api-reference/openapi.json` via Next.js route handler and static public asset.

**Verification**:
- `pnpm nx run landing:docs-check`: PASS (All 11 enforced quality gates pass, 0 defects).
- `node apps/landing/scripts/checks/check-api-docs-stale.mjs`: PASS (All 33 operations and 41 schemas fresh against spec).
- `pnpm nx run landing:typecheck`: PASS (0 type errors).
- `pnpm nx run landing:build`: PASS (241 static pages generated successfully in 45s).

**Open issues**:
- Blocking: none.
- Non-blocking: Prompt 06 (Guides for API callers).





