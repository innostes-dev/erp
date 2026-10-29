# Progress log

Each agent appends one entry, in the format from `STANDARDS.md` §7, at the bottom.

## 00 – Seed notes – 2026-10-28

Observed before the runbook started. Prompt 01 must verify every one.

- The existing architecture pages (`content/dev-docs/architecture/`, about 600 lines) are:
  - `overview.mdx`: engines, plug-ins, dependency rules, the request flow, the repository layout
  - `kernel.mdx`: backend and frontend layout, feature layout, common columns, soft delete, the
    base service, "who made the change", migrations
  - `plugins.mdx`: backend and frontend plug-ins
  - `setup.mdx`: security layers, endpoints, command-line and web install, the production checklist
- The diagrams are ASCII art in `text` code blocks. There are no C4 views, no sequence diagrams and
  no entity diagrams.
- `overview.mdx` states three dependency rules. Nothing in CI appears to enforce them: check for
  `import-linter` and for Nx module-boundary tags.
- `overview.mdx` has a status callout. It says a page loader in `web-app`, so that plug-ins can
  register pages and menus, is "still to come". Verify the current state.
- There are no ADRs, no quality goals or scenarios, no risk or debt register, no glossary, no
  deployment view, no configuration reference, no runbooks and no threat model.
- Infrastructure facts:
  - `docker-compose.yml` runs Postgres 16 and api-server, with `AUTO_MIGRATE`, `APP_ENV` and
    `JWT_SECRET_KEY` (with an insecure development default)
  - settings live in `kernel/backend/kernel/core/config/settings.py`: CORS, token lifetimes, SMTP,
    and so on
- Security-relevant parts to cover in the threat model:
  - JWT access and refresh tokens with rotation (`kernel/core/security`)
  - `kernel/core/crypto/cipher.py`
  - the setup token with attempt limiting (`kernel/setup`)
  - the user models for roles and permissions (RBAC), sessions, devices and password history
  - tenant membership and the `X-Tenant-ID` header

## 01 – Audit – 2026-10-29
**Summary**: Completed comprehensive architectural audit. Verified every claim across dev-docs against code, audited dependency rule enforcement, recovered architectural facts across engines, kernel, modules, and plugins, analyzed arc42 gaps for all 12 sections, catalogued 16 candidate ADRs, and inventoried the threat surface for STRIDE threat modelling. Generated `agent-prompts/architecture-docs/AUDIT.md` containing 13 formal findings (`ARC-001` through `ARC-013`).
**Changed**: Created `agent-prompts/architecture-docs/AUDIT.md`, updated `PROGRESS.md`, deleted `01-audit.md`.
**Code changes**: none (pure audit phase).
**Decisions**: Recorded 16 candidate ADRs in AUDIT.md to be authored in Prompt 09.
**Verification**: Verified baseline with `pnpm nx build landing` (passed cleanly, 249 pages), `pnpm nx run-many -t test` (passed cleanly, 6 projects, 120 Python tests), and inspection of all 18 SQLAlchemy models.
**Open issues**:
- Non-blocking: `ARC-001` through `ARC-013` (tracked in `AUDIT.md` with assigned owner prompts).

