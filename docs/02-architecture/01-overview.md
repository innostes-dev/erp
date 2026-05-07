# Architecture Overview

This document explains the high-level design decisions that shape Mono — why a monorepo, how modules are integrated, how the three-layout system works, and the backend-first development principle that keeps the API contract authoritative.

## Table of Contents

- [Why a Monorepo?](#why-a-monorepo)
- [Why Build-Time Integration (Not Module Federation)](#why-build-time-integration-not-module-federation)
- [The Three-Layout System](#the-three-layout-system)
- [Request Flow](#request-flow)
- [Backend-First Principle](#backend-first-principle)
- [Module Isolation Rules](#module-isolation-rules)

---

## Why a Monorepo?

Mono uses a single repository for all applications and libraries. This is a deliberate trade-off against the polyrepo model.

### Shared types without versioning

In a polyrepo, a `User` type lives in a shared package that must be published, versioned, and kept in sync across consumers. When the `User` type gains a `roles` field, every consumer must bump the dependency and ship a release — even if they are deployed together. In Mono, `@mono/shared/types` is a path alias that points directly to `libs/shared/types/src/index.ts`. A type change is immediately reflected in every consumer at compile time, and TypeScript will surface every call site that needs updating before you commit.

### One CI pipeline

A single `nx affected` command determines exactly which projects need to be built, tested, and deployed based on what changed. There is no cross-repo dependency tracking, no need to trigger downstream pipelines manually, and no risk of deploying an API change without simultaneously deploying the frontend that depends on it.

### Atomic changes

A pull request can update the API contract (DTO), the shared type, the NestJS controller, the React query hook, and the UI component in a single diff. Reviewers see the entire change. The CI gate validates the entire change. There is no window where production has an API that the frontend does not understand.

### Nx as the orchestrator

Nx 22 handles the complexity of a large monorepo:
- **Computation cache** — results of `build`, `test`, `lint`, and `typecheck` targets are cached locally and can be shared across machines via Nx Cloud.
- **Affected detection** — using the Git history, Nx computes the minimal set of projects that need to run for a given change.
- **Project graph** — Nx enforces import boundaries defined by `tags` in `project.json` files, preventing modules from importing each other's internals.
- **Code generation** — custom Nx generators (`npm run g:module`, `npm run g:service`) scaffold new modules and services in the correct directory with the correct boilerplate.

---

## Why Build-Time Integration (Not Module Federation)

Webpack Module Federation and similar runtime federation approaches allow separate Next.js apps to share components across origins at runtime. We deliberately chose **not** to use Module Federation for these reasons:

1. **Complexity cost.** Module Federation requires every federated remote to be deployed separately, with careful versioning of shared dependencies (React, ReactDOM, Tailwind) to avoid version conflicts at runtime. The debugging experience when a version mismatch occurs is poor.

2. **TypeScript boundary loss.** Federated modules cross a runtime boundary. TypeScript cannot statically verify the contract between the host and remotes — you must hand-write `declare module` stubs or rely on generated types that can drift.

3. **Simpler deployment.** A single Next.js build output can be deployed to Vercel, a Docker container, or a CDN with no coordination between separate remote deployments. There is one version of the frontend in production at any time.

4. **Team size fit.** Module Federation pays off when teams are large enough to own and deploy remotes independently, with separate release cycles. Mono's domain modules are co-owned; a single repository, single deployment model, and single CI gate is the right abstraction at this scale.

Instead, each domain module is a set of TypeScript libraries under `libs/modules/<name>/`. They compile into the shell's Next.js bundle at build time. The boundary between modules is enforced at the import level by Nx's tag-based lint rules, not at the deployment level by a federation host.

---

## The Three-Layout System

The shell uses three nested React layouts, each implemented as a Next.js App Router `layout.tsx` file. Each layout handles one concern and delegates rendering to its children.

### Layout 1 — Root Layout (`apps/shell/src/app/layout.tsx`)

Wraps every page in the application. Responsibilities:

- Renders `<html>` and `<body>` tags.
- Calls `getServerSession()` (server component, reads cookie).
- Fetches feature flags from `/api/config/flags` (cached for 5 minutes via `next: { revalidate: 300 }`).
- Mounts `<KernelProviders>`, which initialises `AuthProvider`, the global Zustand store, the event bus, and the telemetry context — all as React client components hydrated with server-fetched data.

### Layout 2 — Auth Layout (`apps/shell/src/app/login/layout.tsx`)

A minimal layout for unauthenticated pages (currently `/login`). It does not render the topbar or side-nav. It redirects to `/` if a session already exists.

### Layout 3 — Module Layout (`apps/shell/src/app/(modules)/layout.tsx`)

Wraps all authenticated module pages inside the `(modules)` route group. Responsibilities:

- Calls `getServerSession()` — redirects to `/login` if no session exists.
- Renders `<WorkspaceTopbar>` (top navigation bar).
- Renders `<ShellNav>` (side navigation listing all modules).
- Renders `<main>` where the module's page content appears.

The `(modules)` parentheses in the folder name are a Next.js App Router convention: the group name is excluded from the URL. Routes inside this group are accessible at `/analytics`, not `/(modules)/analytics`.

```
URL: /analytics
File: apps/shell/src/app/(modules)/analytics/page.tsx
Layout chain: RootLayout > ModuleLayout > AnalyticsPage
```

---

## Request Flow

This diagram traces a browser request through every layer of the platform:

```
Browser
  │
  │  GET http://localhost:3000/analytics
  ▼
Next.js Dev Server (port 3000)
  │
  │  Route match: (modules)/analytics/page.tsx
  │  Layout chain: RootLayout → ModuleLayout → Page
  │
  │  [Server Component] getServerSession()
  │     → reads "session" cookie
  │     → GET http://localhost:3001/api/auth/me  (server-to-server)
  │                        │
  │                        ▼
  │                  NestJS API Gateway (port 3001)
  │                    JwtAuthGuard.canActivate()
  │                      → reads Authorization header
  │                      → AuthService.validateToken()
  │                      → attaches user to request
  │                    AuthController.getMe()
  │                      → returns User
  │                    TransformInterceptor
  │                      → wraps: { data: User, success: true, message: "OK" }
  │                        │
  │                        ▼
  │  getServerSession() returns User | null
  │  if null → redirect('/login')
  │
  │  [Server Component] renders WorkspaceTopbar, ShellNav, module page
  │  [RSC Payload] streamed to browser
  │
  ▼
Browser receives HTML + RSC payload
  │
  │  React hydrates client components (AuthProvider, stores, etc.)
  │
  │  User clicks "Export CSV" → client component fires
  │  useAuth().token → fetched from Zustand store
  │
  │  fetch('/api/analytics/export', { headers: { Authorization: 'Bearer sess_...' } })
  │     ↕ Next.js rewrite (next.config.ts)
  │  → http://localhost:3001/api/analytics/export
  │                        │
  │                        ▼
  │                  NestJS API Gateway (port 3001)
  │                    JwtAuthGuard → validates Bearer token
  │                    AnalyticsController.export()
  │                    AnalyticsService → DrizzleORM → PostgreSQL
  │                    TransformInterceptor → ApiResponse envelope
  │                        │
  │                        ▼
  │  Browser receives { data: [...], success: true, message: "OK" }
  ▼
UI updates
```

---

## Backend-First Principle

**Write the API contract before writing the UI.**

This principle means:

1. **Define the DTO first.** Before touching React, create the NestJS DTO class with `class-validator` decorators and Swagger `@ApiProperty` annotations. This is the single source of truth for the shape of the request and response.

2. **Define the shared type second.** Add or update the corresponding type in `libs/shared/types/`. This type is used by both the NestJS service return value and the React query hook response type.

3. **Write the controller and service.** Implement the endpoint using the DTO and type you defined.

4. **Write the data-access layer.** Create the API call function in `libs/modules/<name>/data-access/` that calls the endpoint and returns the shared type.

5. **Write the UI last.** Build the React components and pages that consume the data-access layer. The TypeScript compiler guarantees at compile time that the UI consumes exactly what the API provides.

Why does this order matter? When you build UI first, you make assumptions about the API shape that are often wrong. You then spend time retrofitting the data-access layer, fixing mismatched types, and dealing with `undefined` values you did not anticipate. Working API-first means the contract is locked before the first line of React is written.

---

## Module Isolation Rules

These rules are enforced by Nx's tag-based lint configuration (`eslint.config.mjs`) and will cause a lint error if violated.

### Rule 1: Modules cannot import from each other

```
# FORBIDDEN
# libs/modules/analytics/feature imports from libs/modules/reporting/data-access
import { useReportingData } from '@mono/modules/reporting/data-access';
```

If two modules need to share data, they must go through:
- A shared type in `@mono/shared/types`
- An event on the event bus (`@mono/kernel/event-bus`)
- A new shared utility in `@mono/shared/utils`

### Rule 2: Lower layers cannot import from higher layers within a module

Within a module, the allowed import directions are:

```
feature  →  ui          ✓
feature  →  data-access ✓
feature  →  utils       ✓
ui       →  utils       ✓
data-access → utils     ✓

ui       →  feature     ✗  (UI cannot import from feature)
data-access → ui        ✗  (data-access cannot import UI)
data-access → feature   ✗  (data-access cannot import feature)
utils    →  anything    ✗  (utils cannot import from any other layer)
```

### Rule 3: `libs/shared` has no React, no NestJS

`libs/shared/` is platform-agnostic. It may only contain:
- Pure TypeScript types (`@mono/shared/types`)
- Pure utility functions (`@mono/shared/utils`)
- React hooks that are purely data-manipulation (no JSX, no rendering — `@mono/shared/hooks`)
- Constants (`@mono/shared/constants`)
- Test utilities (`@mono/shared/testing`)

Any shared code that imports from `react`, `next`, or `@nestjs/*` does not belong in `libs/shared`. Put it in `libs/kernel` (if it is a platform service) or in `libs/ui` (if it renders UI).

### Rule 4: `libs/kernel` is not imported by `libs/shared` or `libs/ui`

Kernel libraries are consumed downstream only:
- `apps/shell` can import from `libs/kernel`
- `libs/modules/*/feature` can import from `libs/kernel`
- `libs/shared` cannot import from `libs/kernel`
- `libs/ui` cannot import from `libs/kernel`

This keeps `libs/ui` and `libs/shared` independently testable without needing to mock kernel providers.

### Rule 5: `apps/api-gateway` cannot import from `libs/kernel`, `libs/ui`, or `libs/modules`

The NestJS gateway is a server-only application. It may only import:
- `@mono/shared/types` (shared TypeScript types)
- `@mono/shared/constants` (shared constants)
- `@mono/shared/utils` (pure utility functions)

Any attempt to import a React component or a browser-only kernel library into the NestJS process will fail at runtime, not just at lint time.
