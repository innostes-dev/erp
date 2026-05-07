# Monorepo Structure

This document describes every folder in the repository, explains what belongs there, and specifies the Nx tags that control which projects may import from which.

## Table of Contents

- [Top-Level Layout](#top-level-layout)
- [apps/shell — Next.js Frontend](#appsshell--nextjs-frontend)
- [apps/api-gateway — NestJS Backend](#appsapi-gateway--nestjs-backend)
- [libs/kernel — Platform Services](#libskernel--platform-services)
- [libs/ui — Design System](#libsui--design-system)
- [libs/shared — Cross-Cutting Utilities](#libsshared--cross-cutting-utilities)
- [libs/modules — Domain Modules](#libsmodules--domain-modules)
- [Path Alias Reference](#path-alias-reference)
- [Nx Tags System](#nx-tags-system)

---

## Top-Level Layout

```
mono/
├── apps/
│   ├── shell/                  Next.js 15 — browser shell
│   └── api-gateway/            NestJS 11 — REST API gateway
├── libs/
│   ├── kernel/                 Platform singleton services (web only)
│   ├── ui/                     Shared design system (web only)
│   ├── shared/                 Pure utilities, no framework imports
│   └── modules/                Domain feature modules
│       └── analytics/          Example module (4-layer structure)
├── docs/                       This documentation
├── tools/                      Nx generators and workspace scripts
├── .env                        Local environment variables (git-ignored)
├── .env.example                Committed template for .env
├── eslint.config.mjs           ESLint rules including Nx boundary enforcement
├── nx.json                     Nx workspace configuration, target defaults
├── package.json                Root scripts and shared devDependencies
├── pnpm-lock.yaml              Lockfile (do not edit manually)
├── pnpm-workspace.yaml         Declares workspace package glob patterns
├── prettier.config.mjs         Prettier formatting rules
└── tsconfig.base.json          Shared TypeScript options and path aliases
```

---

## apps/shell — Next.js Frontend

**Nx tags:** `type:app`, `scope:shell`, `platform:web`

The shell is the entry point for browser users. It owns the URL namespace, the root layout, navigation chrome, and the composition of module pages.

```
apps/shell/
├── src/
│   ├── app/                        Next.js App Router root
│   │   ├── layout.tsx              Root layout: <html>, KernelProviders, feature flags
│   │   ├── page.tsx                Workspace dashboard (/)
│   │   ├── (modules)/              Route group — authenticated module pages
│   │   │   ├── layout.tsx          Checks session, renders topbar + side-nav
│   │   │   └── analytics/          Analytics module entry point
│   │   │       └── ...             Pages and nested routes for analytics
│   │   ├── login/                  Login page (unauthenticated)
│   │   │   ├── layout.tsx          Minimal layout, redirects if already logged in
│   │   │   └── page.tsx            Renders <LoginForm>
│   │   └── developer/              Developer tooling pages
│   │       └── api/
│   │           ├── layout.tsx
│   │           └── page.tsx        Mirrors Swagger spec as an in-app portal
│   ├── components/                 Shell-level components (not module-specific)
│   │   ├── login-form.tsx          Client component that calls useAuth().login()
│   │   ├── shell-nav.tsx           Side navigation listing all registered modules
│   │   ├── workspace-topbar.tsx    Top bar with user menu and module switcher
│   │   ├── workspace-greeting.tsx  Personalised dashboard greeting
│   │   ├── module-card.tsx         Card displayed in the workspace grid
│   │   └── kernel-providers.tsx    Client component that mounts all kernel providers
│   ├── lib/
│   │   └── modules.ts              Central registry: array of module metadata (id, name, route, icon)
│   └── styles/
│       └── globals.css             Tailwind base/components/utilities directives
├── next.config.ts                  Next.js config: rewrites, transpilePackages, typedRoutes
├── project.json                    Nx project config: tags, targets
├── tailwind.config.ts              Tailwind content paths, custom theme tokens
└── tsconfig.json                   Extends tsconfig.base.json, includes App Router types
```

### Key files explained

**`app/layout.tsx`** — The root layout is an `async` React Server Component. It calls `getServerSession()` and `getConfig()` in parallel, then passes `initialUser` and `flags` down to `<KernelProviders>` as props. This avoids a client-side loading flash: the user object is available on first render.

**`lib/modules.ts`** — The module registry is a plain TypeScript array. To add a new module to the shell nav and workspace grid, add one entry here. The shell does not scan the filesystem at runtime; the registry is the authoritative list.

**`next.config.ts`** — The `rewrites()` function proxies every `/api/*` request to `NEXT_PUBLIC_API_URL/api/*`. This means the browser always communicates with the same origin (`localhost:3000`) and the CORS restriction on the gateway only needs to allow `localhost:3000`. The `transpilePackages` array lists every `@mono/*` library so Next.js can compile their TypeScript source directly without a separate build step.

---

## apps/api-gateway — NestJS Backend

**Nx tags:** `type:app`, `scope:infra`, `platform:server`

The gateway is the only server-side process that talks to the database. It exposes all platform APIs under the `/api` prefix.

```
apps/api-gateway/
├── src/
│   ├── main.ts                     Bootstrap: ValidationPipe, CORS, Swagger, listen
│   ├── app.module.ts               Root NestJS module: imports all feature modules
│   ├── common/                     Cross-cutting NestJS infrastructure
│   │   ├── decorators/
│   │   │   └── public.decorator.ts @Public() — marks a route as unauthenticated
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  Global error filter: maps exceptions to ApiResponse errors
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts   Global guard: validates Bearer token via AuthService
│   │   └── interceptors/
│   │       └── transform.interceptor.ts  Global interceptor: wraps 2xx responses in ApiResponse<T>
│   ├── config/
│   │   └── app.config.ts           Reads PORT, SHELL_URL, DATABASE_URL from process.env
│   ├── database/
│   │   ├── database.module.ts      NestJS module that provides the Drizzle client
│   │   ├── schema/
│   │   │   └── users.schema.ts     Drizzle table definition for the users table
│   │   └── seed.ts                 One-time seed script run via npm run db:seed
│   ├── health/
│   │   ├── health.controller.ts    GET /api/health — returns { status: "ok", timestamp }
│   │   └── health.module.ts
│   └── modules/
│       └── auth/                   Authentication feature module
│           ├── auth.controller.ts  POST /login, POST /refresh, POST /logout, GET /me
│           ├── auth.module.ts      NestJS module: binds repositories, registers providers
│           ├── auth.service.ts     Business logic: login, validateToken, refresh, logout
│           ├── dto/
│           │   └── login.dto.ts    LoginDto: email (IsEmail), password (IsString, MinLength)
│           ├── interfaces/         TypeScript interfaces for auth shapes
│           └── repositories/
│               ├── user.repository.interface.ts    IUserRepository contract
│               ├── static-user.repository.ts       In-memory hardcoded users (dev default)
│               └── drizzle-user.repository.ts      PostgreSQL-backed implementation
├── drizzle.config.ts               drizzle-kit config: schema path, migrations output dir
├── project.json                    Nx targets: dev (ts-node + tsconfig-paths), build (tsc)
└── tsconfig.json                   Extends tsconfig.base.json, adds emitDecoratorMetadata
```

### Key patterns explained

**`common/` is infrastructure, not business logic.** Everything in `common/` applies globally (guards, filters, interceptors). Feature modules in `modules/` must not contain cross-cutting infrastructure; they contain only controllers, services, DTOs, and repositories for their own domain.

**Repository pattern with dependency injection.** `IUserRepository` is an interface. `auth.module.ts` decides at runtime which implementation to bind — `StaticUserRepository` when no database URL is present, `DrizzleUserRepository` when `DATABASE_URL` is set. NestJS injects the correct implementation into `AuthService` via the `USER_REPOSITORY` token. This means `AuthService` never imports a concrete class; it only depends on the interface.

**`@Public()` decorator.** `JwtAuthGuard` is registered as a global guard via `APP_GUARD`. This means every endpoint requires a valid Bearer token by default. Endpoints that should be publicly accessible (login, health check) are decorated with `@Public()`, which sets metadata that the guard reads via `Reflector`.

---

## libs/kernel — Platform Services

**Nx tags:** `type:kernel`, `scope:kernel`, `platform:web`

Kernel libraries are singleton browser-side services. They are initialised once at the root layout level and consumed anywhere in the shell or module feature layers.

```
libs/kernel/
├── auth/                   Authentication state and helpers
│   └── src/
│       ├── index.ts        Public API: AuthProvider, useAuth, withAuth, hasPermission, ...
│       └── server.ts       Server-only export: getServerSession() (reads cookie, calls /api/auth/me)
│       └── lib/
│           ├── auth.context.ts        React context definition
│           ├── auth.provider.tsx      Client component: useReducer-based auth state machine
│           ├── auth.types.ts          AuthState, AuthContextValue, LoginCredentials
│           ├── create-module-store.ts Factory for module-scoped Zustand stores
│           ├── has-permission.ts      hasRole(), hasPermission(), hasAnyPermission(), hasAllPermissions()
│           ├── kernel.store.ts        Global Zustand store (KernelStore)
│           ├── state.types.ts         KernelStore type definition
│           └── use-auth.ts            useAuth() hook: reads AuthContext, throws if outside AuthProvider
├── config/                 Runtime configuration for the shell
│   └── src/
│       └── index.ts        getConfig(): reads NEXT_PUBLIC_API_URL, API_URL at runtime
├── event-bus/              Cross-module pub/sub (mitt)
│   └── src/
│       └── index.ts        createEventBus(), useEventBus() hook, event type registry
├── router/                 Type-safe navigation helpers
│   └── src/
│       └── index.ts        useRouter wrapper, route constants, navigation helpers
├── state/                  Zustand store utilities
│   └── src/
│       └── index.ts        Re-exports useKernelStore, createModuleStore
└── telemetry/              Observability hooks (analytics events, error tracking)
    └── src/
        └── index.ts        track(), trackError(), TelemetryProvider
```

### Import rules for kernel

| Consumer | Can import kernel? |
|---|---|
| `apps/shell` | Yes |
| `libs/modules/*/feature` | Yes |
| `libs/modules/*/ui` | No |
| `libs/modules/*/data-access` | No |
| `libs/modules/*/utils` | No |
| `libs/shared/*` | No |
| `libs/ui/*` | No |
| `apps/api-gateway` | No |

### `auth` has two entry points

`@mono/kernel/auth` — browser-safe exports: `AuthProvider`, `useAuth`, `withAuth`, permission helpers. Safe to import in client components.

`@mono/kernel/auth/server` — server-only exports: `getServerSession()`. This function reads the session cookie and calls the API. It uses `cookies()` from `next/headers` which is only available in server components and Route Handlers. Importing it in a client component will throw a runtime error.

---

## libs/ui — Design System

**Nx tags:** `type:ui`, `scope:ui`, `platform:web`

The UI libraries contain visual building blocks. They have no business logic and no dependency on kernel services. Every component accepts explicit props; none reads from a Zustand store directly.

```
libs/ui/
├── components/             Reusable React components
│   └── src/
│       └── index.ts        Exports: Button, Input, Badge, Card, Modal, Table, Spinner, ...
├── tokens/                 Design tokens
│   └── src/
│       └── index.ts        Color palette, spacing scale, typography scale, breakpoints
└── icons/                  Icon wrapper components (lucide-react)
    └── src/
        └── index.ts        Re-exports sized and styled lucide-react icons
```

### Design principles for `libs/ui`

- **No `useAuth`, no `useRouter`, no `useEventBus`.** UI components receive data and callbacks as props. The caller (in a module's `ui` or `feature` layer) is responsible for connecting the component to platform services.
- **No business logic.** A `<UserTable>` component in `libs/ui` renders rows from a `users` prop. It does not fetch users from the API. The data-access layer fetches; the UI layer displays.
- **Tailwind only.** All styling is done with Tailwind utility classes. No CSS modules, no styled-components, no inline `style` props (except for dynamic values that Tailwind cannot express, such as `background-image` with a data URI).

---

## libs/shared — Cross-Cutting Utilities

**Nx tags:** Varies by sub-library (see table below)

Shared libraries are imported by both the frontend and the backend. They must be framework-agnostic: no `react`, no `next`, no `@nestjs/*` imports.

```
libs/shared/
├── types/                  Canonical TypeScript types
│   └── src/
│       └── index.ts        User, ApiResponse<T>, PaginatedResponse<T>, Role, Permission, ...
├── utils/                  Pure utility functions
│   └── src/
│       └── index.ts        formatDate, formatCurrency, slugify, clamp, deepMerge, ...
├── hooks/                  Data-manipulation React hooks (no JSX)
│   └── src/
│       └── index.ts        useDebounce, usePrevious, useLocalStorage, ...
├── constants/              Shared constant values
│   └── src/
│       └── index.ts        API_ROUTES, PERMISSIONS, ROLES, DEFAULT_PAGE_SIZE, ...
└── testing/                Test utilities
    └── src/
        └── index.ts        createMockUser(), renderWithProviders(), mockApiResponse(), ...
```

| Sub-library | Nx tags | Platform |
|---|---|---|
| `shared/types` | `type:types`, `scope:shared`, `platform:isomorphic` | Both |
| `shared/utils` | `type:util`, `scope:shared`, `platform:isomorphic` | Both |
| `shared/hooks` | `type:util`, `scope:shared`, `platform:web` | Browser only |
| `shared/constants` | `type:util`, `scope:shared`, `platform:isomorphic` | Both |
| `shared/testing` | `type:util`, `scope:shared`, `platform:isomorphic` | Test only |

> **Note:** `libs/shared/hooks` has `platform:web` because React hooks are browser-specific. Despite containing no JSX, the React runtime is a browser concept. The `apps/api-gateway` linting rules block `platform:web` imports.

---

## libs/modules — Domain Modules

**Nx tags:** Vary by layer (see table below)

Each domain module under `libs/modules/<name>/` is split into four layers. This split enforces unidirectional data flow and prevents business logic from bleeding into presentational components.

```
libs/modules/
└── analytics/              Domain module: analytics
    ├── feature/            Orchestration layer
    │   └── src/
    │       └── index.ts    AnalyticsDashboardPage, useAnalyticsOrchestration, ...
    ├── ui/                 Presentational layer
    │   └── src/
    │       └── index.ts    MetricCard, ChartPanel, ExportButton, FilterBar, ...
    ├── data-access/        API and store layer
    │   └── src/
    │       └── index.ts    useAnalyticsMetrics(), analyticsApi, useAnalyticsStore, ...
    └── utils/              Pure logic layer
        └── src/
            └── index.ts    formatMetric(), aggregateByDay(), buildExportPayload(), ...
```

### Layer responsibilities

| Layer | Path alias | What it contains | What it may import |
|---|---|---|---|
| `feature` | `@mono/modules/<name>/feature` | Pages, route logic, connects data-access to UI | `ui`, `data-access`, `utils`, `@mono/kernel/*`, `@mono/ui/*`, `@mono/shared/*` |
| `ui` | `@mono/modules/<name>/ui` | Dumb presentational components | `utils`, `@mono/ui/*`, `@mono/shared/*` |
| `data-access` | `@mono/modules/<name>/data-access` | API calls, Zustand store, query hooks | `utils`, `@mono/shared/*` |
| `utils` | `@mono/modules/<name>/utils` | Pure functions, formatters, validators | `@mono/shared/types`, `@mono/shared/utils`, `@mono/shared/constants` |

### Adding a new module

Use the custom Nx generator to scaffold all four layers at once:

```bash
npm run g:module
# Prompts for module name, then creates:
# libs/modules/<name>/{feature,ui,data-access,utils}/src/index.ts
# libs/modules/<name>/{feature,ui,data-access,utils}/project.json
# Updates tsconfig.base.json with four new path aliases
# Adds the module to apps/shell/src/lib/modules.ts registry
```

---

## Path Alias Reference

All aliases are defined in `tsconfig.base.json` and resolve to `src/index.ts` of each library. Next.js also requires them in `transpilePackages` in `next.config.ts`.

| Alias | Resolves to |
|---|---|
| `@mono/kernel/auth` | `libs/kernel/auth/src/index.ts` |
| `@mono/kernel/auth/server` | `libs/kernel/auth/src/server.ts` |
| `@mono/kernel/state` | `libs/kernel/state/src/index.ts` |
| `@mono/kernel/event-bus` | `libs/kernel/event-bus/src/index.ts` |
| `@mono/kernel/router` | `libs/kernel/router/src/index.ts` |
| `@mono/kernel/config` | `libs/kernel/config/src/index.ts` |
| `@mono/kernel/telemetry` | `libs/kernel/telemetry/src/index.ts` |
| `@mono/ui/components` | `libs/ui/components/src/index.ts` |
| `@mono/ui/tokens` | `libs/ui/tokens/src/index.ts` |
| `@mono/ui/icons` | `libs/ui/icons/src/index.ts` |
| `@mono/shared/types` | `libs/shared/types/src/index.ts` |
| `@mono/shared/utils` | `libs/shared/utils/src/index.ts` |
| `@mono/shared/hooks` | `libs/shared/hooks/src/index.ts` |
| `@mono/shared/constants` | `libs/shared/constants/src/index.ts` |
| `@mono/shared/testing` | `libs/shared/testing/src/index.ts` |
| `@mono/modules/analytics/feature` | `libs/modules/analytics/feature/src/index.ts` |
| `@mono/modules/analytics/ui` | `libs/modules/analytics/ui/src/index.ts` |
| `@mono/modules/analytics/data-access` | `libs/modules/analytics/data-access/src/index.ts` |
| `@mono/modules/analytics/utils` | `libs/modules/analytics/utils/src/index.ts` |

> **Note:** The aliases are resolved by TypeScript (via `tsconfig-paths` in the NestJS dev target), by Next.js (via `transpilePackages` + Webpack), and by Nx (for its project graph). When you add a new library, update all three: `tsconfig.base.json`, `next.config.ts` `transpilePackages`, and run `npm run g:module` (which handles this automatically).

---

## Nx Tags System

Tags in `project.json` are metadata strings that Nx's ESLint plugin uses to enforce import boundaries. A lint error fires if a project with one set of tags tries to import from a project whose tags are disallowed by the boundary rules in `eslint.config.mjs`.

### Tag dimensions

| Dimension | Values | Purpose |
|---|---|---|
| `type` | `app`, `lib`, `kernel`, `ui`, `types`, `util` | What kind of artifact this project produces |
| `scope` | `shell`, `infra`, `kernel`, `ui`, `shared`, `analytics`, … | Which team or domain owns this project |
| `platform` | `web`, `server`, `isomorphic` | Which runtime this project targets |

### Tag assignments by project

| Project | Tags |
|---|---|
| `apps/shell` | `type:app`, `scope:shell`, `platform:web` |
| `apps/api-gateway` | `type:app`, `scope:infra`, `platform:server` |
| `libs/kernel/*` | `type:kernel`, `scope:kernel`, `platform:web` |
| `libs/ui/*` | `type:ui`, `scope:ui`, `platform:web` |
| `libs/shared/types` | `type:types`, `scope:shared`, `platform:isomorphic` |
| `libs/shared/utils` | `type:util`, `scope:shared`, `platform:isomorphic` |
| `libs/shared/hooks` | `type:util`, `scope:shared`, `platform:web` |
| `libs/shared/constants` | `type:util`, `scope:shared`, `platform:isomorphic` |
| `libs/shared/testing` | `type:util`, `scope:shared`, `platform:isomorphic` |
| `libs/modules/*/feature` | `type:feature`, `scope:<module>`, `platform:web` |
| `libs/modules/*/ui` | `type:ui`, `scope:<module>`, `platform:web` |
| `libs/modules/*/data-access` | `type:data-access`, `scope:<module>`, `platform:web` |
| `libs/modules/*/utils` | `type:util`, `scope:<module>`, `platform:isomorphic` |

### Enforcing boundaries in CI

Boundary violations are lint errors. They are caught by:

```bash
npm run lint              # lint every project
npm run affected:lint     # lint only projects affected by your changes
```

A boundary violation looks like this in the terminal:

```
libs/modules/analytics/ui/src/components/chart.tsx
  1:1  error  A project tagged with "type:ui" may not import from a project tagged "type:kernel"  @nx/enforce-module-boundaries
```

Fix the violation by moving the import to the correct layer or by extracting the shared logic into `libs/shared`.
