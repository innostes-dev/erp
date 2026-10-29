"""Generate all 18 MADR 4.x architectural decision records."""

import json
from pathlib import Path

decisions_dir = Path(__file__).resolve().parents[1] / "content" / "dev-docs" / "architecture" / "decisions"
decisions_dir.mkdir(parents=True, exist_ok=True)

adrs_data = [
    {
        "num": "0001",
        "slug": "engine-plugin-inversion",
        "title": "ADR-0001: Engine-Plugin Inversion Architecture",
        "desc": "Separation of plumbing engines from business feature modules.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "Enterprise ERP platforms typically degrade into monolithic tangles where core framework code intermingles with business domain logic (e.g. sales, CRM, HRMS). We need an architectural separation that allows independent development of features without bloating the core runtime.",
        "drivers": [
            "Enable independent authoring of business features without modifying engine source code.",
            "Guarantee that the kernel and engines provide zero business logic of their own.",
            "Enforce strict modular boundaries using automated linting.",
        ],
        "options": [
            "Traditional layered monolith with shared models and routers.",
            "Microservices architecture with separate services per domain.",
            "Modular monolith with engine-plugin inversion (BaseModule contract and entry points).",
        ],
        "outcome": "Modular monolith with engine-plugin inversion. The platform provides two lightweight engines (apps/api-server and apps/web-app) that host independent plug-in modules discovered via Python package entry points and workspace exports.",
        "pros": [
            "Business modules can be scaffolded, installed, or removed without modifying engine code.",
            "Zero network latency or distributed transaction complexities compared to microservices.",
            "Enforced by automated import-linter contracts in CI (Rule 1, Rule 2, Rule 3).",
        ],
        "cons": [
            "Modules must adhere strictly to the BaseModule interface and package structure.",
            "Requires robust monorepo tooling (Nx and pnpm) to manage workspace dependencies.",
        ],
        "confirmation": "Enforced by `.importlinter` contracts verifying that engines never import specific plug-ins and plug-ins never import engines.",
    },
    {
        "num": "0002",
        "slug": "fastapi-backend-engine",
        "title": "ADR-0002: FastAPI for the Backend ASGI Engine",
        "desc": "Choice of FastAPI and Uvicorn for high-throughput asynchronous execution.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "The backend engine requires an asynchronous Python runtime capable of handling high-concurrency enterprise workloads, automated OpenAPI contract generation, and native type validation.",
        "drivers": [
            "High async I/O throughput for PostgreSQL queries via asyncpg.",
            "Native generation of OpenAPI 3.1 specifications directly from code.",
            "Declarative request validation and serialisation with Pydantic.",
        ],
        "options": [
            "Django with Django REST Framework (DRF).",
            "Flask with Marshmallow.",
            "FastAPI with Uvicorn and Pydantic.",
        ],
        "outcome": "FastAPI with Uvicorn. The backend engine (`apps/api-server`) mounts modular APIRouters from discovered BaseModule plug-ins.",
        "pros": [
            "Automatic interactive documentation served at `/docs` and `/redoc`.",
            "Native async/await request pipeline with high concurrency performance.",
            "FastAPI dependency injection (`Depends`) simplifies database sessions and authentication scoping.",
        ],
        "cons": [
            "Asynchronous SQLAlchemy requires careful session lifecycle management.",
            "Python async ecosystem requires strict avoidance of blocking CPU operations.",
        ],
        "confirmation": "Verified via `apps/api-server/app/engine/server.py` and automated OpenAPI generation checks in CI.",
    },
    {
        "num": "0003",
        "slug": "react-vite-ui-engine",
        "title": "ADR-0003: React 19 and Vite for UI Engine",
        "desc": "Modern React Single Page Application runtime powered by Vite and Tailwind CSS.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "The frontend application (`apps/web-app`) requires fast local development compilation, support for modern React component primitives, and the ability to consume workspace modules directly.",
        "drivers": [
            "Instant Hot Module Replacement (HMR) without multi-minute pre-bundling.",
            "Direct consumption of `@innostes/kernel` and business module components.",
            "Future-proof component architecture compatible with React 19.",
        ],
        "options": [
            "Next.js client-side SPA mode.",
            "Webpack / Create React App.",
            "Vite 6 with React 19 and `@innostes/source` export conditions.",
        ],
        "outcome": "Vite with React 19. Vite compiles workspace TypeScript packages on the fly using `@innostes/source` export conditions.",
        "pros": [
            "Sub-second local startup times and instant HMR.",
            "Zero pre-build step required when editing packages or modules.",
            "Clean decoupling between static SPA and backend ASGI API.",
        ],
        "cons": [
            "Client-side routing requires proper fallback configuration on reverse proxies.",
            "React 19 compatibility across third-party libraries requires automated verification.",
        ],
        "confirmation": "Verified by `apps/web-app/src/main.tsx` and React 17/18 compatibility test suites.",
    },
    {
        "num": "0004",
        "slug": "postgresql-relational-store",
        "title": "ADR-0004: PostgreSQL 16 as Canonical Relational Store",
        "desc": "Standardising on PostgreSQL for transactional ACID consistency and JSONB flexibility.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "Enterprise ERP platforms manage financial, organisational, and audit data requiring strict ACID transactional guarantees, relational foreign keys, and performant semi-structured attributes.",
        "drivers": [
            "Strong ACID compliance and relational integrity.",
            "Robust JSONB indexing for extensible configuration documents.",
            "Transactional advisory locks for concurrent migration safety.",
        ],
        "options": [
            "MySQL / MariaDB.",
            "MongoDB / NoSQL document store.",
            "PostgreSQL 16.",
        ],
        "outcome": "PostgreSQL 16. Serves as the single source of truth for all 18 core tables and plug-in domain entities.",
        "pros": [
            "Advanced relational features: partial indexes, advisory locks, and JSONB operators.",
            "Universal cloud support (AWS RDS, GCP Cloud SQL, Azure Database).",
            "Future-proof path for PostgreSQL Row-Level Security (RLS).",
        ],
        "cons": [
            "Horizontal scaling requires read replicas or partitioned multi-database sharding.",
        ],
        "confirmation": "Enforced in `docker-compose.yml` and `kernel/core/database/db_settings.py`.",
    },
    {
        "num": "0005",
        "slug": "sqlalchemy-async-alembic",
        "title": "ADR-0005: SQLAlchemy 2.0 Async Engine and Alembic Migrations",
        "desc": "Adopting SQLAlchemy 2.0 declarative models and Alembic migration tracking.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "Python backend services need a strongly-typed Object Relational Mapper (ORM) that integrates natively with asyncpg and provides repeatable, versioned schema migrations.",
        "drivers": [
            "Type-safe Python 3.10+ model definitions (`Mapped[T]`, `mapped_column`).",
            "Non-blocking async query execution via `asyncpg`.",
            "Automated schema diffing and migration tracking.",
        ],
        "options": [
            "Tortoise ORM or Peewee.",
            "Raw SQL with asyncpg.",
            "SQLAlchemy 2.0 with Alembic.",
        ],
        "outcome": "SQLAlchemy 2.0 with Alembic. Models inherit from a shared declarative `Base` in `kernel.core.database`.",
        "pros": [
            "Mature, enterprise-proven ORM with complete SQL dialect coverage.",
            "Alembic auto-generates schema diffs based on model class changes.",
            "Managed `AsyncSession` scoping in FastAPI dependencies.",
        ],
        "cons": [
            "Strict separation between async queries and synchronous attributes requires `lazy='selectin'` or explicit joins.",
        ],
        "confirmation": "Enforced by `kernel/backend/tests/test_architecture_fitness.py`.",
    },
    {
        "num": "0006",
        "slug": "shared-database-per-module-migrations",
        "title": "ADR-0006: Monolithic Shared Database with Per-Module Migration Isolation",
        "desc": "Single database connection pool with module-owned tables and isolated migrations.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "Balancing operational simplicity against modularity: running separate databases per ERP module creates operational overhead and distributed transaction issues.",
        "drivers": [
            "Operational simplicity: a single database cluster to back up, monitor, and scale.",
            "Transactional integrity: atomic commits across tenant and user provisioning.",
            "Modular ownership: plug-ins own distinct table namespaces.",
        ],
        "options": [
            "Database-per-module (microservices database pattern).",
            "Shared database with shared global migrations.",
            "Shared database with per-module table namespaces and migration paths.",
        ],
        "outcome": "Shared database with per-module table ownership. Modules define their own models and migrations path while sharing the SQLAlchemy metadata engine.",
        "pros": [
            "Single connection pool managed by `api-server` via `kernel.core.database`.",
            "Seamless atomic transactions during cross-cutting setup and tenant onboarding.",
            "No distributed two-phase commit overhead.",
        ],
        "cons": [
            "Requires discipline: modules must never alter or foreign-key directly to other modules' private tables.",
        ],
        "confirmation": "Enforced by `.importlinter` Rule 4 and `check-ts-boundaries.mjs`.",
    },
    {
        "num": "0007",
        "slug": "uuidv4-primary-keys",
        "title": "ADR-0007: Universally Unique Identifiers (UUIDv4) for Primary Keys",
        "desc": "Adopting RFC 4122 UUID v4 strings across all relational tables.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "Auto-incrementing integer IDs leak business metrics (e.g. number of orders or customers), are vulnerable to enumeration attacks, and prevent client-side key generation.",
        "drivers": [
            "Prevent identifier enumeration and business metric leakage.",
            "Enable client-side key generation before persistence.",
            "Seamless multi-tenant data merging and replication.",
        ],
        "options": [
            "Sequential auto-incrementing integers (BIGSERIAL).",
            "ULID / UUIDv7 (time-ordered).",
            "UUIDv4 via `uuid.uuid4()`.",
        ],
        "outcome": "UUIDv4 primary keys via `UUIDPrimaryKeyMixin` on `BaseModel`.",
        "pros": [
            "Globally unique across all distributed nodes and client sessions.",
            "Zero enumeration vulnerability across public REST endpoints.",
            "Clients and sub-services can generate IDs prior to database commits.",
        ],
        "cons": [
            "16-byte storage overhead and B-tree page fragmentation compared to sequential integers.",
        ],
        "confirmation": "Enforced by `kernel/backend/tests/test_architecture_fitness.py` verifying all tables have UUID primary keys.",
    },
    {
        "num": "0008",
        "slug": "universal-soft-delete",
        "title": "ADR-0008: Universal Soft Delete via deleted_at and deleted_by",
        "desc": "Prohibiting physical deletions in favour of audit-tracked soft deletion.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "Accidental deletion of enterprise data causes catastrophic operational impact. Regulatory frameworks (such as Indian corporate law and GDPR) require data retention and audit traceability.",
        "drivers": [
            "Prevent catastrophic data loss from accidental user deletion.",
            "Retain historical audit records for regulatory compliance.",
            "Enable single-click restoration of erroneously deleted entities.",
        ],
        "options": [
            "Hard physical SQL DELETE statements.",
            "Archiving deleted records into separate history tables.",
            "In-place soft deletion via `deleted_at` and `deleted_by` columns.",
        ],
        "outcome": "In-place soft deletion via `SoftDeleteMixin`. Physical `DELETE` statements are prohibited in application code.",
        "pros": [
            "Seamless query filtering: `BaseService` automatically appends `WHERE deleted_at IS NULL`.",
            "Full attribution: `deleted_by` identifies who initiated the removal.",
            "Instant recovery via `service.restore(id)`.",
        ],
        "cons": [
            "Unique constraints on fields like `slug` require partial indexes (`WHERE deleted_at IS NULL`).",
            "Table storage grows over time requiring periodic purging policies.",
        ],
        "confirmation": "Enforced by `SoftDeleteMixin` and `BaseService.soft_delete`.",
    },
    {
        "num": "0009",
        "slug": "standardised-audit-columns",
        "title": "ADR-0009: Standardised Audit Columns on Every Entity",
        "desc": "Universal tracking of timestamps and actor attribution across all records.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "Auditors and enterprise compliance teams require complete non-repudiation: who created every record, when, and who performed the last update.",
        "drivers": [
            "Complete non-repudiation across all business entities.",
            "Uniform attribute names across all tables to simplify reporting.",
            "Automated attribution without manual developer plumbing.",
        ],
        "options": [
            "Ad-hoc timestamp columns added manually per table.",
            "Database triggers recording mutations in an external log table.",
            "Universal `AuditMixin` and `TimestampMixin` inherited by `BaseModel`.",
        ],
        "outcome": "Universal `AuditMixin` providing `created_at`, `created_by`, `updated_at`, `updated_by` on every entity.",
        "pros": [
            "Consistency: every entity exhibits identical audit properties.",
            "`BaseService` automatically binds the active `actor_id` during CRUD operations.",
            "UTC timestamps ensure timezone ambiguity is eliminated.",
        ],
        "cons": [
            "Audit columns add 32 bytes of metadata per row.",
        ],
        "confirmation": "Checked by `test_architecture_fitness.py` asserting audit columns on all registered models.",
    },
    {
        "num": "0010",
        "slug": "jwt-access-rotating-refresh-tokens",
        "title": "ADR-0010: JWT Access and Refresh Tokens with Token Family Rotation",
        "desc": "Stateless 30-minute access tokens paired with rotating 7-day refresh tokens.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "High-scale enterprise APIs need stateless authentication to allow horizontal scaling while retaining the ability to revoke compromised sessions immediately.",
        "drivers": [
            "Stateless token validation for API performance.",
            "Immediate session revocation capability.",
            "Protection against refresh token replay and theft.",
        ],
        "options": [
            "Server-side stateful session cookies with Redis.",
            "Long-lived static API tokens.",
            "Short-lived JWT access tokens with rotating single-use refresh tokens.",
        ],
        "outcome": "Short-lived JWT access tokens (30 minutes) paired with single-use rotating refresh tokens (7 days).",
        "pros": [
            "Stateless signature verification eliminates database queries on fast-path API requests.",
            "Token reuse detection invalidates the entire token family if a stolen token is replayed.",
            "Granular device and session tracking via `user_devices` and `user_sessions`.",
        ],
        "cons": [
            "Access tokens cannot be revoked until their 30-minute expiration without a token blocklist.",
        ],
        "confirmation": "Verified by `kernel.auth.services.auth_service` test suite in `kernel/backend/tests/`.",
    },
    {
        "num": "0011",
        "slug": "multi-tenancy-header-membership",
        "title": "ADR-0011: Multi-Tenancy Scoping via X-Tenant-ID and Membership Verification",
        "desc": "Resolving active organisation context via request headers and membership verification.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "Enterprise users often belong to multiple organisations (e.g. parent company and regional distribution subsidiaries). The platform must securely scope requests to the active tenant.",
        "drivers": [
            "Allow users to switch between organisations without re-authenticating.",
            "Prevent cross-tenant data leakage.",
            "Enforce tenant module activation checks.",
        ],
        "options": [
            "Subdomain-based multi-tenancy (`tenant.innostes.example`).",
            "Path-based multi-tenancy (`/tenants/:id/crm/leads`).",
            "Header-based multi-tenancy (`X-Tenant-ID`) with dependency verification.",
        ],
        "outcome": "Header-based multi-tenancy via `X-Tenant-ID`. Dependencies verify user membership in `tenant_members` and module enablement in `tenant_modules`.",
        "pros": [
            "Clean REST URI structures without repetitive tenant path prefixes.",
            "Single frontend client can switch organisations seamlessly via state context.",
            "Enforced at the dependency injection layer before route handlers execute.",
        ],
        "cons": [
            "API consumers must remember to include the `X-Tenant-ID` header on tenant-scoped routes.",
        ],
        "confirmation": "Enforced by `get_current_tenant_id` dependency in `kernel.tenancy.dependencies`.",
    },
    {
        "num": "0012",
        "slug": "rfc-7807-problem-details",
        "title": "ADR-0012: RFC 7807 Problem Details for HTTP Error Responses",
        "desc": "Standardising machine-readable error responses across all API endpoints.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "Inconsistent error payloads (some strings, some dicts, some HTML) cause client-side parsing failures and degrade developer experience.",
        "drivers": [
            "Predictable, uniform error payloads across all modules.",
            "Machine-readable error codes for programmatic client handling.",
            "Sanitisation of internal stack traces and database credentials.",
        ],
        "options": [
            "Ad-hoc dictionary payloads `{'error': '...'}`.",
            "GraphQL-style error lists.",
            "RFC 7807 Problem Details (`ErrorResponse`).",
        ],
        "outcome": "RFC 7807 compliant `ErrorResponse` containing `detail` and optional machine `code`.",
        "pros": [
            "Client libraries can reliably parse `detail` and switch on `code`.",
            "Enforced centrally via `register_error_handlers` in `kernel.core.http`.",
            "Verified by the API documentation freshness and sample gates.",
        ],
        "cons": [
            "All custom exceptions must be registered in the error handler mapper.",
        ],
        "confirmation": "Enforced by `check-catalogues.mjs` verifying all `ErrorCode` constants match documentation.",
    },
    {
        "num": "0013",
        "slug": "headless-tailwind-ui-package",
        "title": "ADR-0013: Headless UI Components with Tailwind CSS in @innostes/ui",
        "desc": "Building a centralised design system package using Tailwind v4 and accessible primitives.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "UI inconsistency across business modules leads to poor user experience. We need a shared design system that enforces accessible enterprise components.",
        "drivers": [
            "Accessible, responsive enterprise UI components (WAI-ARIA).",
            "Unified design tokens (colours, spacing, typography, contrast).",
            "Zero runtime styling overhead via Tailwind CSS.",
        ],
        "options": [
            "Heavy monolithic UI framework (MUI or Ant Design).",
            "Raw unstyled HTML with module-specific stylesheets.",
            "Custom headless primitives styled with Tailwind CSS in `@innostes/ui`.",
        ],
        "outcome": "Custom component library in `packages/ui` (`@innostes/ui`) styled with Tailwind CSS and CSS design tokens.",
        "pros": [
            "238 accessible components, widgets, and charts shared across all apps.",
            "Light and dark theme support with automated contrast ratio verification.",
            "Strict isolation: modules never reinvent form controls, tables, or modals.",
        ],
        "cons": [
            "Component updates require maintaining backward compatibility for existing consumers.",
        ],
        "confirmation": "Verified by `landing:docs-check` and UI React 17/18 compatibility test suites.",
    },
    {
        "num": "0014",
        "slug": "first-run-setup-gate",
        "title": "ADR-0014: First-Run Setup Gate with Ephemeral Setup Token",
        "desc": "Locking platform endpoints until initial organization and administrator provisioning.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "An unprovisioned ERP instance deployed to a public server must not expose operational endpoints or allow unauthorized users to register as the root administrator.",
        "drivers": [
            "Prevent hostile takeover of fresh installations.",
            "Guide initial operators through zero-config onboarding.",
            "Provide both Web wizard and automated CLI provisioning paths.",
        ],
        "options": [
            "Open registration for the first user.",
            "Static default admin credentials (`admin/admin`).",
            "SetupRequiredMiddleware gating with 256-bit token authorization.",
        ],
        "outcome": "SetupRequiredMiddleware intercepts all traffic until the `installation` table is populated. Access to `/setup` routes requires an ephemeral 256-bit token.",
        "pros": [
            "Default admin credentials eliminated entirely.",
            "Uninitialised instances return 503 `setup_required` on all normal routes.",
            "Token is rate-limited (10 attempts / 15 mins) and disabled post-installation.",
        ],
        "cons": [
            "Operators must retrieve the setup token from server logs or environment variables.",
        ],
        "confirmation": "Verified by `kernel/backend/tests/` setup test cases.",
    },
    {
        "num": "0015",
        "slug": "single-use-rotating-refresh-family",
        "title": "ADR-0015: Single-Use Rotating Refresh Token Families for Replay Detection",
        "desc": "Mitigating refresh token theft via cryptographic token family rotation.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "If an attacker steals a long-lived refresh token, they can maintain persistent unauthorized access indefinitely unless the system detects replay attacks.",
        "drivers": [
            "Detect token theft automatically without manual user reports.",
            "Instantly invalidate compromised session hierarchies.",
            "Maintain smooth session continuity for legitimate users.",
        ],
        "options": [
            "Static non-rotating refresh tokens.",
            "Server-side token revocation list with short expirations.",
            "Token Family Rotation with immediate reuse invalidation.",
        ],
        "outcome": "Every refresh request rotates the token. If an already-revoked token is presented, the system treats it as token theft and revokes the entire token family.",
        "pros": [
            "Automated security containment: compromised sessions are terminated instantly.",
            "Limits attacker window to single use.",
            "Full traceability in `user_sessions` and security audit logs.",
        ],
        "cons": [
            "Legitimate concurrent requests from multiple browser tabs can trigger false-positive revocations if not debounced.",
        ],
        "confirmation": "Enforced by `AuthService.rotate_refresh_token` in `kernel.auth.services`.",
    },
    {
        "num": "0016",
        "slug": "nextjs-fumadocs-docs-site",
        "title": "ADR-0016: Next.js and Fumadocs for Documentation Site",
        "desc": "Static site generation with MDX and Fumadocs for the developer documentation portal.",
        "status": "accepted (recorded retroactively on 2026-10-29)",
        "context": "The documentation portal (`apps/landing`) requires fast full-text search, interactive API reference exploration, embedded React component playgrounds, and arc42 compliance.",
        "drivers": [
            "High performance Static Site Generation (SSG) with zero runtime database dependencies.",
            "Rich MDX authoring with custom React components (`<Diagram>`, `<ApiTable>`).",
            "Automated docs-as-code quality gates in CI.",
        ],
        "options": [
            "Docusaurus.",
            "MkDocs with Material theme.",
            "Next.js 15 with Fumadocs.",
        ],
        "outcome": "Next.js with Fumadocs. Powers `/docs`, `/api-reference`, and `/ui/docs`.",
        "pros": [
            "Direct integration with monorepo packages (`@innostes/ui`).",
            "Interactive OpenAPI explorer generated directly from FastAPI's schema.",
            "Sub-second client-side page transitions and built-in full-text search.",
        ],
        "cons": [
            "Requires Node.js runtime and Next.js build pipeline.",
        ],
        "confirmation": "Enforced by `landing:docs-check` and `landing:build` static generation.",
    },
    {
        "num": "0017",
        "slug": "database-row-level-security",
        "title": "ADR-0017: PostgreSQL Row-Level Security for Multi-Tenancy",
        "desc": "Evaluating PostgreSQL Row-Level Security (RLS) for defense-in-depth tenant isolation.",
        "status": "proposed",
        "context": "Currently, multi-tenant data isolation is enforced at the application service layer via `BaseService` filtering (`WHERE tenant_id = :t`). If an engineer writes a custom raw SQL query that omits this clause, cross-tenant data leakage could occur.",
        "drivers": [
            "Defense-in-depth: database-level guarantee that cross-tenant queries cannot execute.",
            "Protection against developer error in custom SQL queries.",
            "Minimal performance overhead on PostgreSQL connection pooling.",
        ],
        "options": [
            "Maintain application-layer filtering exclusively.",
            "Adopt database-per-tenant sharding.",
            "Implement PostgreSQL Row-Level Security (RLS) with session-local variables (`SET LOCAL app.current_tenant_id`).",
        ],
        "outcome": "Proposed: Implement PostgreSQL RLS policies on all tenant-scoped tables as a secondary defense layer while keeping application-layer filtering in `BaseService`.",
        "pros": [
            "Guarantees that even raw SQL queries or faulty service methods cannot access other tenants' data.",
            "Auditable directly inside PostgreSQL schema definitions.",
        ],
        "cons": [
            "Requires setting session-local variables on every checked-out connection in the pool.",
            "Bypassed by superusers unless explicitly configured with `FORCE ROW LEVEL SECURITY`.",
        ],
        "confirmation": "Will be confirmed via database penetration tests and latency benchmarks.",
    },
    {
        "num": "0018",
        "slug": "dynamic-frontend-module-manifests",
        "title": "ADR-0018: Dynamic Runtime Frontend Module Manifest Discovery",
        "desc": "Transitioning from compile-time module imports to dynamic runtime manifest loading.",
        "status": "proposed",
        "context": "Currently, `apps/web-app` imports business module manifests statically from `@innostes/crm` and `@innostes/hrms` in `apps/web-app/src/app/catalog.ts`. While fast, this couples the UI engine package to specific modules at build time.",
        "drivers": [
            "Decouple `apps/web-app` from compile-time dependencies on optional business modules.",
            "Match the backend engine's dynamic `ModuleLoader.discover()` pattern.",
            "Enable runtime module loading and tenant-specific bundle downloads.",
        ],
        "options": [
            "Retain static compile-time catalog imports in `apps/web-app`.",
            "Microfrontends via Module Federation.",
            "Dynamic runtime manifest discovery and lazy-loaded module chunks.",
        ],
        "outcome": "Proposed: Implement a runtime module manifest loader where `apps/web-app` fetches active tenant modules from `GET /tenants/current/modules` and dynamically imports component chunks.",
        "pros": [
            "`apps/web-app` contains zero hardcoded references to business modules.",
            "Reduces initial bundle size for tenants that only use a subset of modules.",
        ],
        "cons": [
            "Increases client-side dynamic loading complexity and error boundary requirements.",
        ],
        "confirmation": "Will be confirmed via bundle analysis and dynamic loading test suites.",
    },
]

