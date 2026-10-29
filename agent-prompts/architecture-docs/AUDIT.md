# Architecture Documentation Audit

**Date**: 2026-10-29  
**Branch**: `main`  
**Commit**: `739fcdf` (Clean working tree)  
**Auditor**: Principal Software Architect  
**Scope**: Verification of architectural claims across existing developer documentation, code analysis across `apps/*`, `kernel/*`, `modules/*`, `plugins/*`, and identification of gaps against the arc42 framework (v8), C4 model, MADR ADRs, and OWASP STRIDE threat model.

---

## 1. Baseline

- **Repository**: Monorepo managed by Nx 23.2.0, pnpm 9.x, Python 3.10+, TypeScript 5.7+
- **Docs Build**: `pnpm nx build landing` passes cleanly (SSG: 249 pages generated in 41s).
- **Test Baseline**: `pnpm nx run-many -t test` passes cleanly (6 tasks: `ui:build`, `ui:test`, `ui-react17-tests:test`, `ui-react18-tests:test`, `kernel-backend:test`, `api-server:test` [120 tests passed]).
- **Python Backend Engine**: `apps/api-server` hosting FastAPI, connected to PostgreSQL 16 via async SQLAlchemy (`asyncpg`).
- **Frontend UI Engine**: `apps/web-app` React 19 single-page app bundled with Vite.

---

## 2. Summary: Five Most Damaging Inaccuracies or Gaps

1. **Undocumented Security & IAM Architecture (False Status Claims)**:
   Existing architecture docs (`overview.mdx`, `kernel.mdx`, `apps/api-server.mdx`) state:
   > *"No access control yet: get_actor_id does not reject anonymous requests. Endpoints are open until identity and access features add authentication and permission checks."*  
   > *"Next: identity (users), access (roles and permissions), audit."*
   **Reality**: The identity (`kernel.user`) and authentication/authorization (`kernel.auth`) modules are **fully implemented and mounted**! They provide JWT authentication with refresh token family rotation, user sessions, user device tracking, password history, password reset flows, RBAC permissions, and API key management (`api_keys`). Describing the system as open and unauthenticated misrepresents the security posture.

2. **Undocumented Business Modules and Plugins Ecosystem**:
   Existing docs (`overview.mdx`, `web-app.mdx`) state that `modules` holds `(future ERP modules)` and that dynamic plugin/module page loading in `web-app` is "still to come".
   **Reality**: `modules/hrms`, `modules/crm`, and `plugins/api-logger` are already developed with full backend packages and frontend packages (`@innostes/hrms`, `@innostes/crm`, `@innostes/api-logger`). In `apps/web-app`, `catalog.ts`, `AppRouter`, `ModuleShellLayout`, and `PluginShellLayout` dynamically render and route these modules per tenant.

3. **Zero Architectural Fitness Functions or CI Guardrails (Rule Enforcement Void)**:
   `overview.mdx` specifies 5 critical dependency rules (e.g. engines never import plugins, kernel never imports plugins, feature modules follow linear dependency). However, **zero automated checks** (no `import-linter`, no Nx module boundary ESLint tags) currently enforce these boundaries in CI. In fact, bidirectional cross-feature imports already exist in the backend (e.g., `tenancy` imports `auth` and `user`, while `user` imports `auth` and `tenancy`).

4. **Missing Architectural Diagrams (ASCII Art Legacy)**:
   All diagrams across `content/dev-docs/architecture/` are legacy ASCII art in `text` code blocks. There are no C4 model views (System Context Level 1, Container Level 2, Component Level 3), no runtime sequence diagrams, no database Entity-Relationship diagrams, and no deployment diagrams.

5. **Complete Absence of Architecture Decision Records (ADRs)**:
   The repository contains **zero** formal ADRs despite dozens of significant structural commitments baked into the code (FastAPI, React/Vite, asyncpg/SQLAlchemy, UUID v4 primary keys, universal soft delete, envelope encryption with AES-GCM-256, multi-tenancy header scoping, token rotation). Rationale and trade-offs are unrecorded.

---

## 3. Claim Verification Table

