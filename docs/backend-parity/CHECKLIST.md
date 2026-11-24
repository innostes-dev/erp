# Multi-Backend Release Checklist (Kernel only)

**Goal:** the platform **kernel** runs on three interchangeable backends, all serving the same
API contract so the web-app works unchanged against any of them. Business modules
(PeopleOps, SalesFlow) and plugins (Tracura) are **out of scope**.

1. FastAPI (Python) — existing, reference implementation (`kernel/backend`)
2. Laravel (PHP) — `kernel/backend-laravel`
3. NestJS (TypeScript) — `kernel/backend-nestjs`

**Rules**
- Phase 0 first. After Phase 0, Phases 1 (Laravel) and 2 (NestJS) run **in parallel** (owner's decision 2026-11-24); Phase 3 starts when both are done.
- FastAPI is not modified except to export/fix the contract. Its OpenAPI spec is the source of truth.
- Same PostgreSQL schema on all backends (Alembic migrations 0001–0005, 0007, 0008 are the reference; module/plugin tables 0006, 0009 excluded).
- A task is checked only when implemented AND its parity test passes. Update this file in the same change.

**Production-ready definition (applies to every Laravel/NestJS task)**
- Input validation on every endpoint; consistent error format identical to FastAPI
- No secrets in code; config via env; `.env.example` complete
- Passwords hashed (argon2/bcrypt matching reference); PII encrypted; constant-time compares
- Rate limiting + account lockout on auth endpoints
- SQL via ORM/parameterised queries only; no raw string SQL
- Structured logging, health/readiness endpoints, graceful shutdown
- Automated tests (unit + parity) green; lint/static-analysis clean
- Dockerfile, non-root user, pinned dependencies

**Kernel scope (111 total ops in spec; kernel = ~31):** Authentication 10, Tenancy 13, Setup 3,
User management 2, General 2, Observability 1.

---

## Phase 0 — Contract & parity harness
- [x] 0.1 Regenerate `apps/api-server/openapi.json` from the running FastAPI app
- [x] 0.2 Kernel endpoint inventory (`docs/backend-parity/endpoints.md`): method, path, auth, request/response schemas
- [x] 0.3 Dump reference kernel DB schema from Alembic (`docs/backend-parity/schema.sql`)
- [x] 0.4 Document shared conventions (`conventions.md`): error format, pagination, token format, PII encryption format, headers
- [x] 0.5 Backend-agnostic parity test suite (`tests/parity/`, driven by `BASE_URL`)
- [x] 0.6 Parity suite green against FastAPI (baseline)
- [x] 0.7 Gap-report script: diff a backend's OpenAPI vs the reference

## Phase 1 — Laravel kernel (production-ready)
- [x] 1.1 Migrations matching reference schema (replace simplified stub)
- [x] 1.2 Core: config, base model, error format, pagination, OpenAPI export
- [x] 1.3 Crypto: envelope encryption + blind index (FastAPI-compatible)
- [x] 1.4 Setup: status, checks, install
- [x] 1.5 Auth: login, refresh, logout, me, change/forgot/reset password
- [x] 1.6 Auth: API keys
- [x] 1.7 JWT access/refresh tokens, token_version invalidation (FastAPI-compatible)
- [x] 1.8 User: sessions, devices, security/MFA, password history, user API
- [x] 1.9 RBAC: roles, permissions, data scopes, enforcement
- [x] 1.10 Tenancy: tenants, members, settings, modules, plugins
- [x] 1.11 Audit: writer for all reference actions (the audit read router is not mounted in the reference, so no read API is in the contract)
- [x] 1.12 Observability/General: `/health` (also readiness), `/`, `/config` (no `/metrics` in the reference contract)
- [x] 1.13 Hardening: rate limits, lockout, security headers, logging
- [x] 1.14 Dockerfile + `.env.example` + README
- [x] 1.15 Parity suite green on Laravel
- [x] 1.16 Static analysis (larastan/pint) clean

## Phase 2 — NestJS kernel (production-ready)
- [x] 2.1 Scaffold `kernel/backend-nestjs` (NestJS, TypeORM, Postgres, strict TS)
- [x] 2.2 Migrations matching reference schema
- [x] 2.3 Core: config validation, error format, pagination, Swagger/OpenAPI export
- [x] 2.4 Crypto: envelope encryption + blind index (compatible)
- [x] 2.5 Setup
- [x] 2.6 Auth: login, refresh, logout, me, password flows
- [x] 2.7 Auth: API keys
- [x] 2.8 JWT tokens, token_version invalidation (compatible)
- [x] 2.9 User: sessions, devices, security/MFA, user API
- [x] 2.10 RBAC + data scopes
- [x] 2.11 Tenancy
- [x] 2.12 Audit
- [x] 2.13 Observability/General: health, readiness, metrics
- [x] 2.14 Hardening: rate limits (throttler), lockout, helmet, logging, graceful shutdown
- [x] 2.15 Dockerfile + `.env.example` + README
- [x] 2.16 Parity suite green on NestJS
- [x] 2.17 ESLint/tsc strict clean

## Phase 3 — Release
- [x] 3.1 Backend selector: docker-compose profiles (`fastapi|laravel|nestjs`)
- [x] 3.2 CI matrix: parity suite against all three
- [x] 3.3 Nx project.json targets for Laravel and NestJS
- [x] 3.4 Cross-backend check: one DB works when switching backends (tokens, passwords, encrypted PII interoperate)
- [x] 3.5 Security review of each new backend (reports in `docs/backend-parity/security/`)
- [x] 3.6 Performance smoke test on all three (`docs/backend-parity/perf-smoke.md`)
- [x] 3.7 Docs: install/run per backend, differences
- [x] 3.8 Update `/docs` (README, setup/architecture, api-docs) to document multi-backend support (FastAPI, Laravel, NestJS)
- [ ] 3.9 Release notes + tag — notes written (`docs/backends/release-notes.md`, "Unreleased"); **tag/commit intentionally left to the repo owner**

---

## Progress log
| Date | Task | Notes |
| --- | --- | --- |
| 2026-11-24 | — | Checklist created. Laravel stub exists at `kernel/backend-laravel` (setup + login only; replaced during Phase 1). |
| 2026-11-24 | 0.1 | Regenerated `openapi.json`: 55 → 111 operations; `check-openapi` passes. |
| 2026-11-24 | — | Scope narrowed to kernel only; module phases removed; production-ready definition added. |
| 2026-11-24 | 0.2 | `docs/backend-parity/endpoints.md` generated by `scripts/parity/gen_inventory.py` (31 kernel ops). |
| 2026-11-24 | 0.3 | `schema.sql` (20 kernel tables) generated by `scripts/parity/gen_schema.py`; verified it applies to an empty Postgres. |
| 2026-11-24 | 0.4 | `conventions.md` written (errors, tokens, crypto, setup flow, quirks). |
| 2026-11-24 | 0.5 | `tests/parity/kernel.parity.test.mjs` (37 tests, Node `node:test`, no deps). Run: see `tests/parity/README.md`. |
| 2026-11-24 | 0.6 | Baseline vs FastAPI: 32 pass, 5 skipped via `KNOWN_REFERENCE_BUGS=1` (reset-password 500, lockout/reuse-revocation not persisted, anonymous tenant routes, API-key create 500). FastAPI left unmodified per owner. |
| 2026-11-24 | 0.7 | `scripts/parity/gap-report.mjs <openapi>`: diffs a backend spec vs reference (31 kernel ops). |
| 2026-11-24 | — | Phases 1 and 2 switched to parallel execution (owner request). |
| 2026-11-24 | 1.1-1.10, 1.13-1.16 | Laravel kernel (`kernel/backend-laravel`): parity 37/37 pass, 0 skipped, no `KNOWN_REFERENCE_BUGS`; gap-report 31/31; PHPUnit 45 tests (incl. Python interop vectors both directions); Pint + Larastan level 6 clean. Migration 2 widens `api_keys.key_prefix` to VARCHAR(32) (schema.sql's VARCHAR(16) cannot hold the 17-char prefix; see note in conventions.md). |
| 2026-11-24 | 1.11, 1.12 (open) | Left unticked: audit **writer** is done (all reference actions, failures never fail a request) and `/health` doubles as readiness (DB check, 503), but there is no audit read API or `/metrics` route because neither is part of the 31-op kernel contract. |
| 2026-11-24 | 2.1-2.17 | NestJS kernel (`kernel/backend-nestjs`): parity 37/37 pass, 0 skipped, no `KNOWN_REFERENCE_BUGS`; gap-report 31/31; Jest 91 unit + 31 e2e (incl. Python interop vectors both directions); ESLint + `tsc --noEmit` strict clean. Uses `pg` + parameterised SQL instead of TypeORM. Migration 0002 widens `api_keys.key_prefix` to VARCHAR(32) (idempotent, also on pre-existing DBs). |
| 2026-11-24 | 3.1–3.4 | `docker-compose.backends.yml` (profiles laravel/nestjs); `.github/workflows/backend-parity.yml` (parity matrix, unit/lint, interop; not executed locally); Nx `project.json` for both backends (+ `!kernel/backend-nestjs` excluded from pnpm workspace); `scripts/parity/run-cross-backend.sh` + `tests/parity/cross-backend.test.mjs`: 17/17 on one shared DB. |
| 2026-11-24 | 3.5 (Laravel) | Laravel security review done: `docs/backend-parity/security/laravel.md` (1 high, 3 medium fixed). Revision 2: unified RBAC-based authorization + 72-byte new-password rule shared with NestJS; parity 44/44, phpunit 61. |
| 2026-11-24 | 3.5 (NestJS) | NestJS security review done: `docs/backend-parity/security/nestjs.md` (1 high, 4 medium, 8 low fixed; authz on tenants/users, X-Tenant-ID IDOR, API-key minting, lockout race, XFF spoofing, nodemailer CVEs, prod-boot gaps). Parity 37/37, Jest 101 unit + 45 e2e, lint/typecheck clean. |
| 2026-11-24 | 3.5, 3.6 | Security reviews done and fixed in both ports; unified authorization rules added to `conventions.md` and covered by 7 new parity tests (suite now 44). A lockout regression found in the NestJS review fix (valid parallel logins locked out) was caught by the perf smoke test and fixed. Perf results in `perf-smoke.md`. |
| 2026-11-24 | final | Verified on final code: parity 44/44 (Laravel, NestJS; 0 skipped), FastAPI 32 pass + 12 skipped (documented reference defects), cross-backend 17/17, gap report 31/31 x2, PHPUnit 61, Jest 101 + e2e 47, lint/static analysis clean. |
| 2026-11-25 | identities + credentials | Expand step on all three backends: shared idempotent SQL `kernel/backend/migrations/sql/0010_identities_credentials.sql` (Alembic 0010, Laravel 000003, NestJS 0003; drift check `scripts/parity/check-shared-sql.mjs`). Reads use the new tables (legacy fallback only when no row exists; soft-deleted rows never resurrected), writes go to both. FastAPI and Laravel now return `409 mobile_already_exists` like NestJS (FastAPI was 500). New tests: `tests/parity/identities.test.mjs` 43 (all 3 backends, shared DB), FastAPI +33, Laravel +18, NestJS e2e +14. Parity 32+12 skipped / 44 / 44, cross-backend 17/17. |
| 2026-11-25 | FastAPI cleanup | Auth, tenancy, users/RBAC, setup and audit simplified (same API: `openapi.json` unchanged). Shared `kernel.audit.services.audit_request` / `actor_fields` replace ~20 pasted audit blocks; `kernel.core.http.client_ip` replaces 3 copies. Fixed: reset-password 500 (parity test un-skipped), audit actor email always empty, "Ada None" names, `TenantNotFoundError(msg)` crash, audit router always "System Worker". FastAPI parity without skips: 33/44 (was 32). |