for adr in adrs_data:
    filename = f"{adr['num']}-{adr['slug']}.mdx"
    filepath = decisions_dir / filename
    drivers_list = "\n".join(f"- {d}" for d in adr["drivers"])
    options_list = "\n".join(f"- {o}" for o in adr["options"])
    pros_list = "\n".join(f"- Good, because {p}" for p in adr["pros"])
    cons_list = "\n".join(f"- Bad, because {c}" for c in adr["cons"])

    content = f"""---
title: "{adr['title']}"
description: "{adr['desc']}"
icon: GitCommit
owner: Platform Architecture Team
lastReviewed: 2026-10-29
arc42: 9
status: {adr['status'].split()[0]}
date: 2026-10-29
deciders: ["Platform Architecture Team", "Platform Engineering"]
---

# {adr['title']}

- **Status**: {adr['status']}
- **Date**: 2026-10-29
- **Deciders**: Platform Architecture Team, Platform Engineering
- **Consulted**: Security Architecture, Core Platform Team
- **Informed**: Developer Community

## Context and Problem Statement

{adr['context']}

## Decision Drivers

{drivers_list}

## Considered Options

{options_list}

## Decision Outcome

Chosen option: "{adr['options'][-1]}", because {adr['outcome']}

### Consequences

{pros_list}
{cons_list}

## Confirmation

{adr['confirmation']}
"""
    filepath.write_text(content, encoding="utf-8")
    print(f"Wrote ADR: {filename}")