| Location | Claim | Truth Value | Evidence / Finding |
|---|---|---|---|
| `overview.mdx:7-9` | "innostes ERP is built from two engines and plug-ins that add features to them. The engines contain no business features of their own." | **True** | `apps/api-server/app/main.py`, `apps/web-app/src/main.tsx`. Engines only configure runtime and discover modules. |
| `overview.mdx:66-70` | "The kernel is in place on both sides... Still to come: a page loader in web-app so plug-ins can register their own pages and menu entries." | **False** | `apps/web-app/src/app/catalog.ts:17-24`, `app.tsx:15-56`. `catalog.ts` imports manifests from `@innostes/hrms`, `@innostes/crm`, and `@innostes/api-logger`. `AppRouter` resolves `/modules/:moduleId` and `/plugins/:pluginId`. |
| `overview.mdx:77-86` | Stated Dependency Rules 1–5: Engines know nothing about specific plug-ins; plug-ins never import engine; kernel depends on no plug-in; modules don't import internals; kernel features order: core ← tenancy ← identity ← access. | **Partly True** | Rules 1 & 2 are respected in code. Rule 5 is violated: `kernel/tenancy/router.py:16` imports `kernel.auth` and `kernel.user`; `kernel/user/services/seeding.py` imports `kernel.tenancy`; `kernel/setup` imports `kernel.tenancy` and `kernel.user`. No CI tool enforces any of these rules. |
| `overview.mdx:87-98` | Request flow: `POST /tenants` with user token, CORS check, setup lock, tenancy router, schema validation, BaseService with `created_by`/`updated_by`, get_db commit. | **True** | `kernel/setup/middleware.py:34`, `kernel/tenancy/router.py:38`, `kernel/core/services/base.py:126`, `kernel/core/database/session.py:53`. |
| `kernel.mdx:9-14` | Kernel holds `core`, `tenancy`, `setup`. "Next: identity (users), access (roles and permissions), audit." | **False** | `kernel/backend/kernel/user` and `kernel/backend/kernel/auth` are already implemented and registered in `pyproject.toml:24-29`. |
| `kernel.mdx:131-157` | Every table inherits `BaseModel` and gets `id` (UUID4), `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`. | **True** | `kernel/core/database/mixins.py:15-92`, `kernel/core/database/base_model.py:12`. All 18 database tables inherit from `BaseModel`. |
| `kernel.mdx:158-165` | Soft delete: `BaseService.get` and `list` hide deleted records unless `include_deleted=True`; `restore` brings record back; `?include_deleted=true` on endpoints. | **True** | `kernel/core/services/base.py:72-115`, `kernel/tenancy/router.py:49`. |
| `kernel.mdx:195-198` | "No access control yet: get_actor_id does not reject anonymous requests. Endpoints are open until identity and access features add authentication and permission checks." | **False** | Full authentication exists in `kernel/auth/dependencies.py:27` (`get_current_user`), `require_super_admin`, and `kernel/user/services/rbac_service.py:33`. Anonymous requests to protected endpoints return `401 Unauthorized`. |
| `kernel.mdx:202-215` | Migrations with Alembic in `kernel/backend`; `AUTO_MIGRATE=true` runs on startup; Postgres advisory lock ensures safe concurrent execution. | **True** | `kernel/core/database/migrations.py:24-60` uses `pg_try_advisory_lock(724819)` and `alembic.command.upgrade`. |
| `plugins.mdx:20-26` | `pyproject.toml` registers `tenancy = "kernel.tenancy:module"`. | **Partly True** | `kernel/backend/pyproject.toml:24-29` registers `setup`, `tenancy`, `user`, and `auth`. Docs mention only `tenancy`. |
| `plugins.mdx:45-50` | `apps/api-server/requirements.txt` lists `-e ../../kernel/backend` and `fastapi[standard]>=0.115`. | **Partly True** | `apps/api-server/requirements.txt:1-6` lists `kernel`, `modules/hrms/backend`, `modules/crm/backend`, `plugins/api-logger/backend`, and `fastapi[standard]>=0.158`. |
| `plugins.mdx:127-134` | "Today web-app uses the kernel directly... The next step, still planned, is page registration." | **False** | Page registration and app switching is implemented via `apps/web-app/src/app/catalog.ts` and `AppRouter`. |
| `setup.mdx:20-22` | Setup token: random 256-bit token saved to `kernel/backend/var/setup-token` and logged; rate limited to 10 attempts / 15 mins (`429`). | **True** | `kernel/setup/services/token_service.py:22-58`, `kernel/setup/dependencies.py:48-75`. |
| `setup.mdx:27-30` | Until installed, routes except `/setup/*`, `/`, `/health`, `/docs` answer 503 `setup_required`. | **True** | `kernel/setup/middleware.py:44-59` checks `is_installed_cached()`. |
| `setup.mdx:34-40` | `/setup/status`, `/setup/checks`, `POST /setup`; actions return 404 once installed. | **True** | `kernel/setup/router.py:42-120`, `kernel/setup/dependencies.py:28-46`. |
| `apps/api-server.mdx:26-38` | Port 8001 default, `DATABASE_URL`, `DB_*` variables, `AUTO_MIGRATE`, `CORS_ORIGINS`, `SETUP_*`, `JWT_SECRET_KEY`. | **True** | `kernel/core/config/settings.py:20-85`, `kernel/core/database/db_settings.py:10-33`. |
| `apps/api-server.mdx:60-66` | Loaded plug-ins: only `setup` and `tenancy`. | **False** | Four kernel modules (`setup`, `tenancy`, `user`, `auth`), two business modules (`hrms`, `crm`), and one plugin (`api-logger`) are loaded. |
| `apps/web-app.mdx:10-18` | "The app itself is still a placeholder." | **False** | App contains complete layout with `SidebarNav`, `TopHeader`, `ModulesManagerPage`, `PluginsManagerPage`, `ApiKeysManager`, `EcosystemHome`, and `AuthGate`. |
| `project-structure.mdx:114-116` | `<Folder name="modules"><Folder name="(future ERP modules)" /></Folder>` | **False** | `modules/hrms` and `modules/crm` already exist. `plugins/api-logger` also exists. |

