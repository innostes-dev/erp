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