# Generate index.mdx
rows = []
for adr in adrs_data:
    status_badge = f"`{adr['status']}`"
    link = f"[{adr['title'].split(':')[0]}](/docs/architecture/decisions/{adr['num']}-{adr['slug']})"
    rows.append(f"| {adr['num']} | {link} | {adr['title'].split(': ')[1]} | {status_badge} | 2026-10-29 |")

index_content = f"""---
title: Architecture Decision Log
description: Complete index of all formal Markdown Architectural Decision Records (MADR 4.x) for Innostes ERP.
icon: BookOpen
owner: Platform Architecture Team
lastReviewed: 2026-10-29
arc42: 9
---

The **Architecture Decision Log** (arc42 §9) records all significant architectural choices made across the Innostes ERP platform using the **MADR 4.x template**.

Decisions are immutable once accepted. Any change to an accepted decision requires proposing a new ADR that explicitly supersedes the prior record.

---

## Decision Log Index

| Number | Identifier | Decision Title | Status | Date |
|:---:|:---|:---|:---:|:---:|
{chr(10).join(rows)}

---

## Decision Lifecycle & Governance

1. **Proposed**: An architecture question or design change is drafted using the [ADR Template](/docs/architecture/decisions/0000-template).
2. **Review**: The Platform Architecture Review Board evaluates the proposal during weekly architecture reviews.
3. **Accepted**: The decision is committed and linked to automated fitness functions verifying its invariants in CI.
4. **Superseded**: If technical requirements change, a new ADR is authored that references the old ADR via `supersedes: NNNN`.
"""
(decisions_dir / "index.mdx").write_text(index_content, encoding="utf-8")
print("Wrote decisions/index.mdx")

# Generate meta.json
pages_list = ["index", "0000-template"] + [f"{a['num']}-{a['slug']}" for a in adrs_data]
meta_content = {
    "title": "Decisions",
    "pages": pages_list
}
(decisions_dir / "meta.json").write_text(json.dumps(meta_content, indent=2) + "\n", encoding="utf-8")
print("Wrote decisions/meta.json")