---

## 4. Rule Enforcement Table

| Stated Rule | Defined In | Automated Enforcement? | Code Conformance | Finding ID |
|---|---|---|---|---|
| Rule 1: Engines never import plugins by name | `overview.mdx:77` | **None** (No import-linter or lint rule) | **Compliant**: `apps/api-server/app` only imports `kernel.core`. (Tests import feature modules). | `ARC-001` |
| Rule 2: Plug-ins never import an engine | `overview.mdx:79` | **None** | **Compliant**: No imports of `apps/api-server` found in `kernel`, `modules`, or `plugins`. | `ARC-001` |
| Rule 3: Kernel depends on no plug-in | `overview.mdx:80` | **None** | **Compliant**: `kernel` has 0 imports from `modules` or `plugins`. | `ARC-001` |
| Rule 4: Business modules do not import each other's internals | `overview.mdx:81` | **None** | **Compliant**: `crm` and `hrms` are decoupled. | `ARC-001` |
| Rule 5: Kernel feature ordering (`core` ← `tenancy` ← `identity` ← `access`) | `overview.mdx:84` | **None** | **Violated**: Bidirectional imports between `tenancy`, `user`, `auth`, and `setup`. | `ARC-002` |
| Backend BaseModule contract | `plugins.mdx:86` | Runtime inheritance only (`BaseModule`) | **Compliant**: All modules subclass `BaseModule`. | `ARC-003` |
| Frontmatter metadata schema (`owner`, `lastReviewed`) | `STANDARDS.md:81` | **None** (Existing Fumadocs schema lacks custom fields) | **Missing**: Frontmatter has no `owner` or `lastReviewed`. | `ARC-004` |
| Mermaid diagram syntax validation in CI | `STANDARDS.md:98` | **None** | **Missing**: No diagram parser/compiler check. | `ARC-005` |
| MADR decision format and numbering validation | `STANDARDS.md:109` | **None** | **Missing**: No MADR gate (0 ADRs exist). | `ARC-006` |

---

## 5. Recovered Architecture (Notes with Evidence)

### 5.1 Containers and Protocols

```
[Browser Client]
       │
       │ HTTPS / JSON (Port 4200 dev, Static CDN prod)
       ▼
[apps/web-app] (React 19 + Vite UI Engine)
       │
       │ HTTP REST / JSON (Port 8001)
       │ Headers: Authorization: Bearer <jwt>, X-Tenant-ID: <uuid>, X-Setup-Token: <token>
       ▼
[apps/api-server] (FastAPI Backend ASGI Engine)
       │
       │ Async PostgreSQL Protocol (TCP Port 5432) via asyncpg
       ▼
[PostgreSQL 16] (Relational Database)
```

- **`apps/web-app`**: Single Page Application, client-side routing via custom navigation context, communicates with backend exclusively over REST HTTP/JSON using `@innostes/kernel`'s `apiRequest` client.
- **`apps/api-server`**: FastAPI 0.158 ASGI application mounted via Uvicorn. Exposes OpenAPI 3.1 schema.
- **`PostgreSQL 16`**: Relational store, connection pooled via SQLAlchemy `AsyncEngine` with `asyncpg` driver (`pool_size=20`, `max_overflow=10`, `pool_pre_ping=True`).
- **`apps/landing`**: Next.js 16.4.2 (Turbopack) + Fumadocs static documentation and landing site.

### 5.2 Backend and Frontend Module Structure

