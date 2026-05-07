# Mono — Platform Documentation

## Table of Contents

- [What Is Mono?](#what-is-mono)
- [Architecture Diagram](#architecture-diagram)
- [Quick Start](#quick-start)
- [Documentation Map](#documentation-map)
- [Tech Stack](#tech-stack)
- [Key Concepts](#key-concepts)

---

## What Is Mono?

Mono is an enterprise-grade Nx monorepo that hosts a Next.js 15 frontend shell, a NestJS 11 API gateway, and a set of shared libraries organized by concern — kernel platform services, design-system UI, cross-cutting shared utilities, and pluggable domain modules. Every piece of the platform — types, components, API contracts, business logic — lives in one repository so that refactors are atomic, CI runs once, and no package versioning ceremony is required between teams.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (port 3000)                          │
│                      Next.js App Router (RSC)                        │
│                                                                      │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────────────┐   │
│  │  (login)     │   │  (modules)/    │   │  developer/api       │   │
│  │  layout      │   │  layout        │   │  (Swagger mirror)    │   │
│  └──────────────┘   └────────────────┘   └──────────────────────┘   │
│                              │                                       │
│              /api/* rewrite (next.config.ts)                         │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ HTTP (same origin in browser)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NestJS API Gateway (port 3001)                    │
│                                                                      │
│  JwtAuthGuard → ValidationPipe → Controller → Service → Repository  │
│                                                                      │
│  TransformInterceptor wraps every 2xx response:                      │
│  { data: T, success: true, message: "OK" }                          │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ Drizzle ORM
                               ▼
                    ┌──────────────────────┐
                    │  PostgreSQL 15        │
                    │  (optional — static   │
                    │   users work w/o DB)  │
                    └──────────────────────┘

Shared libraries consumed by both apps:
  libs/kernel/*    — auth, state, event-bus, config, router, telemetry
  libs/ui/*        — components, tokens, icons
  libs/shared/*    — types, utils, hooks, constants, testing
  libs/modules/*   — domain modules (analytics, …)
```

---

## Quick Start

Run these five commands from the repository root to go from a fresh clone to a running platform:

```bash
# 1. Install all workspace dependencies (uses pnpm workspaces + Nx 22)
pnpm install

# 2. Copy the environment template
cp .env.example .env

# 3. Start both the Next.js shell (port 3000) and NestJS gateway (port 3001)
npm run dev

# 4. Verify the API is healthy
curl http://localhost:3001/api/health

# 5. Open the browser — no database required for the default static users
open http://localhost:3000
```

> **Note:** The default credentials are `admin@mono.dev / admin123` and `user@mono.dev / user123`. They are hardcoded in `StaticUserRepository` so you can log in without a running PostgreSQL instance.

---

## Documentation Map

| Folder | Contents |
|---|---|
| [`01-getting-started/`](01-getting-started/) | Prerequisites, installation, and local dev workflow |
| [`01-getting-started/01-prerequisites.md`](01-getting-started/01-prerequisites.md) | Exact tool versions, nvm, Docker, VS Code extensions |
| [`01-getting-started/02-installation.md`](01-getting-started/02-installation.md) | Clone → install → env → first run |
| [`01-getting-started/03-running-locally.md`](01-getting-started/03-running-locally.md) | Dev commands, ports, credentials, DB scripts |
| [`02-architecture/`](02-architecture/) | System design decisions and data flows |
| [`02-architecture/01-overview.md`](02-architecture/01-overview.md) | Why monorepo, federation strategy, layout system, backend-first |
| [`02-architecture/02-monorepo-structure.md`](02-architecture/02-monorepo-structure.md) | Every folder, Nx tags, path alias table |
| [`02-architecture/03-data-flow.md`](02-architecture/03-data-flow.md) | End-to-end login trace (15 annotated steps) |

---

## Tech Stack

| Layer | Technology | Version | Role |
|---|---|---|---|
| Monorepo tooling | Nx | 22 | Task orchestration, caching, code-generation |
| Package manager | pnpm | 9+ | Workspace linking, install performance |
| Frontend framework | Next.js | 15 | App Router, RSC, typed routes |
| Backend framework | NestJS | 11 | Dependency injection, guards, interceptors |
| Language | TypeScript | 5 | Strict mode across all packages |
| Styling | Tailwind CSS | v3 | Utility-first CSS |
| Icons | lucide-react | latest | Consistent icon set |
| ORM | Drizzle ORM | latest | Type-safe SQL, schema-first |
| Database | PostgreSQL | 15+ | Primary data store |
| Client state | Zustand | 5 | Module-level stores |
| Event bus | mitt | latest | Cross-module publish/subscribe |
| API docs | Swagger / OpenAPI | 11.x | Auto-generated from NestJS decorators |

---

## Key Concepts

### Module

A **module** is a self-contained domain feature (e.g., `analytics`) that lives under `libs/modules/<name>/` and is structured into exactly four layers:

| Layer | Path | Responsibility |
|---|---|---|
| `feature` | `libs/modules/<name>/feature/` | Orchestration: pages, route logic, connecting data-access to UI |
| `ui` | `libs/modules/<name>/ui/` | Dumb presentational components specific to this module |
| `data-access` | `libs/modules/<name>/data-access/` | API calls, query hooks, module-level Zustand store |
| `utils` | `libs/modules/<name>/utils/` | Pure functions, formatters, validators — zero React |

A module must never import from another module's internals. Cross-module communication happens exclusively through the event bus (`@mono/kernel/event-bus`) or shared types (`@mono/shared/types`).

### Kernel

The **kernel** (`libs/kernel/`) is the set of platform-wide singleton services that every part of the shell can consume. It is the only place where global runtime concerns — authentication session, global Zustand store, config, routing, telemetry, and the event bus — are initialised and exported. Kernel libraries may only be imported by `apps/shell` and by module `feature` layers; they are never imported by `libs/shared` or `libs/ui`.

### Shell

The **shell** (`apps/shell/`) is the Next.js 15 application that owns the browser URL, the root layout, navigation chrome (topbar, side-nav), and the route groups that host each module's `feature` layer. The shell has no domain logic of its own; its job is to wire kernel services, render the correct module page for the current URL, and proxy `/api/*` requests to the gateway.

### Gateway

The **gateway** (`apps/api-gateway/`) is the NestJS 11 application that exposes the platform's REST API on port 3001 under the `/api` prefix. Every response is normalised to an `ApiResponse<T>` envelope by `TransformInterceptor`. Authentication is enforced globally by `JwtAuthGuard`; individual endpoints opt out with the `@Public()` decorator. The gateway reads its allowed CORS origin from `SHELL_URL` and its database connection from `DATABASE_URL`.
