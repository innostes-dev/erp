# Core Platform Readiness Audit

**Date:** 2026-11-08 · **Last updated:** 2026-11-08 (principal-engineer pass) · **Branch audited:** `feat/enterprise-design-system` · **Scope:** `kernel/backend`, `kernel/frontend`, `apps/api-server`, `apps/web-app`, and how plugins consume the core.

## 0. The question

> Can this core be the **starting point for any product** (web or mobile, B2B or B2C, SaaS or single-customer, ERP or not), so a new project only adds its domain CRUD pages, reports and workflows on top?

### Near-term goal (what this audit is now optimised for)

The full 12-product-shape analysis in Section 1 is the long-term horizon. The immediate goal is narrower and more actionable:

> **A developer clones this repo, adds their domain models and CRUD pages, and ships a working multi-tenant SaaS admin — without touching the core.**

The core handles auth, tenancy, RBAC, audit and plugin-loading. The developer handles customer-specific features. Section 0.5 gives the focused checklist for this goal.

### Verdict

**Not yet — not even for the narrow SaaS admin goal. The core is roughly 35–40% ready.**

The identity, tenancy, RBAC, audit and plugin-loading pieces are well designed. But a developer cannot start adding product features today because:

- the **user management API is nearly empty** (only `POST /users` and `GET /users/{id}` exist — no list, no update, no deactivate);
- there is **no invite or member management API** at all (`INVITED` enum and `TenantMember` table exist but no endpoints);
- there is **no RBAC management API** (roles/permissions models and services exist but no router — roles can't be assigned via the API);
- the **web frontend stores tokens in `localStorage`** rather than relying on the HttpOnly cookies the backend sets — XSS reads both tokens directly;
- **tenant isolation is opt-in** — `BaseService` does not filter by tenant, and modules bypass it with manual per-query filters that are easy to forget;
- the standard **platform services** every product needs (jobs, events, files, notifications, cache, rate limiting, observability) are missing;
- there are **production security defects** (cookies not marked `Secure`, no security headers, an insecure default JWT secret with no startup guard, tenant isolation that each plugin has to opt into, and — critically — the web frontend stores tokens in `localStorage` rather than relying on the HttpOnly cookies the backend sets, negating XSS protection entirely);
- the core assumes one product shape (B2B, a tenant with members, admin users). B2C, marketplace, single-tenant, public-content and mobile-first products are not covered.

### How to read this document

| Tag | Meaning |
|---|---|
| ✅ | Present and usable |
| 🟡 | Partially present (model or schema only, or incomplete) |
| ❌ | Missing |
| 🔍 | Not verified in this audit; check before acting |

Priority: **P0** = fix before any production project · **P1** = needed before the core is "general purpose" · **P2** = needed for broad product coverage / scale · **P3** = nice to have.

"Verified" means confirmed by reading the code. Absence was established by searching the code (e.g. no `redis`, `webhook`, `rate_limit`, `opentelemetry` or `oauth` anywhere in `kernel/`).

---

## 0.5 SaaS admin starter — minimum viable core

This section is the actionable checklist for the near-term goal. A developer should be able to build any multi-tenant SaaS product on this base without writing auth, tenancy or user-management code.

### What exists today (usable as-is)

| Area | Endpoints / code |
|---|---|
| Login, refresh, forgot/reset/change password, logout | `POST /auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`, `/auth/logout` |
| Current user profile + accessible modules | `GET /auth/me` |
| API key management | `GET/POST /auth/api-keys`, `DELETE /auth/api-keys/{id}` |
| Tenant CRUD + soft delete/restore | `POST/GET/PATCH/DELETE /tenants` |
| Module & plugin activation per tenant | `/tenants/current/modules/{id}/activate|deactivate`, same for plugins |
| Audit trail | `GET /audit/logs`, entity history, summary |
| Field encryption + blind index | `core/crypto/cipher.py` |
| Design system | `@innostes/ui` 46+ components |
| Brute-force lockout, rotating refresh tokens, session family revoke | `auth_service.py` |

### What is missing before the first product module can be added (P0)

These gaps block every developer who tries to use the core right now.

#### Backend gaps

| Gap | Why it blocks | Current state |
|---|---|---|
| **User list, search, update, deactivate** | Every admin needs to manage their team | Only `POST /users` and `GET /users/{id}` exist |
| **Invite flow** `POST /users/invite` → email → `POST /users/accept-invite` | No way to onboard users to a tenant | `INVITED` status and `TenantMember` table exist, no endpoints |
| **Tenant member management** `GET/POST/DELETE /tenants/current/members` | No API to see or manage who is in a tenant | `TenantMember` table exists, no endpoints |
| **RBAC management API** assign/revoke roles, create custom roles, list permissions | No way to manage access control through the API | `Role`, `Permission`, `UserRole` models and services exist, **no router at all** |
| **Session list + revoke** `GET /auth/sessions`, `DELETE /auth/sessions/{id}` | Users cannot see or revoke active sessions | `UserSession` table and revoke logic exist, no endpoints |
| **Device registration API** `POST /auth/devices`, `GET /auth/devices` | Mobile and device-bound auth is broken | `UserDevice` model exists, no router |
| **Tenant isolation by default** (`TenantScopedService`) | Any module that forgets a `.where(tenant_id ==)` clause leaks cross-tenant data silently | `BaseService.base_query()` ignores tenant; modules write manual per-query filters |
| **Rate limiting on auth endpoints** | Login/forgot-password unprotected; brute-force and enumeration possible | No rate limiter anywhere |
| **Fix token storage** (SEC-12) | XSS reads both access + refresh tokens from `localStorage` | Backend sets HttpOnly cookies correctly; frontend ignores them and uses `localStorage` |
| **Boot guard for insecure defaults** (SEC-02) | App ships with default JWT secret in production | No startup rejection when secret is the default or < 32 bytes |

#### Frontend gaps

| Gap | Why it blocks |
|---|---|
| **Silent 401 refresh + retry queue** in `apiRequest` | Access token expires mid-session → raw 401 errors throughout the app; `AuthGate` only refreshes at startup |
| **User management page** (list, invite, edit, deactivate) | No UI to manage team members |
| **Roles & permissions page** (assign roles, manage permissions) | No UI to manage access control |
| **Members & invites page** | No UI for tenant membership |
| **Profile / account page** (change password, active sessions, devices) | Users can't manage their own account |
| **`usePermission` / `<Can>` components** | Module UIs can't gate content by permission |
| **Plugin-contributed routes** | `routes.ts` is static — modules cannot add navigation entries; every module UI must be hard-coded in the shell |

### What can be deferred (not needed for SaaS admin day 1)

The following are in the full capability matrix but do not block the SaaS admin goal:

- MFA (schema + encrypted columns are ready; wire the endpoints later)
- Enterprise SSO / SAML (`UserIdentity` table is ready; add Authlib flows later)
- File storage (add per product as needed)
- Background jobs (needed once any async task appears — invite email is the first trigger)
- Mobile SDK
- Real-time channels, AI gateway, marketplace payments, IoT

### Phased delivery for the SaaS admin goal

**Sprint 0 — security fixes (unblock shipping at all):**
SEC-12 token storage · SEC-01 secure cookies · SEC-02 boot guard · SEC-04 rate limiting · SEC-03 tenant-scoped service + arch test

**Sprint 1 — core admin APIs (unblock product developers):**
User CRUD (list/search/update/deactivate) · invite flow · member management · RBAC management API · session + device API · silent 401 refresh in frontend · admin UI pages (users, roles, members, profile)

**Sprint 2 — production quality:**
`usePermission` / `<Can>` · plugin-contributed routes · async email / job queue · structured logs + correlation IDs · security headers (SEC-05) · CSRF (SEC-07) · standard list query contract

**Sprint 3 — platform completeness:**
MFA enrolment · SSO/OIDC · file storage · notification hub · `kernel.sdk` public surface · `create-innostes-app` starter

---

## 1. Product shapes the core must support

A universal core is measured against the products people will build on it, not against ERP. Each shape below pulls in different core needs.

| # | Product shape | Examples | What it demands of the core | Today |
|---|---|---|---|---|
| 1 | Multi-tenant B2B SaaS | HRMS, CRM, ERP, helpdesk | Tenants, members, invites, RBAC, plans, audit | 🟡 Best fit, but member/invite/RBAC APIs missing |
| 2 | Single-tenant / on-prem enterprise | Custom build for one client | Tenancy switchable off, SSO (SAML/OIDC), LDAP, air-gapped install | 🟡 Setup wizard good; no SSO, no "single-tenant mode" |
| 3 | B2C consumer app | Fitness, edtech, booking | Self sign-up, social login, OTP login, guest users, very large user counts, consent | ❌ No sign-up flow, no social or OTP login |
| 4 | Marketplace / two-sided | Service booking, ecommerce | Several user types (buyer/seller/admin), payments, payouts, KYC, reviews | ❌ No user-type model, no payments |
| 5 | Mobile-first app | Field-force, delivery, attendance | Device registration, push, offline sync, app versions, deep links, biometrics | 🟡 Device model exists, no API |
| 6 | Public content / portal | CMS site, customer portal | Anonymous access, public API, SEO, caching/CDN, external portal users | ❌ |
| 7 | Internal tool / back-office | Ops dashboards | SSO with company IdP, reports, exports, approvals | 🟡 |
| 8 | API-first / developer platform | Headless API product | API keys ✅, OAuth2 client credentials, rate limits, usage metering, webhooks, versioning | 🟡 API keys only |
| 9 | IoT / telemetry | Device fleets | Machine identities, high ingest, time-series storage | ❌ (Tracura could become this) |
| 10 | Regulated (health/fin/gov) | Clinic, lending | Tamper-evident audit, encryption ✅, data residency, retention, consent, e-sign | 🟡 Encryption good, audit not tamper-evident |
| 11 | Real-time / collaborative | Chat, live boards | WebSockets/SSE, presence, pub/sub | ❌ |
| 12 | AI-enabled product | Copilots, document Q&A | LLM gateway, prompt/usage metering, vector store, PII redaction | ❌ |

**Conclusion:** the core targets shape 1 well. To be universal, **tenancy, user types and the auth methods must become configurable**, rather than hardwired to "B2B org with members".

---

## 2. What is solid today (keep and build on)

| Area | Evidence |
|---|---|
| Plugin contract | `kernel/core/module/base.py` `BaseModule` (router, `configure`, `on_startup`, `on_shutdown`, `health_check`, openapi tags) |
| Zero-touch plugin discovery | `apps/api-server/app/main.py` uses entry points `innostes.modules` / `innostes.plugins` |
| Per-tenant module activation | `/tenants/current/modules/{id}/activate`, `require_module()` dependency |
| Login and session rotation | `/auth/login`, `/auth/refresh`, session table stores `refresh_token_hash` and `revoked_at`; logout-all |
| Web and mobile tokens | HttpOnly cookies **and** tokens returned in the response body; ⚠️ the web frontend ignores the cookies — it stores both tokens in `localStorage` and sends Bearer headers instead (`auth/api.ts:35–36`). The HttpOnly cookie path is effectively dead code for the web app. See SEC-12 |
| Brute-force lockout | `max_failed_login_attempts`, `account_lockout_minutes` |
| Password lifecycle | forgot/reset/change, password history, temporary passwords, bcrypt |
| API keys | Tenant-scoped, hashed (`api_key_service.py`) |
| Field encryption | `core/crypto/cipher.py`: versioned keys plus a blind-index pepper (rare and valuable) |
| Audit log | `/audit/logs`, entity history, summary |
| Generic CRUD | `BaseService`: audit columns, soft delete, partial update |
| First-run setup | Setup wizard plus CLI plus setup token |
| Governance | Architecture fitness tests, CI gates (lint, test, contract-test, openapi-check, arch-check, design-check) |
| Design system | `@innostes/ui`: 46+ components, widgets, charts, tokens |

---

## 3. Security audit

### 3.1 Defects found (verified)

| ID | Pri | Finding | Location | Fix |
|---|---|---|---|---|
| SEC-01 | **P0** | Auth cookies set with `secure=False`, hardcoded | `kernel/auth/router.py:134,143` (+ refresh at ~198) | Derive from settings (`secure = app_env != "development"`); add a `__Host-` prefix in prod |
| SEC-02 | **P0** | Default `jwt_secret_key = "insecure-dev-secret-key-change-in-production"`; no startup guard found that rejects it outside dev | `core/config/settings.py:48`, `docker-compose.yml` | Refuse to boot when `app_env != development` and the secret is the default or shorter than 32 bytes. Same for the encryption keys and blind-index pepper |
| SEC-03 | **P0** | Tenant isolation is opt-in: `BaseService.base_query()` filters soft-deleted rows but **not tenant**; no Postgres RLS found. Confirmed worse than it appears: `peopleops` (and likely other modules) bypasses `BaseService` entirely and writes raw SQLAlchemy queries, manually adding `.where(tenant_id == ...)` per method. Any new method that forgets that clause is a silent cross-tenant data leak | `core/services/base.py`, `modules/peopleops/leave/services.py` | Add `TenantScopedService` that injects `tenant_id` into `base_query()` automatically; add Postgres RLS (`SET LOCAL app.tenant_id`) as defence in depth; add a Semgrep or arch-check rule enforcing that every query on a tenant-scoped table carries a tenant filter |
| SEC-04 | **P0** | No rate limiting on any endpoint (login, forgot-password, refresh, API keys); account lockout alone allows user enumeration and password spraying across accounts | whole API | Redis-backed limiter per IP, user, tenant and API key; stricter buckets for auth endpoints |
| SEC-05 | **P1** | No security headers middleware (HSTS, CSP, X-Content-Type-Options, frame-ancestors, Referrer-Policy) | `apps/api-server/app/engine/server.py` | Add a headers middleware plus `TrustedHostMiddleware` |
| SEC-06 | **P1** | JWT is HS256 with a shared secret. Every service that verifies tokens can also mint them, no key rotation or `kid`. Tokens also lack `iss`, `aud`, and `jti` — no issuer binding, no audience restriction, no per-token revocation without a full version bump | `core/security/jwt.py` | RS256/EdDSA with `kid`, a JWKS endpoint, rotation; add `iss`, `aud`, `jti`, leeway |
| SEC-07 | **P1** | No CSRF token. Cookies use `SameSite=Lax`, which is fine for normal requests but not for GET endpoints with side effects or for cross-subdomain deployments | `auth/router.py` | Double-submit CSRF token for cookie-authenticated mutating requests |
| SEC-08 | **P1** | README advertises a "tamper-evident audit trail", but the audit model has no hash chain or signature | `audit/models/audit_log.py` | Hash chain (`prev_hash`, `hash`) plus a periodic anchored checkpoint; DB role that can only append (no UPDATE/DELETE) |
| SEC-09 | **P1** | MFA columns exist (`mfa_secret_encrypted`, backup codes) but there is no enrolment, verification or step-up flow, so privileged accounts are password-only | `user/models/security.py` | TOTP plus WebAuthn/passkeys, backup codes, step-up auth for sensitive actions, tenant policy "MFA required" |
| SEC-10 | **P1** | Emails sent synchronously during the request means response-time differences can reveal whether an account exists on forgot-password | `auth/services/email_service.py` | Queue emails; return identical responses and timing |
| SEC-11 | **P2** | The `X-Tenant-ID` header chooses the tenant. Membership must be validated on every request, including API-key requests | `auth/dependencies.py:121-152` 🔍 | Verify membership is checked; add a negative cross-tenant test suite |
| SEC-12 | **P0** | Web frontend stores access AND refresh tokens in `localStorage` (`auth/api.ts:35–36`). The API client never sets `credentials: 'include'`, so HttpOnly cookies the backend sets are never sent. XSS can steal both tokens directly | `kernel/frontend/src/auth/api.ts:27–41`, `kernel/frontend/src/core/api/client.ts` | Pick one transport: (a) cookie-only — remove `localStorage`, add `credentials: 'include'` to every fetch, implement SEC-07 CSRF; or (b) Bearer-only — remove the `Set-Cookie` calls from the backend, add the 401 refresh interceptor. Do not run both in parallel with the weaker one winning |
| SEC-13 | **P0** | `get_client_ip()` takes the **first** value in `X-Forwarded-For` without validating the proxy chain. Any client can spoof their IP, making future IP-based rate limiting (SEC-04) immediately bypassable | `kernel/auth/router.py:get_client_ip` | Use `ProxyHeadersMiddleware` configured with the trusted proxy count, or read the last non-trusted-proxy IP in the chain |
| SEC-14 | **P1** | CORS configured with `allow_methods=["*"]` and `allow_headers=["*"]` alongside `allow_credentials=True` — unnecessarily broad | `apps/api-server/app/engine/server.py:202–203` | Enumerate `allow_methods` and `allow_headers` explicitly; add a boot-time guard that `CORS_ORIGINS` is never `["*"]` when credentials are enabled |

### 3.2 Security capabilities checklist (OWASP ASVS L2 lens)

| Domain | Item | State | Pri |
|---|---|---|---|
| **Authentication** | Password login + lockout | ✅ | |
| | Password policy (length, breached-password check via HIBP k-anonymity) | ❌ confirmed absent | P1 |
| | MFA TOTP / backup codes | 🟡 tables only | P1 |
| | Passkeys / WebAuthn | ❌ | P1 |
| | Email/SMS OTP & magic-link login | ❌ | P1 |
| | Social login (Google, Microsoft, Apple; Apple is mandatory on iOS if other social logins are offered) | ❌ | P1 |
| | Enterprise SSO: OIDC, SAML 2.0, SCIM provisioning | 🟡 `UserIdentity` table only | P1 |
| | LDAP / AD (on-prem clients) | ❌ | P2 |
| | Self sign-up + email verification | ❌ | P1 |
| | Bot protection (CAPTCHA/Turnstile) on public forms | ❌ | P1 |
| | Impersonation ("login as user", with audit trail and banner) | ❌ | P2 |
| **Session** | Rotating refresh tokens + revocation | ✅ | |
| | Refresh-token reuse detection (revoke family on replay) | ✅ verified — `auth_service.py:341–351` revokes all active sessions on replay | — |
| | Session list & remote revoke per device (user-facing) | ❌ API | P1 |
| | Idle + absolute timeout, tenant-configurable | 🟡 | P2 |
| **Authorization** | Permission check (`require_permission`) + scopes | ✅ | |
| | Role/permission management API & UI | ❌ | P0 |
| | Record-level / attribute-based rules (own records, department, region) | 🔍 `apply_scope` exists, needs review | P1 |
| | Field-level permissions (hide salary column) | ❌ | P2 |
| | Permission registry declared by plugins (auto-seeded on install) | 🔍 | P1 |
| | Policy engine option (OPA/Cedar-style) for complex products | ❌ | P3 |
| **Data protection** | Field encryption + blind index | ✅ | |
| | Key management via KMS/Vault, envelope encryption, rotation job | ❌ | P1 |
| | Secrets from a vault rather than env vars | ❌ | P2 |
| | PII tagging on model fields, used for export, erasure and masking | ❌ | P1 |
| | Log redaction (no tokens/PII in logs) | 🔍 | P1 |
| **Input / output** | Pydantic validation | ✅ | |
| | File upload validation (type sniffing, size, antivirus) | ❌ no uploads | P1 |
| | SSRF guard for outbound URLs (webhooks, imports) | ❌ | P1 |
| | Rich-text/HTML sanitisation helper | ❌ | P2 |
| **API** | API keys | ✅ | |
| | OAuth2 client-credentials / third-party app authorization | ❌ | P2 |
| | Idempotency keys for POST | ❌ | P1 |
| | Request size limits, timeouts | 🔍 | P1 |
| **Supply chain** | Dependency scanning (pip-audit, pnpm audit, Dependabot/Renovate) | 🔍 | P1 |
| | SAST (Semgrep/Bandit, CodeQL), secret scanning (gitleaks) | 🔍 | P1 |
| | Container image scan, SBOM, signed images | ❌ | P2 |
| | Plugin trust: signed plugins / allow-list (plugins run with full kernel privileges) | ❌ | P1 |
| **Operations** | Security event alerts (lockouts, privilege change, new admin, API key created) | ❌ | P1 |
| | Pen-test & threat model document | ❌ | P2 |
| | `SECURITY.md` disclosure policy | ✅ | |

---

## 4. Capability gap matrix (non-security)

### 4.1 Identity & users

| Item | State | Pri | Notes |
|---|---|---|---|
| User CRUD API (list/search/update/deactivate/delete) | ❌ only `POST /users`, `GET /users/{id}` | **P0** | Every product needs this |
| Invite flow (invite → accept → set password) | ❌ `INVITED` enum and `TenantMember` table exist; no endpoint wired | **P0** | |
| Tenant member management API | ❌ | **P0** | |
| `PENDING_VERIFICATION` status + `email_verified_at` column | 🟡 schema only — no verification flow or token was ever wired; these are dead columns | P1 | `user/models/user.py`, `user/models/security.py` |
| Profile & preferences (locale, timezone, theme, notification prefs) | 🟡 profile model | P1 | |
| User types / personas (staff, customer, vendor, patient…) | ❌ | P1 | Needed for marketplace, portal and B2C |
| Groups / teams / org hierarchy (generic, not HR-specific) | ❌ | P1 | Lots of RBAC and approval rules depend on it |
| Guest / anonymous users with later upgrade | ❌ | P2 | B2C |
| Account deletion & data export (self-service) | ❌ | P1 | GDPR / India DPDP Act / app-store requirement |

### 4.2 Tenancy

| Item | State | Pri |
|---|---|---|
| Tenants CRUD, soft delete, restore | ✅ | |
| Isolation enforced by default (see SEC-03) | ❌ | **P0** |
| **Tenancy mode** config: `none` (single-tenant) / `shared-schema` / `schema-per-tenant` / `db-per-tenant` | ❌ | P1 |
| User belongs to multiple tenants + tenant switcher | 🔍 | P1 |
| Hierarchical tenants (holding → company → branch) | ❌ | P2 |
| Custom domains / subdomain routing per tenant | ❌ | P2 |
| Per-tenant branding (logo, colours, email sender) | ❌ | P1 |
| Per-tenant settings registry with typed schema that plugins can extend | 🟡 `tenancy/schemas/settings.py` | P1 |
| Data residency (region pinning) | ❌ | P3 |
| Tenant offboarding: export everything, then hard delete | ❌ | P1 |

### 4.3 Monetisation

| Item | State | Pri |
|---|---|---|
| Plans / editions / entitlements (feature flags per plan) | ❌ (only module on/off) | P1 |
| Seat limits, usage quotas, metering | ❌ | P1 |
| Subscription billing adapter (Stripe, Razorpay) + webhooks | ❌ | P1 |
| Payments (one-time, wallets, refunds, payouts) as an optional core plugin | ❌ | P2 |
| Invoicing / tax (GST) | ❌ (domain module, not core) | P3 |

### 4.4 Platform services every plugin needs

| Service | State | Pri | Expected interface |
|---|---|---|---|
| **Background jobs & retries** | ❌ | **P0** | `kernel.jobs.enqueue(fn, …)`, retries, dead-letter queue, per-tenant fairness (arq/Celery/Dramatiq on Redis, or Postgres-based e.g. procrastinate) |
| **Scheduler (cron)** | ❌ | P1 | Plugins declare schedules in `BaseModule` |
| **Domain event bus** | ❌ | **P0** | `emit("user.created", …)` with in-process subscribers plus a transactional outbox for reliable delivery |
| **Outbound webhooks** | ❌ | P1 | Subscriptions, HMAC signing, retries, delivery log, replay |
| **Inbound webhook receiver** | ❌ | P2 | Signature verification helpers |
| **File storage** | ❌ | **P0** | Pluggable local/S3/GCS/Azure, presigned upload/download, per-tenant prefix, AV scan, image thumbnails, quotas |
| **Notifications hub** | 🟡 email only, sync | **P0** | Channels: in-app (persisted + unread count), email, push (FCM/APNs), SMS, WhatsApp; templates; user preferences; digests |
| **Email templating** | 🟡 inline HTML strings | P1 | Template files, i18n, per-tenant branding, preview |
| **Cache** | ❌ | P1 | Redis; permission & tenant settings cache with invalidation |
| **Distributed locks** | ❌ | P2 | Needed for payroll runs, sequence numbers |
| **Number series / sequences** (INV-2026-0001) | ❌ | P1 | Per tenant, gap-free option. Needed by almost every business app |
| **Search** | ❌ | P2 | Postgres FTS abstraction → OpenSearch/Meilisearch adapter |
| **Real-time** (WebSocket/SSE, tenant-scoped channels) | ❌ | P2 | Live notifications, collaboration |
| **Feature flags** (runtime, % rollout) | ❌ | P2 | Separate from plan entitlements |
| **Rate limiting** | ❌ | **P0** | See SEC-04 |
| **Idempotency** | ❌ | P1 | |

### 4.5 Data-layer conventions (what lets plugins be "just CRUD")

| Item | State | Pri |
|---|---|---|
| Base model: UUID, timestamps, actor columns, soft delete | ✅ | |
| Tenant-scoped base model | ❌ | **P0** |
| Standard list query contract: pagination (cursor + offset), filtering, sorting, search, field selection | 🔍 | **P0**. Without it every plugin invents its own |
| Optimistic concurrency (`version` / ETag, `If-Match`) | ❌ | P1 |
| Bulk operations (bulk create/update/delete) | ❌ | P1 |
| Import (CSV/XLSX with validation preview & error report) | ❌ | P1 |
| Export (CSV/XLSX/PDF, async for big sets) | ❌ | P1 |
| Custom fields / extensible attributes per tenant (JSONB + schema) | ❌ | P1. Top request in every B2B product |
| Attachments & comments on any record (polymorphic) | ❌ | P1 |
| Activity timeline per record | 🟡 audit entity history | P2 |
| Tags / labels on any record | ❌ | P2 |
| Record change history with diff (field-level) | 🔍 | P1 |
| Approvals / workflow engine (state machine + multi-step approvals) | ❌ | P1 |
| Data retention & archival policies | ❌ | P2 |
| Migrations per plugin with ordering & dependency on kernel version | 🟡 alembic in kernel; per-plugin chains 🔍 | P1 |
| Seed / fixture data per plugin | 🟡 kernel seeding | P2 |
| Read replicas | ❌ | P2 |
| DB statement timeout | ❌ pool is configured (`connection.py`) but `statement_timeout` not set in `connect_args.server_settings`; runaway queries starve the pool | **P1** |

### 4.6 Reporting & analytics

| Item | State | Pri |
|---|---|---|
| Report framework (declare a query → table/chart/export, with RBAC) | ❌ | P1 |
| Dashboards with saved widgets per user/tenant | 🟡 UI widgets only | P2 |
| Saved views / saved filters per list | ❌ | P1 |
| Scheduled reports by email | ❌ | P2 |
| PDF generation service (templates, letterheads) | ❌ | P1 (payslips, invoices, certificates) |
| Product analytics events (opt-in) | ❌ | P3 |
| Warehouse/BI export (CDC or nightly dump) | ❌ | P3 |

### 4.7 API & contracts

| Item | State | Pri |
|---|---|---|
| OpenAPI 3.1, contract tests, openapi lint | ✅ | |
| Standard error envelope | ✅ `core/schemas/errors.py` | |
| API versioning & deprecation policy (`/v1`, `Sunset` header) | 🔍 | P1 |
| Generated TS client from OpenAPI for web & mobile | 🔍 | P1 |
| Public vs internal API separation | ❌ | P2 |
| GraphQL (optional) | ❌ | P3 |

### 4.8 Plugin system

| Item | State | Pri |
|---|---|---|
| Discovery via entry points | ✅ | |
| Lifecycle hooks | ✅ startup/shutdown/configure | |
| **Stable public SDK** (`kernel.sdk`): plugins currently import internals (`kernel.user.models.user`, `kernel.tenancy.router`, …) | ❌ | **P0**. Otherwise every kernel refactor breaks every product |
| **Circular dependency debt (ARC-002)** | ❌ 9 `ignore_imports` in `.importlinter:74` suppress circular deps between kernel feature modules | P1 | Must be resolved before `kernel.sdk` can be frozen |
| Manifest: id, version, **required kernel version**, dependencies on other plugins, permissions declared, settings schema, migrations, menus | 🔍 | P1 |
| Install / upgrade / uninstall hooks (data migration, cleanup) per tenant | 🟡 activate/deactivate | P1 |
| Plugin-to-plugin contracts (events + service interfaces, no direct imports) | ❌ | P1 |
| Extension points (hooks/filters other plugins can extend, e.g. "add tab to user profile") | ❌ | P2 |
| Plugin isolation / resource limits / trust levels | ❌ | P2 |
| Plugin scaffolding CLI (`innostes new plugin`) | 🟡 `examples/module_template` | P1 |

### 4.9 Frontend (web) core

| Item | State | Pri |
|---|---|---|
| Design system `@innostes/ui` | ✅ | |
| Auth gate, setup wizard, API client | ✅ basic | |
| Silent token refresh + 401 retry queue in the API client | ❌ confirmed absent — `apiRequest` has no 401 intercept; `AuthGate` does one-shot startup refresh only | **P0** |
| `useAuth` / `useTenant` / `usePermission` / `<Can>` | 🔍 | P1 |
| **Frontend plugin manifest/registry** (routes, nav, permissions, widgets contributed by the plugin, lazy-loaded) | ❌ confirmed static — `routes.ts` has hard-coded `case` branches; plugins cannot contribute navigation | **P1** |
| CRUD scaffolding: `<ResourceList>`/`<ResourceForm>` driven by schema (OpenAPI/JSON-schema) | ❌ | P1. This is the "just add CRUD pages" promise |
| Data fetching standard (TanStack Query) + cache invalidation | ❌ confirmed absent — raw `fetch` via `apiRequest`, no query library | P1 |
| i18n (react-i18next / ICU), RTL, number/date/currency formatting | ❌ | P1 |
| Accessibility (WCAG 2.2 AA) audit | 🔍 | P1 |
| Error boundary + client error reporting (Sentry) | ❌ confirmed absent | P1 |
| PWA / offline shell | ❌ | P2 |
| Account pages: profile, security (MFA, sessions, devices), notifications prefs | ❌ — no user-facing account management pages exist | P1 |
| Admin console: users, roles, tenants, modules, audit, API keys, webhooks, settings | 🟡 audit trail + API keys + module manager exist; **users, roles and members pages are completely missing** | P1 |
| SSR/SEO path for public products (landing uses Next.js; app is Vite SPA) | 🟡 | P2 |

### 4.10 Mobile core

| Item | State | Pri |
|---|---|---|
| Body-token auth for mobile | ✅ | |
| Device registration / push token API | 🟡 model + service, **no router** | **P0** |
| Mobile SDK (React Native/Expo or Flutter): auth, secure storage (Keychain/Keystore), refresh, API client | ❌ | P1 |
| Push notifications (FCM/APNs) delivery | ❌ | P1 |
| Deep links / universal links (reset password, invite, magic link) | ❌ links go to `frontend_url` | P1 |
| Biometric unlock (local) + device binding | ❌ | P2 |
| Minimum app version / forced update endpoint | ❌ | P1 |
| Offline-first sync (delta sync, conflict resolution) | ❌ | P2 (field-force, attendance) |
| Remote config | ❌ | P2 |
| Mobile UI kit sharing design tokens with `@innostes/ui` | ❌ | P2 |
| App attestation (Play Integrity / App Attest) | ❌ | P3 |

### 4.11 Internationalisation & localisation

| Item | State | Pri |
|---|---|---|
| Backend message/error/email translations | ❌ | P1 |
| Timezone per tenant & user; store UTC | 🟡 tz-aware columns | P1 |
| Multi-currency, locale formatting | ❌ | P2 |
| Country packs (holidays, tax IDs, address formats, phone validation) | ❌ | P2 |
| Localised content in data (translatable fields) | ❌ | P3 |

### 4.12 Compliance & privacy

| Item | State | Pri |
|---|---|---|
| Consent records (terms version, marketing, cookies) | ❌ | P1 |
| DSAR: export & erase personal data (GDPR, India DPDP Act 2023) | ❌ | P1 |
| Retention schedules & legal hold | ❌ | P2 |
| Tamper-evident audit (see SEC-08) | ❌ | P1 |
| Access reviews report (who has what role) | ❌ | P2 |
| SOC 2 / ISO 27001 control mapping doc | ❌ | P3 |
| Cookie banner component | ❌ | P2 |

### 4.13 Observability & operations

| Item | State | Pri |
|---|---|---|
| `/health` with module checks | ✅ | |
| Separate liveness / readiness probes | ❌ confirmed — single `/health` endpoint combines both; no `/health/live` vs `/health/ready` split | P1 |
| Structured JSON logs with request-id, tenant-id, user-id correlation | ❌ confirmed — standard Python `logging` only; no middleware injects a correlation ID into every log line | **P0** |
| OpenTelemetry traces + metrics (Prometheus) | ❌ | P1 |
| Error tracking (Sentry) backend + frontend | ❌ | P1 |
| Per-tenant usage & SLO dashboards | ❌ | P2 |
| Graceful shutdown, DB pool tuning | 🟡 pool configured; graceful shutdown in lifespan hook | P2 |
| Backups, PITR, restore drill, per-tenant restore | ❌ | P1 |
| Maintenance mode / read-only mode | ❌ | P2 |
| Zero-downtime migration rules (expand/contract) | ❌ | P1 |

### 4.14 Deployment & developer experience

| Item | State | Pri |
|---|---|---|
| Docker compose for dev | ✅ | |
| Production deploy artefacts (Helm chart / Terraform / one-click installers) | ❌ | P1 |
| Environment config validation per environment | 🟡 (see SEC-02) | P0 |
| `create-innostes-app` starter: pick tenancy mode, auth methods, plugins | ❌ | P1. This *is* the "ready-made ship" |
| Plugin dev kit: test fixtures (authenticated client, tenant factory), local hot reload | 🔍 | P1 |
| Versioned kernel releases + CHANGELOG + upgrade guide | 🟡 | P1 |
| Separate the core into its own repo/package from the ERP products | ❌ (monorepo, branded "ERP") | P1 |
| Remove ERP branding from the core (`app_name="Innostes ERP API"`, SMTP sender, email templates) | ❌ | P1 |
| Load/perf test baseline (k6/Locust) | ❌ | P2 |

### 4.15 AI-readiness (increasingly expected of a 2026 core)

| Item | State | Pri |
|---|---|---|
| LLM gateway (provider abstraction, per-tenant keys, usage metering, cost caps) | ❌ | P2 |
| PII redaction before sending data to models | ❌ | P2 |
| Vector store abstraction (pgvector) for RAG over tenant data | ❌ | P3 |
| Agent/tool access through scoped API keys and an MCP server for the platform | ❌ | P3 |

---

## 5. Architectural decisions to make before more products are built

1. **Core vs. product boundary.** Rename and position the kernel as a product-neutral platform (no "ERP" in names, defaults or templates). ERP becomes one distribution of plugins.
2. **Configurable tenancy.** One codebase that supports `single`, `shared-schema` (default, with RLS) and `db-per-tenant`. Decide now; retrofitting is very expensive.
3. **Identity model.** Separate *identity* (a person who logs in) from *membership* (role in a tenant) from *user type* (staff/customer/vendor). This unlocks B2C, portals and marketplaces.
4. **Async backbone.** Pick one queue and an outbox pattern (Redis + arq/Dramatiq, or Postgres-only). Jobs, events, webhooks and notifications all sit on top of it.
5. **Public SDK and semantic versioning.** Freeze `kernel.sdk` (models a plugin may reference, services, dependencies, events). Everything else is private, enforced by import-linter (already in use).
6. **Schema-driven CRUD.** Standard list/filter/sort contract on the backend plus schema-driven list and form components on the frontend, so a new entity costs a model and a manifest, not a week.
7. **Auth provider strategy.** Build in-house (current path) vs. adopt a hardened engine for federation (e.g. Keycloak/Zitadel/Ory, or Authlib for OIDC/SAML client flows). In-house password auth is fine; in-house SAML is a security liability.
8. **Auth transport.** Pick one: (a) cookie-only — HttpOnly `__Host-` cookies, `SameSite=Strict`, CSRF token, `credentials: 'include'` on every fetch; or (b) Bearer-only — tokens in memory (never `localStorage`), 401-refresh interceptor, no cookies. Currently the backend sets cookies and the frontend ignores them and uses `localStorage`. Running both with the weaker one winning provides no protection.

---

## 6. Prioritised roadmap

### Sprint 0 — security blockers (nothing ships without these)

| Item | Issue ref |
|---|---|
| SEC-12 Fix token storage: pick cookie-only or Bearer-only, not both | |
| SEC-01 Secure cookies (`secure = env != dev`, `__Host-` prefix) | |
| SEC-02 Boot guard rejecting default JWT secret / short keys | |
| SEC-04 Rate limiting on auth endpoints (login, forgot-password, refresh) | |
| SEC-03 `TenantScopedService` + arch test enforcing tenant filter on every query | |
| SEC-13 `ProxyHeadersMiddleware` for trusted `X-Forwarded-For` | |

### Sprint 1 — SaaS admin core APIs (unblock product developers)

| Item | Notes |
|---|---|
| User CRUD: `GET /users` (list/search), `PATCH /users/{id}`, `DELETE /users/{id}` | Only POST + GET/{id} exist today |
| Invite flow: `POST /users/invite` → email → `POST /users/accept-invite` | `INVITED` status exists, no endpoint |
| Member management: `GET/POST/DELETE /tenants/current/members` | `TenantMember` table exists, no endpoint |
| RBAC management: assign/revoke roles, create custom roles, list permissions | Models + services exist, **no router at all** |
| Session API: `GET /auth/sessions`, `DELETE /auth/sessions/{id}` | `UserSession` table exists, no endpoint |
| Device registration API: `POST/GET /auth/devices` | `UserDevice` model exists, no router |
| Silent 401 refresh + retry queue in `apiRequest` | `AuthGate` only refreshes on startup |
| Admin UI pages: Users, Roles & Permissions, Members & Invites | No pages exist today |
| Profile / account page: change password, active sessions, devices | No page exists today |
| `usePermission` / `<Can>` components | Module UIs need this to gate content |
| Plugin-contributed routes in `routes.ts` | Routes are static; modules can't add navigation |

### Sprint 2 — production quality

- Async email / background job queue (invite email currently blocks the request)
- Standard list query contract: cursor+offset pagination, filter, sort, field selection
- Security headers middleware (SEC-05) + CSRF token (SEC-07)
- `TrustedHostMiddleware` (SEC-14)
- Structured JSON logs with correlation ID middleware (P0 ops need)
- DB statement timeout in `connect_args.server_settings`
- Separate `/health/live` and `/health/ready` probes
- OpenTelemetry traces + Sentry error tracking
- Per-plugin Alembic migration chains verified

### Sprint 3 — platform completeness

- MFA enrolment (schema ready; wire TOTP + passkeys)
- SSO / OIDC (`UserIdentity` table ready; add Authlib flows)
- `kernel.sdk` public surface + resolve ARC-002 circular deps
- Plans and entitlements, per-tenant branding, i18n, number series
- Custom fields, attachments, import/export, PDF service, report framework
- Backups, PITR, restore drill
- `create-innostes-app` starter + plugin dev kit
- Asymmetric JWT with JWKS (SEC-06)
- Tamper-evident audit hash chain (SEC-08)
- CI security scanning (pip-audit, Bandit, gitleaks)

### Sprint 4 — breadth

- Tenancy modes (single / shared-schema / db-per-tenant)
- User types (staff/customer/vendor), guest users, hierarchical tenants
- Mobile SDK, push notifications, deep links, offline sync
- Real-time channels, search adapter, feature flags, DSAR/consent/retention
- Helm/Terraform, load test baseline

---

## 7. Definition of "core is ready"

The core is ready when a new, **non-ERP** product (for example a B2C booking app with a mobile client) can be built by:

1. `create-innostes-app` → choose tenancy mode, auth methods, plugins;
2. writing only domain models, a plugin manifest and schema-driven pages;
3. getting, without writing core code: sign-up/login (password, OTP, social, SSO, MFA), users/roles/invites admin, files, notifications (in-app/email/push), jobs, events/webhooks, audit, import/export, reports, i18n, billing hooks, observability and secure defaults;
4. passing a security baseline (ASVS L2 checklist above, cross-tenant negative tests, dependency/SAST scans) **without changes to the kernel**.

Build two reference products on the core (the existing HRMS **and** one non-ERP B2C/mobile app) as the acceptance test for this audit.

---

## 8. Items to verify (🔍) — still open

These were not fully traced in the code review and need explicit verification before acting:

- Whether `require_permission` / `X-Tenant-ID` validates tenant **membership** for every auth type, including API keys (SEC-11)
- Whether `apply_scope` in `SecurityContext` is actually called by all relevant plugin queries (4.1 record-level RBAC)
- List pagination/filter conventions across existing plugins (are they consistent or does every plugin invent its own?)
- Per-plugin Alembic migration chains — whether plugins can declare migration ordering relative to a kernel version
- Log redaction — whether any access tokens or PII leak into current log output
- Request size limits — whether FastAPI default 1 MB body limit is active or overridden

**Resolved from previous 🔍 list (now confirmed):**

| Item | Result |
|---|---|
| Refresh-token reuse detection | ✅ — family revoke on replay implemented in `auth_service.py:341–351` |
| Frontend routes static or plugin-driven | ❌ confirmed static — `routes.ts` hard-codes every `case` branch |
| API client 401 refresh | ❌ confirmed absent — `apiRequest` has no 401 intercept |
| Data fetching standard (TanStack Query) | ❌ confirmed absent — raw `fetch` only |
| Error boundary / Sentry frontend | ❌ confirmed absent |
| Separate liveness / readiness probes | ❌ confirmed — single `/health` only |
| Structured JSON logs | ❌ confirmed — standard `logging` only, no correlation middleware |
| Password policy / HIBP breach check | ❌ confirmed absent |
| CI security scanning (pip-audit, Bandit, gitleaks) | ❌ confirmed — not in `ci.yml` step list |