#### Backend (`kernel/backend`, `modules/*`, `plugins/*`):
- **`kernel.core`**: Pure foundation (0 database tables):
  - `config`: `Settings` loaded via `.env` hierarchy.
  - `database`: `AsyncEngine`, `async_sessionmaker`, `Base`, `BaseModel`, mixins (`UUIDPrimaryKeyMixin`, `TimestampMixin`, `AuditMixin`, `SoftDeleteMixin`), migration lock runner.
  - `module`: `BaseModule` abstract contract and `ModuleRegistry`.
  - `schemas`: Pydantic V2 `BaseSchema`, `AuditReadSchema`, `Page[T]`, `ErrorResponse`, `error_responses()`.
  - `security`: JWT encoding/decoding, passlib bcrypt password hashing, `get_actor_id` dependency.
  - `services`: `BaseService[T]` (generic CRUD, soft delete, restore, pagination) and HTTP error classes (`NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `ServiceUnavailableError`, `UnprocessableContentError`).
- **Kernel Platform Modules**:
  - `kernel.setup`: First-run initialization, setup token management, `/setup/status`, `/setup/checks`, `POST /setup`.
  - `kernel.tenancy`: Multi-tenant organization CRUD, tenant settings, membership, module activation records.
  - `kernel.user`: Identity, User, UserProfile, UserIdentity, UserDevice, UserSession, UserSecurity, PasswordHistory, Role, Permission, RolePermission, UserRole (RBAC).
  - `kernel.auth`: Authentication endpoints (`/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/change-password`, `/auth/reset-password/*`, `/auth/api-keys`).
- **Business Modules**:
  - `modules/hrms/backend/hrms`: Employee directory, departments, leave management.
  - `modules/crm/backend/crm`: Leads, contacts, opportunities, pipeline stages.
- **Extensible Plugins**:
  - `plugins/api-logger/backend/api_logger`: Middleware and endpoints for request/response audit telemetry.

#### Frontend (`kernel/frontend`, `apps/web-app`, `modules/*/frontend`, `plugins/*/frontend`):
- **`@innostes/kernel`**: Shared API client (`configureApi`, `apiRequest`, `ApiError`), `SetupGate`, `SetupWizard`, `AuthGate`, `LoginForm`.
- **`@innostes/ui`**: Base UI + Tailwind CSS v4 design system (238 components, 98 interactive demos).
- **`@innostes/hrms`**, **`@innostes/crm`**, **`@innostes/api-logger`**: Export manifests and UI page components.
- **`apps/web-app`**: Shell engine orchestrating `SidebarNav`, `TopHeader`, tenant context, module context, and dynamic page routing.

### 5.3 Plug-in Discovery Mechanism
- **Backend**: Standard Python entry points (`setuptools`). `apps/api-server/app/engine/loader.py` calls `importlib.metadata.entry_points(group="innostes.modules")`. Discovered `BaseModule` instances are registered in `ModuleRegistry`, routes are mounted onto FastAPI `app.include_router()`, OpenAPI tags are merged, and startup/shutdown hooks are bound.
- **Frontend**: Explicit catalog registry in `apps/web-app/src/app/catalog.ts`. Module packages are imported via workspace references (`@innostes/hrms`, `@innostes/crm`, `@innostes/api-logger`). Active state is queried from backend `GET /tenants/current/modules` and `GET /tenants/current/plugins`.

### 5.4 Request Lifecycle
1. Request hits Uvicorn ASGI server on port 8001.
2. `CORSMiddleware`: Evaluates `Origin` header against `settings.cors_origins`.
3. `SetupRequiredMiddleware`:
   - Whitelist check: Passes `/setup/*`, `/`, `/health`, `/docs*`, `/redoc*`, `/openapi.json`.
   - Checks `is_installed_cached()`. If not installed, short-circuits immediately with `503 Service Unavailable` (`{"code": "setup_required"}`).
4. Route dispatch: FastAPI routes request to appropriate `APIRouter`.
5. Dependency injection:
   - `get_db`: Yields async SQLAlchemy session wrapped in an explicit transaction (`commit` on success, `rollback` on exception).
   - Auth dependency (`get_current_user`): Validates `Authorization: Bearer <jwt>`, validates signature, verifies user is active in DB.
   - Tenant scoping (`get_current_tenant_id`): Reads `X-Tenant-ID`, queries `tenant_members` to verify authenticated user belongs to tenant.
6. Service layer execution:
   - Domain logic executed via `BaseService` or specialized service.
   - Writes automatically populate `created_by`/`updated_by` with actor UUID.
   - Soft delete sets `deleted_at`/`deleted_by`.
7. Global Error Handler:
   - `register_error_handlers(app)` in `kernel/core/http.py` intercepts `ServiceError` subclasses and maps them to standard JSON `{"detail": "...", "code": "..."}` with correct HTTP status.

### 5.5 Data Model (18 Relational Entities)

1. `installation`: `id`, `installed_at`, `app_version`, `default_tenant_id` (FK `tenants.id`), `master_key_salt`, `master_key_check`, audit mixins.
2. `tenants`: `id`, `name`, `slug` (unique), `is_active`, `country`, `timezone`, `currency`, `language`, `date_format`, audit mixins.
3. `tenant_settings`: `id`, `tenant_id` (FK `tenants.id`), `key`, `value` (JSONB), audit mixins.
4. `tenant_members`: `id`, `tenant_id` (FK `tenants.id`), `user_id` (FK `users.id`), `role`, `status`, audit mixins.
5. `tenant_modules`: `id`, `tenant_id` (FK `tenants.id`), `module_id`, `is_active`, `activated_at`, `activated_by` (FK `users.id`), audit mixins.
6. `tenant_plugins`: `id`, `tenant_id` (FK `tenants.id`), `plugin_id`, `is_active`, `activated_at`, `activated_by` (FK `users.id`), audit mixins.
7. `users`: `id`, `email` (unique index), `password_hash`, `first_name`, `last_name`, `is_active`, `is_superuser`, `email_verified`, audit mixins.
8. `user_profiles`: `id`, `user_id` (FK `users.id`), `phone`, `avatar_url`, `bio`, audit mixins.
9. `user_identities`: `id`, `user_id` (FK `users.id`), `provider`, `provider_user_id`, audit mixins.
10. `user_devices`: `id`, `user_id` (FK `users.id`), `device_fingerprint`, `device_name`, `device_type`, `user_agent`, `ip_address`, `last_active_at`, `is_trusted`, audit mixins.
11. `user_sessions`: `id`, `user_id` (FK `users.id`), `device_id` (FK `user_devices.id`), `refresh_token_family_id`, `token_version`, `is_revoked`, `expires_at`, audit mixins.
12. `user_security`: `id`, `user_id` (FK `users.id`), `failed_login_attempts`, `locked_until`, `two_factor_enabled`, `two_factor_secret`, audit mixins.
13. `password_histories`: `id`, `user_id` (FK `users.id`), `password_hash`, audit mixins.
14. `roles`: `id`, `tenant_id` (FK `tenants.id`, nullable for global roles), `name`, `description`, `is_system`, audit mixins.
15. `permissions`: `id`, `name` (unique, e.g. `users:read`, `tenants:write`), `description`, `module`, audit mixins.
16. `role_permissions`: `id`, `role_id` (FK `roles.id`), `permission_id` (FK `permissions.id`), audit mixins.
17. `user_roles`: `id`, `user_id` (FK `users.id`), `role_id` (FK `roles.id`), `tenant_id` (FK `tenants.id`), `assigned_by` (FK `users.id`), audit mixins.
18. `api_keys`: `id`, `tenant_id` (FK `tenants.id`), `user_id` (FK `users.id`), `name`, `key_prefix`, `key_hash` (unique), `scopes` (JSONB), `expires_at`, `last_used_at`, `is_revoked`, audit mixins.

### 5.6 Configuration Reference

| Setting | Env Variable | Default | Type | Description |
|---|---|---|---|---|
| `app_name` | `APP_NAME` | `"Innostes ERP API"` | `str` | Application name in OpenAPI |
| `app_version` | `APP_VERSION` | `"0.1.0"` | `str` | API version |
| `app_env` | `APP_ENV` | `"development"` | `str` | Runtime environment (`development`, `staging`, `production`) |
| `port` | `PORT` | `8001` | `int` | ASGI HTTP server bind port |
| `debug` | `APP_DEBUG` | `False` | `bool` | FastAPI debug mode |
| `auto_migrate` | `AUTO_MIGRATE` | `False` | `bool` | Run Alembic upgrade head at server startup |
| `cors_origins` | `CORS_ORIGINS` | `["http://localhost:4200", "http://127.0.0.1:4200"]` | `list[str]` | Allowed browser CORS origins |
| `setup_enabled` | `SETUP_ENABLED` | `True` | `bool` | Web setup enabled flag |
| `setup_token` | `SETUP_TOKEN` | `None` (auto-generated) | `SecretStr` | One-time token for web setup wizard |
| `setup_token_file` | `SETUP_TOKEN_FILE` | `kernel/backend/var/setup-token` | `Path` | Storage file for generated token |
| `jwt_secret_key` | `JWT_SECRET_KEY` | `insecure-dev-secret-key...` | `SecretStr` | HMAC-SHA256 secret for JWT signing |
| `jwt_algorithm` | `JWT_ALGORITHM` | `"HS256"` | `str` | JWT cryptographic algorithm |
| `access_token_expire_minutes` | `ACCESS_TOKEN_EXPIRE_MINUTES`| `30` | `int` | Access token lifetime |
| `refresh_token_expire_days` | `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | `int` | Refresh token lifetime |
| `max_failed_login_attempts` | `MAX_FAILED_LOGIN_ATTEMPTS` | `5` | `int` | Failed login threshold before lockout |
| `account_lockout_minutes` | `ACCOUNT_LOCKOUT_MINUTES` | `15` | `int` | Duration of brute force lockout |
| `db.uri` | `DATABASE_URL` | `None` | `SecretStr` | Complete postgresql connection URI |
| `db.host` | `DB_HOST` | `"localhost"` | `str` | Postgres hostname |
| `db.port` | `DB_PORT` | `5432` | `int` | Postgres port |
| `db.user` | `DB_USER` | `"postgres"` | `str` | Postgres username |
| `db.password` | `DB_PASSWORD` | `"postgres"` | `SecretStr` | Postgres password |
| `db.database` | `DB_NAME` | `"erp_dev"` | `str` | Postgres database name |
| `db.pool_size` | `DB_POOL_SIZE` | `20` | `int` | SQLAlchemy base connection pool size |
| `db.max_overflow` | `DB_MAX_OVERFLOW` | `10` | `int` | Maximum surge connections |
| `db.pool_recycle` | `DB_POOL_RECYCLE` | `1800` | `int` | Connection recycle threshold (seconds) |

---

## 6. arc42 Gap Analysis

| Section | arc42 Topic | What Exists in Docs | Quality Rating | Gap / Missing Information |
|---|---|---|---|---|
| **1** | Introduction & Goals | Scattered in `overview.mdx:7-10` | Poor (A2, A3 violated) | Stakeholders, business context, top quality goals (ISO 25010) missing. |
| **2** | Architecture Constraints | Scattered in `getting-started.mdx` | Poor | Formal constraints (Python 3.10+, Nx, pnpm, Postgres 16, British English) uncataloged. |
| **3** | Context & Scope | Text ASCII box in `overview.mdx:12-25` | Poor (D1, D2 violated) | C4 Level 1 System Context diagram missing. Business & technical interfaces unformalized. |
| **4** | Solution Strategy | Overview bullets in `overview.mdx` | Medium | Rationale for two-engine design, plugin architecture, and monorepo structure not unified. |
| **5** | Building Block View | Partial folder trees in `kernel.mdx`, `plugins.mdx` | Poor (D1, D2 violated) | C4 Level 2 Container and Level 3 Component diagrams missing. Module contract not diagrammed. |
| **6** | Runtime View | Numbered text list in `overview.mdx:87-99` | Poor (D1, D2 violated) | Sequence diagrams for setup, auth rotation, multi-tenant requests, and soft delete missing. |
| **7** | Deployment View | `docker-compose.yml` snippet in `ci.mdx` | Poor | Deployment architecture diagram, production topology, and operations runbooks missing. |
| **8** | Cross-cutting Concepts | Mentioned in `kernel.mdx` | Medium (A8 violated) | STRIDE threat model, encryption architecture, and unified error handling missing. |
| **9** | Architecture Decisions | None | None (0 ADRs) | MADR 4.x ADR directory does not exist. 16 critical decisions undocumented. |
| **10** | Quality Requirements | None | None | Quality tree and quality scenarios (ISO 25010) completely missing. |
| **11** | Risks & Technical Debt | None | None | Technical debt and risk register completely missing. |
| **12** | Glossary | `TERMINOLOGY.md` exists in agent prompts | Medium (Not public) | Public `/docs/architecture/glossary` page missing. |

---

## 7. Candidate Architecture Decision Records (ADRs)

1. **ADR-0001: Plug-in Architecture via Python Entry Points and TypeScript Workspaces**  
   - *Status*: Accepted (retroactive).  
   - *Rationale*: Engines remain decoupled from domain logic; features can be added, tested, and enabled independently.
2. **ADR-0002: FastAPI for Backend ASGI Engine**  
   - *Status*: Accepted (retroactive).  
   - *Rationale*: Native async performance with ASGI, automatic OpenAPI generation, Pydantic type validation, and dependency injection.
3. **ADR-0003: React 19 and Vite for UI Engine**  
   - *Status*: Accepted (retroactive).  
   - *Rationale*: Lightning-fast HMR in monorepo via `@innostes/source` export conditions without prebuilding packages.
4. **ADR-0004: PostgreSQL 16 as Canonical Relational Store**  
   - *Status*: Accepted (retroactive).  
   - *Rationale*: Robust support for UUIDs, JSONB, concurrency, transactions, and row-level locking.
5. **ADR-0005: SQLAlchemy 2.0 Async Engine and Alembic Migrations**  
   - *Status*: Accepted (retroactive).  
   - *Rationale*: Strongly-typed async ORM (`Mapped`, `mapped_column`) with automated migration generation and advisory locking.
6. **ADR-0006: Monolithic Shared Database with Per-Module Migration Isolation**  
   - *Status*: Accepted (retroactive).  
   - *Rationale*: Single database connection pool for ERP consistency; modules own tables with distinct naming.
7. **ADR-0007: Universally Unique Identifiers (UUIDv4) for Primary Keys**  
   - *Status*: Accepted (retroactive).  
   - *Rationale*: Client-side key generation, elimination of enumeration attacks, seamless data replication across distributed nodes.
8. **ADR-0008: Universal Soft Delete via `deleted_at` and `deleted_by`**  
   - *Status*: Accepted (retroactive).  
   - *Rationale*: Prevents accidental data loss, preserves referential integrity, supports legal compliance and audit requirements.
9. **ADR-0009: Standardised Audit Columns on Every Entity**  
   - *Status*: Accepted (retroactive).  
   - *Rationale*: Complete accountability for create, update, and delete actions automatically captured by `BaseService`.
10. **ADR-0010: JWT Access and Refresh Tokens with Token Family Rotation**  
    - *Status*: Accepted (retroactive).  
    - *Rationale*: Stateless short-lived access tokens (30m) paired with single-use rotating refresh tokens (7d) to detect token replay attacks.
11. **ADR-0011: Multi-Tenancy Scoping via `X-Tenant-ID` Header and Membership Verification**  
    - *Status*: Accepted (retroactive).  
    - *Rationale*: Clean horizontal isolation per HTTP request verified against `tenant_members` table; prevents cross-tenant data leakage.
12. **ADR-0012: First-Run Security via Ephemeral Setup Token and Middleware Lock**  
    - *Status*: Accepted (retroactive).  
    - *Rationale*: Prevents unauthenticated hijacking of fresh installations; disables setup routes permanently once installed.
13. **ADR-0013: Nx Monorepo with pnpm Package Manager**  
    - *Status*: Accepted (retroactive).  
    - *Rationale*: Unified task orchestration, distributed computation caching, strict workspace linking, and lightning-fast package installs.
14. **ADR-0014: Independent Python Virtual Environment per Application**  
    - *Status*: Accepted (retroactive).  
    - *Rationale*: Prevents dependency conflicts between Python services; allows isolated editable installations.
15. **ADR-0015: Base UI and Tailwind CSS for Unified Design System (`@innostes/ui`)**  
    - *Status*: Accepted (retroactive).  
    - *Rationale*: Unstyled accessible primitives (Base UI) paired with utility-first tokens (Tailwind CSS v4) for enterprise design coherence.
16. **ADR-0016: Next.js and Fumadocs for Documentation Site (`apps/landing`)**  
    - *Status*: Accepted (retroactive).  
    - *Rationale*: High-performance static site generation (SSG) with MDX, built-in search, and documentation layout primitives.

---

## 8. Threat-Surface Inventory

### 8.1 Entry Points
1. **Public HTTP Ingress**:
   - `/health`, `/`: Unauthenticated probes.
   - `/setup/status`: Unauthenticated installation status.
   - `/setup/checks`, `/setup`: Protected by `X-Setup-Token` with rate limiting.
   - `/auth/login`, `/auth/refresh`, `/auth/reset-password/*`: Public auth endpoints (rate limited, locked out after 5 failures).
   - `/api-reference/*`, `/docs/*`: Static documentation.
2. **Authenticated HTTP Endpoints**:
   - `/tenants/*`: Scoped to authenticated users; administrative operations require Super Admin.
   - `/users/*`: IAM endpoints protected by RBAC permissions.
   - `/modules/*`, `/crm/*`, `/hrms/*`: Tenant-scoped business endpoints requiring `X-Tenant-ID` and module activation.
   - `/auth/api-keys`: API key management.
3. **CLI / Process Ingress**:
   - `python -m kernel.setup install`: Direct shell command-line installer.
   - Alembic migration CLI: Direct database execution.

### 8.2 Trust Boundaries
- **Boundary 1 (External / Public -> UI Client)**: Untrusted web browser client executing JavaScript in user sandbox.
- **Boundary 2 (UI Client -> API Server Engine)**: Cross-origin HTTP boundary. Enforced by CORS origins whitelist and TLS.
- **Boundary 3 (API Server -> Database)**: Trusted internal network boundary. Managed via SQLAlchemy connection pool with Postgres credentials.
- **Boundary 4 (Tenant Isolation)**: Cross-tenant data boundary. All tenant queries scoped by `tenant_id` verified by `tenant_members`.
- **Boundary 5 (System State Boundary)**: Setup lock boundary (`SetupRequiredMiddleware`).

### 8.3 Secrets and Cryptographic Material
- `JWT_SECRET_KEY`: HMAC-SHA256 secret key for signing user tokens.
- `SETUP_TOKEN`: 256-bit ephemeral secret stored in `kernel/backend/var/setup-token`.
- `ENCRYPTION_KEYS`: Keyring mapping version integer -> 32-byte AES-GCM key for field envelope encryption.
- `BLIND_INDEX_PEPPER`: Secret HMAC pepper for searchable blind indexes.
- `DATABASE_URL` / `DB_PASSWORD`: Relational database credentials.
- `SMTP_PASSWORD`: Outbound email credentials.
- `api_keys.key_hash`: SHA-256 hashed programmatic API tokens.

### 8.4 Sensitive Data Stores
- `users`: User email addresses, bcrypt password hashes (`cost=12`).
- `user_security`: 2FA TOTP secrets, failed attempt counters, lockout timestamps.
- `user_sessions`: Active session records, refresh token family hashes.
- `user_devices`: Fingerprints, IP addresses, client user agents.
- `password_histories`: Historical password hashes for reuse prevention.
- `api_keys`: Machine-to-machine tokens with scoped JSON permissions.

### 8.5 Authentication & Authorisation Checkpoints
- `SetupRequiredMiddleware`: Evaluates `is_installed_cached()` before every request.
- `require_setup_token`: Verifies `X-Setup-Token` using constant-time comparison (`secrets.compare_digest`). Enforces 10 attempts per 15 minutes limit.
- `get_current_user`: Extracts JWT Bearer token, validates signature, expiration, and user account status.
- `get_current_tenant_id`: Reads `X-Tenant-ID`, validates UUID format, verifies active user membership in `tenant_members`.
- `require_super_admin`: Validates `user.is_superuser == True`.
- `RBACService.has_permission`: Resolves effective permissions through user roles, tenant roles, and system roles.
- `ApiKeyService.authenticate`: Matches `key_prefix` and compares SHA-256 `key_hash`.

---

## 9. Findings Table

| ID | Severity | Checklist | Location | Finding | Fix | Owner Prompt |
|---|---|---|---|---|---|---|
| `ARC-001` | **S1** | F1, F2 | `apps/landing/content/dev-docs/architecture/overview.mdx:72-86` | Stated architectural dependency rules are not enforced by any automated linter or CI check. | Add `import-linter` contracts for Python and `@nx/enforce-module-boundaries` ESLint tags for TypeScript. | Prompt 02 |
| `ARC-002` | **S1** | F1, A4 | `kernel/backend/kernel/` | Bidirectional feature imports: `tenancy` imports `auth` and `user`; `user` imports `auth` and `tenancy`; `setup` imports `tenancy` and `user`. Stated rule 5 violated. | Record debt in PROGRESS.md and import-linter exception; formalize clean layering in ADR. | Prompt 02, 09, 10 |
| `ARC-003` | **S1** | A4, A6 | `apps/landing/content/dev-docs/architecture/kernel.mdx:9-14`, `overview.mdx:66-70` | Docs claim identity and access are "planned/next" and endpoints have "no access control yet", but IAM and Auth are fully implemented and running. | Update documentation to accurately reflect existing IAM, AuthGate, and RBAC implementation. | Prompt 03, 04, 08 |
| `ARC-004` | **S1** | A4, A6 | `apps/landing/content/dev-docs/architecture/overview.mdx:69`, `web-app.mdx:16` | Docs claim web-app is "still a placeholder" and dynamic page loading is "still to come", but `catalog.ts`, `AppRouter`, and module switchers are fully built. | Rewrite UI architecture documentation to describe existing dynamic shell and catalog manifest loading. | Prompt 04 |
| `ARC-005` | **S1** | A4 | `kernel/backend/kernel/models.py:6-8` | `api_keys` model is omitted from `kernel.models.py`, though migration `0005_create_api_keys_table.py` exists. | Import `kernel.auth.models` into `kernel.models.py` so Alembic detects all tables. | Prompt 02, 06 |
| `ARC-006` | **S2** | D1, D2 | `apps/landing/content/dev-docs/architecture/` (all pages) | All existing diagrams are ASCII text blocks. Zero C4 model or sequence diagrams exist. | Implement Mermaid C4 diagrams (Context, Container, Component) and runtime sequence diagrams. | Prompt 02, 03, 04, 05 |
| `ARC-007` | **S2** | R1–R8 | `apps/landing/content/dev-docs/architecture/decisions/` | Zero Architecture Decision Records (ADRs) exist in the codebase. | Create MADR 4.x records for all 16 candidate decisions in `architecture/decisions/`. | Prompt 09 |
| `ARC-008` | **S2** | A1 | `apps/landing/content/dev-docs/architecture/` (all pages) | Dev docs frontmatter schema lacks `owner` and `lastReviewed` fields required by STANDARDS.md. | Extend Fumadocs frontmatter schema and add validation gate. | Prompt 02 |
| `ARC-009` | **S2** | A2 | `apps/landing/content/dev-docs/architecture/` | Existing architecture pages do not map to arc42 structure. 8 of 12 arc42 sections are completely missing. | Author missing arc42 sections (Quality goals, Constraints, Runtime view, Deployment, STRIDE, Quality scenarios, Glossary). | Prompts 03–10 |
| `ARC-010` | **S2** | D1, D2 | `apps/landing/content/dev-docs/architecture/kernel.mdx:131` | Entity relationship diagrams are missing for the 18 database tables. | Implement Mermaid ER diagram generated from SQLAlchemy models. | Prompt 06 |
| `ARC-011` | **S2** | A3 | `apps/landing/content/dev-docs/architecture/` | Operations runbooks and production deployment guides are missing from dev-docs. | Create `content/dev-docs/operations/` runbooks (deploy, backup, restore, rotate secrets). | Prompt 07 |
| `ARC-012` | **S2** | A4 | `apps/landing/content/dev-docs/architecture/overview.mdx:114` | Repo tree omits `modules/hrms`, `modules/crm`, and `plugins/api-logger`. | Update repository layout documentation with accurate tree. | Prompt 04, 11 |
| `ARC-013` | **S3** | A9 | `apps/landing/content/dev-docs/` (multiple files) | Mixed American / British English spelling across architectural documentation. | Standardize to British English in editorial pass. | Prompt 12 |
