# Mono — Architecture Overview

## What Is This

Mono is an **enterprise-grade Nx monorepo** that hosts multiple product modules under a single shell. Every module shares a common kernel (auth, state, routing, events, config, telemetry) and a common UI system, but each module team owns its own code boundary and can develop independently.

The architecture is **build-time federation** — modules are Nx libs compiled together at build time, not loaded at runtime via Webpack Module Federation. This gives you the simplicity of a monorepo with the isolation of independent teams.

---

## Technology Stack

| Layer | Choice |
|---|---|
| Monorepo tooling | Nx 22 + pnpm workspaces |
| Frontend shell | Next.js 15 (App Router, RSC) |
| Backend gateway | NestJS 11 |
| Language | TypeScript 5 (strict mode) |
| State management | Zustand 5 |
| Cross-module events | mitt (typed event bus) |
| Styling | Tailwind CSS v3 + clsx + tailwind-merge |
| Package registry | PayPal internal npm proxy |

---

## Repository Layout

```
mono/
├── apps/
│   ├── shell/              Next.js host app (workspace launcher + all module routes)
│   └── api-gateway/        NestJS BFF — auth + future service proxies
│
├── libs/
│   ├── kernel/             Shared runtime consumed by every module
│   │   ├── auth/           Authentication context, hooks, server session
│   │   ├── state/          Zustand kernel store + module store factory
│   │   ├── event-bus/      Typed cross-module event bus (mitt)
│   │   ├── router/         Imperative navigation + AppLink component
│   │   ├── config/         Feature flags + app config provider
│   │   └── telemetry/      Pluggable telemetry adapter
│   │
│   ├── modules/            Domain modules — one folder per team/domain
│   │   └── analytics/      Example module (4 layers: feature, ui, data-access, utils)
│   │
│   ├── shared/             Utilities shared across all code
│   │   ├── types/          Common TypeScript interfaces (ApiResponse, BaseEntity …)
│   │   ├── utils/          Pure functions (formatDate, debounce …)
│   │   ├── hooks/          Generic React hooks (useDebounce, useLocalStorage …)
│   │   ├── constants/      App-wide constants (ROUTES, HTTP_STATUS …)
│   │   └── testing/        Test helpers (renderWithProviders, createMockUser, MSW)
│   │
│   ├── ui/                 Design system
│   │   ├── components/     Button, Badge, Spinner, ErrorBoundary, EmptyState
│   │   ├── tokens/         Design token constants
│   │   └── icons/          SVG icon components
│   │
│   └── data-access/
│       └── http/           Axios client with auth interceptor + telemetry
│
├── tools/
│   └── generators/         Custom Nx generators (module scaffold, service scaffold)
│
├── docs/                   This documentation
├── tsconfig.base.json      Root TS config + all @mono/* path aliases
├── nx.json                 Nx target defaults, caching, plugin registration
├── eslint.config.mjs       Module boundary rules (enforces layer + scope isolation)
└── pnpm-workspace.yaml     Workspace package roots
```

---

## Key Design Decisions

### 1. Build-time federation (not Webpack MF)
All modules compile into the same Next.js bundle. No separate deployments per module. The tradeoff: a change in any module requires rebuilding the shell — but Nx's computation cache keeps this fast.

### 2. Kernel as shared runtime
The `libs/kernel/*` libraries are the only code that crosses module boundaries. Every module can consume kernel auth, state, events, and config, but modules cannot import from each other directly. This is enforced at lint time by `@nx/enforce-module-boundaries`.

### 3. Four-layer module architecture
Every domain module is split into four libraries, each with a distinct responsibility and import rule:

```
feature  →  can import ui, data-access, utils, kernel
ui       →  can import ui, utils (NO kernel, NO data-access)
data-access → can import utils, types, kernel
utils    →  can import utils, types only
```

### 4. Server + client boundary
Next.js App Router distinguishes between Server Components (RSC) and Client Components. Auth guards run on the server (`getServerSession`), UI state runs on the client (`useAuth`, Zustand stores). `server-only` is imported in server-side kernel files to prevent accidental client-side use.

---

## Data Flow

```
Browser
  └── GET /analytics
        └── analytics/page.tsx (RSC)
              ├── getServerSession()  →  reads cookie/header → redirects if null
              └── renders <AnalyticsDashboard /> (client component)
                    └── useEffect → fetchAnalyticsSummary() → state → MetricCard[]
```

```
Login flow
  /login → LoginForm (client)
          └── useAuth().login({ email, password })
                └── POST /api/auth/login (api-gateway)
                      └── returns { user, token }
                            └── AuthProvider stores in sessionStorage
                                  └── router.push('/')
```