## 02 – Tooling, doc gates and fitness functions – 2026-10-29
**Summary**: Established the complete architecture documentation tooling and fitness function infrastructure:
1. Implemented `<Diagram>` MDX component in `apps/landing` using `mermaid` with automatic light/dark theming and 360px responsive horizontal scrolling.
2. Built automated diagram syntax validation gate (`check-diagrams.mjs`) using JSDOM and `mermaid.core` parser.
3. Extended Fumadocs dev-docs schema with `owner`, `lastReviewed` (ISO date), and `arc42` section metadata; built frontmatter enforcement gate (`check-arch-frontmatter.mjs`) and displayed owner/lastReviewed badges in `PageHeader`.
4. Created MADR 4.x validation gate (`check-adrs.mjs`) checking NNNN numbering, allowed statuses, sections, and superseded reference integrity.
5. Created arc42 coverage gate (`check-arc42-coverage.mjs`) mapping architecture pages to all 12 arc42 sections.
6. Implemented Python `import-linter` contracts (`.importlinter`) enforcing Rule 1 (engine doesn't import plugins), Rule 2 (plugins never import engine), Rule 3 (kernel imports no external plugins), Rule 4 (core imports no feature modules), and Rule 5 (kernel layering with narrow exceptions for `ARC-002`).
7. Implemented TypeScript module boundary checker (`scripts/checks/check-ts-boundaries.mjs`) enforcing isolation of `@innostes/ui` and `@innostes/kernel`. Fixed cross-module boundary violation in `modules/crm/frontend/src/manifest.ts`.
8. Implemented database model uniformity fitness function (`kernel/backend/tests/test_architecture_fitness.py`) and fixed omitted `kernel.auth.models` import in `kernel/backend/kernel/models.py` (`ARC-005`).
9. Added `landing:arch-docs-check` and `arch-check` targets to Nx, package.json, and CI workflow (`.github/workflows/ci.yml`).
10. Authored comprehensive architectural authoring guide `content/dev-docs/guides/architecture-docs.mdx` and updated `writing-docs.mdx`.
**Changed**: `.importlinter`, `apps/landing/components/docs/diagram.tsx`, `apps/landing/components/mdx.tsx`, `apps/landing/components/docs/page-header.tsx`, `apps/landing/components/docs/docs-page.tsx`, `apps/landing/lib/source.ts`, `apps/landing/scripts/checks/*`, `scripts/checks/check-ts-boundaries.mjs`, `kernel/backend/tests/test_architecture_fitness.py`, `kernel/backend/kernel/models.py`, `modules/crm/frontend/src/manifest.ts`, `.github/workflows/ci.yml`, `writing-docs.mdx`, `architecture-docs.mdx`, `02-tooling-fitness-functions.md` deleted.
**Code changes**:
- `apps/landing/package.json`: added `mermaid` dependency, added `arch-docs-check` script and nx target.
- `apps/api-server/requirements.txt`: added `import-linter>=2.15`.
- `kernel/backend/kernel/models.py`: imported `kernel.auth.models` so all 18 tables are registered in `Base.metadata`.
- `modules/crm/frontend/src/manifest.ts`: decoupled CRM from HRMS manifest type.
**Decisions**:
- Standardised Mermaid diagrams on `flowchart` with C4 notation conventions (legend per D4) because experimental Mermaid `C4Context` requires DOMPurify browser hooks that fail during server/node build parsing.
**Verification**:
- `pnpm run arch-check`: PASSED (167 TS files, 5 import-linter contracts kept, 2 model fitness tests passed).
- `pnpm nx run landing:arch-docs-check`: PASSED (all 5 gates passed).
- `pnpm nx run landing:docs-check`: PASSED (all 16 enforced quality gates passed).
- `pnpm nx build landing`: PASSED (250 pages statically generated).
**Open issues**:
- Non-blocking: `ARC-002` (feature circular dependencies recorded with narrow exceptions in `.importlinter`, to be addressed in Prompt 10).

## 03 – Context, goals, constraints and solution strategy – 2026-10-29
**Summary**: Authored arc42 sections 1–4 establishing the architectural foundation of Innostes ERP:
1. Created `apps/landing/content/dev-docs/architecture/index.mdx` (Architecture overview, complete arc42 section mapping, C4 model hierarchy, and docs-as-code quality gate summary).
2. Created `apps/landing/content/dev-docs/architecture/goals.mdx` (arc42 §1: requirements overview, ISO/IEC 25010 quality goals [modifiability, security, maintainability, operability], and ISO 42010 stakeholder concern matrix).
3. Created `apps/landing/content/dev-docs/architecture/constraints.mdx` (arc42 §2: technical constraints [Python 3.10+, FastAPI, PostgreSQL 16, React 19, Nx, Tailwind v4], organisational constraints, and conventions).
4. Created `apps/landing/content/dev-docs/architecture/context-and-scope.mdx` (arc42 §3: C4 Level 1 System Context diagram using `<Diagram>` with Mermaid flowchart, business context table, and technical context protocols table).
5. Created `apps/landing/content/dev-docs/architecture/solution-strategy.mdx` (arc42 §4: fundamental architectural decisions, ADR mappings, and goals-to-approach matrix).
6. Updated `apps/landing/content/dev-docs/architecture/meta.json` with new pages.
**Changed**: `content/dev-docs/architecture/index.mdx`, `goals.mdx`, `constraints.mdx`, `context-and-scope.mdx`, `solution-strategy.mdx`, `meta.json`, `PROGRESS.md`, `03-context-goals-strategy.md` deleted.
**Code changes**: none (documentation only).
**Decisions**:
- Registered arc42 §1-4 pages in `meta.json` and validated all internal links across dev-docs.
**Verification**:
- `pnpm run arch-check`: PASSED.
- `pnpm nx run landing:arch-docs-check`: PASSED.
- `pnpm nx run landing:docs-check`: PASSED (16 quality gates, 0 broken links).
- `pnpm nx build landing`: PASSED (255 pages statically generated).
**Open issues**:
- Open questions for product owner:
  1. Regulatory data retention requirements for financial and audit history under Indian statutory laws.
  2. Multi-region database replication / read-replica requirements for distributed warehouse locations.
  3. Priority of enterprise SAML 2.0 / OIDC corporate single sign-on (SSO) integration.




## 04 – Building block view and plug-in contract – 2026-10-29
**Summary**: Authored arc42 section 5 (Building Block View) and the formal Plug-in Contract reference:
1. Created `apps/landing/content/dev-docs/architecture/building-blocks.mdx` covering C4 Level 2 Container decomposition (`web-app`, `api-server`, `postgres`, `docsSite`, `smtpServer`), C4 Level 3 Backend Engine execution pipeline (`ServerEngine`, `ModuleLoader`, `ModuleRegistry`, ordered middleware stack, system routes), C4 Level 3 UI Engine bootstrap and routing (`SetupGate`, `AuthGate`, `NavigationContext`, `AppRouter`, shell layouts), and Level 3 Kernel subpackage architecture and three-tier feature layering.
2. Created `apps/landing/content/dev-docs/architecture/plugin-contract.mdx` detailing the formal `BaseModule` backend contract, frontend package export conditions and `ModuleManifest`, package directory layout, engine guarantees, the 5 architectural invariant rules (linked to `.importlinter` and `check-ts-boundaries.mjs`), and the embedded 7-module catalogue table.
3. Implemented automated module catalogue generator and staleness gate (`apps/landing/scripts/generate-module-catalog.mjs`, `apps/landing/lib/module-catalog.json`, and Gate 6 in `run-arch-checks.mjs`).
4. Updated `apps/landing/content/dev-docs/architecture/meta.json` with `building-blocks` and `plugin-contract`.
**Changed**: `apps/landing/content/dev-docs/architecture/building-blocks.mdx`, `plugin-contract.mdx`, `meta.json`, `apps/landing/scripts/generate-module-catalog.mjs`, `apps/landing/lib/module-catalog.json`, `apps/landing/scripts/checks/run-arch-checks.mjs`, `PROGRESS.md`, `04-building-blocks.md` deleted.
**Code changes**: Added Gate 6 (module catalogue staleness verification) in `run-arch-checks.mjs`.
**Decisions**:
- Authored static module catalogue generator with programmatic freshness verification gate in CI.
- Marked dynamic frontend module manifest discovery as planned with `<Callout type="info" title="Status">`.
**Verification**:
- `pnpm run arch-check`: PASSED (167 TS files, 5 import-linter contracts kept, 2 model fitness tests passed).
- `pnpm nx run landing:arch-docs-check`: PASSED (all 6 gates passed).
- `pnpm nx build landing`: PASSED (262 pages statically generated).
**Open issues**:
- Non-blocking: `ARC-002` (feature circular dependencies recorded with narrow exceptions in `.importlinter`, to be addressed in Prompt 10).

## 05 – Runtime view of key scenarios – 2026-10-29
**Summary**: Authored arc42 section 6 (Runtime View) in `apps/landing/content/dev-docs/architecture/runtime-view.mdx`:
1. Traced and documented all 7 key runtime scenarios with Mermaid sequence diagrams, numbered execution steps, exact file references, and `alt`/`opt` exception paths:
   - Scenario 1: API server start-up sequence (`ServerEngine`, `ModuleLoader.discover()`, `auto_migrate()` with PostgreSQL advisory lock `42`, module lifecycle hooks).
   - Scenario 2: Request lifecycle and multi-tenant isolation (`CORSMiddleware`, `SetupRequiredMiddleware`, `ApiLoggerMiddleware`, `Depends(get_current_user)`, `Depends(get_current_tenant_id)`, `BaseService` transaction boundaries, and `register_error_handlers`).
   - Scenario 3: First-run setup flow (`GET /setup/status`, `X-Setup-Token` rate-limited validation, atomic organization provisioning transaction, cache invalidation, and CLI installer `python -m kernel.setup --from-env`).
   - Scenario 4: Authentication, rotating refresh token family issuance, and logout (`POST /auth/login`, bcrypt password verification, 30m JWT access token, 7d rotating refresh token, automated token replay/theft detection and session termination, `POST /auth/logout`).
   - Scenario 5: Password reset workflow (`POST /auth/reset-password/request`, 64-char crypto token with 15m expiration, SMTP notification, `password_histories` check preventing reuse of last 5 passwords, universal session revocation).
   - Scenario 6: UI engine boot and module mounting (`apps/web-app/src/main.tsx`, `configureApi()`, `<SetupGate>`, `<AuthGate>`, `AppRouter`, dynamic `<ModuleShellLayout>`, and transparent token refresh retry via `apiRequest()`).
   - Scenario 7: Entity lifecycle (`BaseService.create`, `update`, `soft_delete`, default query filtering `WHERE deleted_at IS NULL`, audit trail attributes `created_by`/`updated_by`/`deleted_by`, and compliance restoration via `POST /tenants/{id}/restore`).
2. Updated `apps/landing/content/dev-docs/architecture/meta.json` with `runtime-view`.
3. Verified all 7 sequence diagrams pass headless AST parsing with `mermaid.core.mjs`.
**Changed**: `apps/landing/content/dev-docs/architecture/runtime-view.mdx`, `meta.json`, `PROGRESS.md`, `05-runtime-view.md` deleted.
**Code changes**: none (documentation only).
**Decisions**:
- Standardised sequence diagrams on plain text message formats to avoid delimiter conflicts with Mermaid statement separators.
**Verification**:
- `pnpm run arch-check`: PASSED.
- `pnpm nx run landing:arch-docs-check`: PASSED.
- `pnpm nx run landing:docs-check`: PASSED (all 16 gates passed, 17 Mermaid diagrams validated).
- Python test suite: 107 backend unit tests PASSED in 5.9s.
**Open issues**:
- Non-blocking: `ARC-002` (feature circular dependencies recorded with narrow exceptions in `.importlinter`, to be addressed in Prompt 10).

## 06 – Data architecture, multi-tenancy and migrations – 2026-10-29
**Summary**: Authored arc42 sections 5 and 8 (Data Architecture and Cross-cutting Concepts) in `apps/landing/content/dev-docs/architecture/data-architecture.mdx`:
1. Documented complete relational schema across all 18 core tables managed by `Base.metadata` in PostgreSQL 16.
2. Rendered full Entity-Relationship diagram in `<Diagram>` using Mermaid `erDiagram`.
3. Created table inventory reference detailing table names, owning features, key columns, and multi-tenant scoping boundaries.
4. Detailed universal model conventions inherited from `BaseModel`: `UUIDPrimaryKeyMixin` (UUID v4 primary keys), `TimestampMixin` (UTC timestamps), `AuditMixin` (actor tracking via `created_by`/`updated_by`), and `SoftDeleteMixin` (universal soft-deletion via `deleted_at`/`deleted_by`).
5. Documented pooled single-database multi-tenancy strategy, `X-Tenant-ID` header resolution, application-level isolation, and future PostgreSQL Row-Level Security (RLS) plans.
6. Documented Alembic migration strategy, zero-downtime expand-and-contract patterns, and PostgreSQL transaction advisory locking (`SELECT pg_advisory_xact_lock(727001)`) for concurrent startup safety.
7. Documented data lifecycle, retention policies, and cryptographic protection (salted bcrypt password hashes, AES-256-CBC/Fernet ciphertext for personal identities).
8. Implemented automated data dictionary verification script (`apps/landing/scripts/generate-data-dictionary.py --check`) verifying all 18 tables in `Base.metadata`.
**Changed**: `apps/landing/content/dev-docs/architecture/data-architecture.mdx`, `apps/landing/scripts/generate-data-dictionary.py`, `PROGRESS.md`, `06-data-architecture.md` deleted.
**Code changes**: Added `generate-data-dictionary.py`.
**Decisions**:
- Standardised database primary keys on application-generated UUID v4 strings for pre-persistence referenceability.
- Protected database migration concurrency across horizontally scaled API replicas using PostgreSQL advisory transaction locks.
**Verification**:
- `apps/api-server/.venv/bin/python apps/landing/scripts/generate-data-dictionary.py --check`: PASSED (18 tables verified).
- `pnpm run arch-check`: PASSED.
- `pnpm nx run landing:arch-docs-check`: PASSED.
- `pnpm nx run landing:docs-check`: PASSED.
**Open issues**:
- Non-blocking: `ARC-002` (feature circular dependencies recorded with narrow exceptions in `.importlinter`, to be addressed in Prompt 10).

## 07 – Deployment view, configuration reference and runbooks – 2026-10-29
**Summary**: Authored arc42 section 7 (Deployment View) and operational runbooks:
1. Created `apps/landing/content/dev-docs/architecture/deployment.mdx` covering C4 Level 2 local developer workstation topology (`pnpm nx dev`), Docker Compose container boundaries (`postgres` and `api-server` with healthchecks and persistent named volume), and the recommended production topology (TLS termination reverse proxy, horizontally scaled stateless ASGI replicas, managed PostgreSQL 16 cluster, CDN edge hosting for static `web-app`, corporate SMTP relay).
2. Documented configuration reference covering all 42 environment variables from `kernel.core.config.Settings` and `PostgresSettings` (types, defaults, secret flags, and security warnings for insecure development defaults).
3. Documented observability standards (`GET /health` database ping and per-module health probes, structured JSON telemetry via `api_logger`).
4. Created operations runbooks in `apps/landing/content/dev-docs/operations/`:
   - `deployment.mdx`: Production deployment procedure, prerequisites, and migration execution.
   - `backup-restore.mdx`: PostgreSQL logical backups (`pg_dump -F c`), transactional restoration (`pg_restore -1`), and Point-in-Time Recovery (PITR) strategy.
   - `key-rotation.mdx`: Procedures for rotating `JWT_SECRET_KEY`, database credentials, and versioned encryption keys.
5. Implemented automated configuration reference check script (`apps/landing/scripts/generate-config-reference.py --check`) verifying 42 settings in Settings and PostgresSettings.
6. Registered `operations` section in `apps/landing/content/dev-docs/meta.json`.
**Changed**: `apps/landing/content/dev-docs/architecture/deployment.mdx`, `apps/landing/content/dev-docs/operations/*`, `apps/landing/scripts/generate-config-reference.py`, `PROGRESS.md`, `07-deployment-operations.md` deleted.
**Code changes**: Added `generate-config-reference.py`.
**Decisions**:
- Standardised deployment diagrams on `<Diagram>` with Mermaid flowcharts.
- Positioned `operations` runbooks as how-to documentation in `content/dev-docs/operations/`.
**Verification**:
- `apps/api-server/.venv/bin/python apps/landing/scripts/generate-config-reference.py --check`: PASSED (42 settings verified).
- `pnpm run arch-check`: PASSED.
- `pnpm nx run landing:arch-docs-check`: PASSED (all 6 gates passed, 18 Mermaid diagrams verified).
- `pnpm nx run landing:docs-check`: PASSED (all 16 quality gates passed).
**Open issues**:
- Non-blocking: `ARC-002` (feature circular dependencies recorded with narrow exceptions in `.importlinter`, to be addressed in Prompt 10).

## 08 – Cross-cutting concepts and STRIDE threat model – 2026-10-29
**Summary**: Authored arc42 section 8 (Cross-cutting Concepts) and the formal STRIDE Security Threat Model:
1. Created `apps/landing/content/dev-docs/architecture/cross-cutting.mdx` covering 10 universal platform concepts:
   - Authentication (bcrypt cost 12, 30m JWT access tokens, 7d rotating refresh token families, token replay theft detection, password history preventing reuse of last 5 passwords, 5-attempt brute-force lockouts).
   - Authorisation (RBAC hierarchy: permissions, roles, tenant-scoped user_roles, system roles, and current membership checkpoints).
   - Multi-tenancy runtime scoping (`X-Tenant-ID` header validation, `BaseService` query scoping).
   - RFC 7807 problem details and exception mapping (`register_error_handlers`).
   - Three-tier validation (Pydantic edge DTOs, service invariants, database constraints).
   - Asynchronous transactions and PostgreSQL advisory locking.
   - Configuration layering and SecretStr masking.
   - Separation of technical telemetry and compliance audit trails (`AuditMixin`, `SoftDeleteMixin`).
   - Internationalisation, UTC time storage, and Indian enterprise defaults (INR [₹]).
   - Layered test suites (107 Python unit tests, fitness functions, docs gates, multi-React compatibility).
2. Created `apps/landing/content/dev-docs/architecture/threat-model.mdx`:
   - Data Flow Diagram (DFD) modelling 5 primary trust boundaries.
   - Asset classification inventory (secrets, keys, credentials, PII, setup tokens).
   - Complete STRIDE Threat Analysis Matrix with 8 formal threats (`TM-001` through `TM-008`), exact code mitigation citations, residual risk scoring, and recommended hardening actions.
   - Handed over top architectural risks to the Risk Register (`ARC-014` IP rate limiting, `ARC-015` database Row-Level Security).
3. Updated `apps/landing/content/dev-docs/architecture/meta.json` with `cross-cutting` and `threat-model`.
**Changed**: `apps/landing/content/dev-docs/architecture/cross-cutting.mdx`, `threat-model.mdx`, `meta.json`, `PROGRESS.md`, `08-crosscutting-security.md` deleted.
**Code changes**: none (documentation only).
**Decisions**:
- Authored STRIDE threat model as code with diffable Mermaid DFD diagrams and explicit code-level mitigation links.
**Verification**:
- `pnpm run arch-check`: PASSED.
- `pnpm nx run landing:arch-docs-check`: PASSED (all 6 gates passed, 19 Mermaid diagrams verified).
- `pnpm nx run landing:docs-check`: PASSED (all 16 quality gates passed).
**Open issues**:
- Non-blocking: `ARC-002` (feature circular dependencies recorded with narrow exceptions in `.importlinter`, to be addressed in Prompt 10).
- Handed to Prompt 10: `ARC-014` (IP-based rate limiting at ingress) and `ARC-015` (PostgreSQL RLS).

## 09 – Architecture decision records – 2026-10-29
**Summary**: Authored arc42 section 9 (Architecture Decisions) in `apps/landing/content/dev-docs/architecture/decisions/`:
1. Established the MADR 4.x decision template in `decisions/0000-template.mdx`.
2. Authored the complete Architecture Decision Log index in `decisions/index.mdx` with tabular status tracking.
3. Authored all 16 retroactive Architecture Decision Records (ADRs) covering foundational platform choices:
   - `0001-engine-plugin-inversion`: Modular monolith with engine-plugin inversion.
   - `0002-fastapi-backend-engine`: FastAPI and Uvicorn for asynchronous execution and OpenAPI contracts.
   - `0003-react-vite-ui-engine`: React 19 and Vite with `@innostes/source` export conditions for instant HMR.
   - `0004-postgresql-relational-store`: PostgreSQL 16 as canonical ACID store.
   - `0005-sqlalchemy-async-alembic`: SQLAlchemy 2.0 async ORM and Alembic schema diffing.
   - `0006-shared-database-per-module-migrations`: Single database connection pool with per-module table ownership.
   - `0007-uuidv4-primary-keys`: Client-side key generation and enumeration prevention via UUIDv4.
   - `0008-universal-soft-delete`: Universal soft-delete semantics (`deleted_at`/`deleted_by`).
   - `0009-standardised-audit-columns`: Universal audit trail (`created_by`/`updated_by`).
   - `0010-jwt-access-rotating-refresh-tokens`: 30m JWT access tokens with 7d refresh token family rotation.
   - `0011-multi-tenancy-header-membership`: `X-Tenant-ID` scoping and membership verification.
   - `0012-rfc-7807-problem-details`: Machine-readable `ErrorResponse` problem payloads.
   - `0013-headless-tailwind-ui-package`: 238 accessible enterprise UI components in `@innostes/ui`.
   - `0014-first-run-setup-gate`: Ephemeral setup token and setup required middleware gating.
   - `0015-single-use-rotating-refresh-family`: Automatic token replay/theft detection and session termination.
   - `0016-nextjs-fumadocs-docs-site`: Static site generation for documentation portal.
4. Authored 2 proposed ADRs for pending architecture decisions:
   - `0017-database-row-level-security`: PostgreSQL Row-Level Security for defense-in-depth multi-tenancy.
   - `0018-dynamic-frontend-module-manifests`: Dynamic runtime frontend manifest loading.
5. Registered `decisions/meta.json` and linked in `architecture/meta.json`.
**Changed**: `apps/landing/content/dev-docs/architecture/decisions/*`, `architecture/meta.json`, `apps/landing/scripts/generate-adrs.py`, `PROGRESS.md`, `09-adrs.md` deleted.
**Code changes**: Added `generate-adrs.py`.
**Decisions**:
- Registered all 18 ADRs in `decisions/meta.json` and validated MADR 4.x compliance via `check-adrs.mjs`.
**Verification**:
- `node apps/landing/scripts/checks/check-adrs.mjs`: PASSED (19 ADR files verified).
- `pnpm run arch-check`: PASSED.
- `pnpm nx run landing:arch-docs-check`: PASSED (all 6 gates passed, 39 architecture pages verified).
- `pnpm nx run landing:docs-check`: PASSED (all 16 quality gates passed).
**Open issues**:
- Non-blocking: `ARC-002` (feature circular dependencies recorded with narrow exceptions in `.importlinter`, to be addressed in Prompt 10).

## 10 – Quality scenarios, risk register and glossary – 2026-10-29
**Summary**: Authored arc42 sections 10–12 completing full arc42 framework coverage:
1. Created `apps/landing/content/dev-docs/architecture/quality-requirements.mdx` (arc42 §10):
   - Rendered ISO/IEC 25010 Quality Tree using Mermaid flowchart diagram across Modifiability, Security, Maintainability, and Operability.
   - Authored 8 concrete six-part quality scenarios (source, stimulus, artefact, environment, response, response measure) with automated verification mechanisms.
2. Created `apps/landing/content/dev-docs/architecture/risks-and-technical-debt.mdx` (arc42 §11):
   - Authored formal Architectural Risk Register with 5 scored items (`RISK-001` through `RISK-005`) covering application-layer tenancy, edge rate limiting, UI coupling, and statutory data retention.
   - Authored Technical Debt Backlog with 3 tracked items (`DEBT-001` through `DEBT-003`) including the feature circular dependency exceptions in `.importlinter` (`ARC-002`).
3. Created `apps/landing/content/dev-docs/architecture/glossary.mdx` (arc42 §12):
   - Defined 18 canonical platform terms with precise codebase mappings and British English spellings.
4. Switched arc42 coverage gate to **enforce mode** in `apps/landing/scripts/checks/run-arch-checks.mjs`:
   - Verified 100% coverage (12/12 arc42 sections covered).
5. Updated `apps/landing/content/dev-docs/architecture/meta.json` with the new pages.
**Changed**: `apps/landing/content/dev-docs/architecture/quality-requirements.mdx`, `risks-and-technical-debt.mdx`, `glossary.mdx`, `meta.json`, `run-arch-checks.mjs`, `PROGRESS.md`, `10-quality-risks-glossary.md` deleted.
**Code changes**: Switched `runArc42CoverageCheck` to `{ enforceAll: true }`.
**Decisions**:
- Enforced 12/12 arc42 section completeness across the documentation suite.
**Verification**:
- `pnpm run arch-check`: PASSED.
- `pnpm nx run landing:arch-docs-check`: PASSED (all 6 gates passed, 12/12 arc42 sections enforced, 42 architecture pages verified).
- `pnpm nx run landing:docs-check`: PASSED (all 16 quality gates passed).
**Open issues**:
- None blocking. All risks and debt items are catalogued with designated owners in `risks-and-technical-debt.mdx`.


## 11 – Developer docs alignment – 2026-10-29
**Summary**: Aligned all developer guides and tutorial pages with the completed architecture documentation and verified repository reality:
1. Updated `getting-started.mdx` (Diátaxis tutorial) with explicit "Make your first change" step verifying hot-reload in `web-app` and test pipelines.
2. Synchronised `ci.mdx` with current `.github/workflows/ci.yml`: documented `pnpm/action-setup@v4`, `actions/setup-python`, Playwright browser dependencies, test suites, and fitness function gates (`pnpm run arch-check`). Removed obsolete warning about npm template.
3. Aligned `project-structure.mdx` cross-references with `overview.mdx` (#invariant-rules) and building-blocks.
4. Verified Diátaxis typing, icons, descriptions, and metadata completeness across all developer guide pages.
**Changed**: `apps/landing/content/dev-docs/getting-started.mdx`, `apps/landing/content/dev-docs/guides/ci.mdx`, `apps/landing/content/dev-docs/project-structure.mdx`, `PROGRESS.md`, `11-devdocs-alignment.md` deleted.
**Code changes**: none.
**Decisions**:
- Maintained single source of truth for repository structure and dependency rules in architecture docs with cross-links from developer guides.
**Verification**:
- `pnpm run arch-check`: PASSED.
- `pnpm nx run landing:arch-docs-check`: PASSED (all 6 gates passed, 12/12 arc42 sections enforced, 42 architecture pages verified).
- `pnpm nx run landing:docs-check`: PASSED (all 16 quality gates passed, 0 broken links).
**Open issues**:
- None.


## 12 – QA and editorial pass – 2026-10-29
**Summary**: Executed QA, editorial consistency audit, and end-to-end rendered validation across all documentation sections:
1. Extended Playwright crawl test suite (`apps/landing/e2e/crawl.spec.ts`) to cover all `/docs/**` routes in light/dark modes and mobile (360px) / desktop viewports with Axe-core WCAG 2.2 AA accessibility checks.
2. Verified all 288 static SSG and prerendered routes compile with zero failures in `pnpm nx build landing`.
3. Registered missing Lucide icon components (`ListChecks`, `ShieldCheck`, `FolderTree`, `FileText`) in `components/mdx.tsx`.
4. Corrected `apps/landing/scripts/generate-adrs.py` relative directory resolution and verified all 6 code generator stale checks pass with zero diff.
5. Confirmed British English, sentence case, and absence of marketing jargon across all architecture and developer guides.
**Changed**: `apps/landing/components/mdx.tsx`, `apps/landing/e2e/crawl.spec.ts`, `apps/landing/lib/tokens-data.json`, `apps/landing/scripts/generate-adrs.py`, `PROGRESS.md`, `12-qa-editorial.md` deleted.
**Code changes**: Registered MDX icons, fixed script path in `generate-adrs.py`.
**Decisions**:
- Integrated `/docs/**` into automated Playwright crawl and accessibility audit.
**Verification**:
- `pnpm run arch-check`: PASSED.
- `pnpm nx run landing:arch-docs-check`: PASSED (all 6 gates passed, 12/12 arc42 sections enforced, 42 architecture pages verified).
- `pnpm nx run landing:docs-check`: PASSED (all 16 quality gates passed).
- `pnpm nx build landing`: PASSED (288/288 static pages compiled with 0 errors).
**Open issues**:
- None.


## 13 – Checklist verification – 2026-10-29
**Summary**: Executed complete, independent architecture compliance verification across the entire monorepo and produced the comprehensive verification report `CHECKLIST-REPORT.md`:
1. Audited all 42 architecture, operations, and decision pages against checklist requirements A1–A10 with concrete code citations for every factual statement.
2. Verified all 20 Mermaid diagrams against D1–D7 (C4 standards, code-verified element naming, descriptive text alternatives in captions, responsive layout in `<Diagram>`).
3. Verified all 18 MADR architectural decision records against R1–R9.
4. Verified all 8 architecture fitness functions (5 Python `import-linter` contracts, 1 TypeScript boundaries gate, 2 Python architectural unit tests) against F1–F4.
5. Re-reviewed the single justified exception (`EXC-001` / `DEBT-001` / `ARC-002`) allowlisted in `.importlinter` and catalogued in `risks-and-technical-debt.mdx`.
6. Generated `agent-prompts/architecture-docs/CHECKLIST-REPORT.md` documenting 100% compliance across all 12 arc42 sections with 0 failing checks.
**Changed**: `agent-prompts/architecture-docs/CHECKLIST-REPORT.md`, `PROGRESS.md`, `13-checklist-verification.md` deleted.
**Code changes**: none.
**Decisions**:
- Certified 100% arc42 completeness and standards compliance across the Innostes ERP architecture documentation suite.
**Verification**:
- `pnpm run arch-check`: PASSED (all 5 import-linter contracts kept, 167 TS files checked, 2 unit tests passed).
- `pnpm nx run landing:arch-docs-check`: PASSED (all 6 gates passed, 12/12 arc42 sections covered, 42 files verified).
- `pnpm nx run landing:docs-check`: PASSED (all 16 quality gates passed).
- `pnpm nx build landing --skip-nx-cache`: PASSED (288/288 static SSG routes compiled without errors).
**Open issues**:
- None.
