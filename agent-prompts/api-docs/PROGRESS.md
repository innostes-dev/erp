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
- Non-blocking: Prompt 03 (Endpoint docs in code).


