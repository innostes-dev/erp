# Creating a UI Module — Overview

This guide walks you through adding a fully wired UI module to the Mono platform. By the end of the series you will have:

- A four-layer library tree under `libs/modules/<name>/`
- A Next.js App Router page auto-protected by the shared auth layout
- The module appearing in the workspace home grid, the top-bar app-switcher dropdown, and the collapsible sidebar — with no extra code in any of those components

The example throughout this series is a **Payments** module.

---

## What is a UI module?

A UI module is a self-contained feature slice that appears as a card on the workspace home screen and has its own route tree inside `apps/shell`. Every module follows the same four-layer library structure. The shell is deliberately thin — it registers modules in a central registry and renders them; it contains no module-specific business logic.

---

## The four-layer library structure

Each module lives under `libs/modules/<module-id>/` and is split into exactly four sub-libraries:

| Sub-library | Path | Purpose |
|---|---|---|
| `feature` | `libs/modules/<id>/feature/src/` | The main dashboard component and any page-level compositions. This is the only layer the shell page imports. |
| `ui` | `libs/modules/<id>/ui/src/` | Dumb, reusable presentational components (cards, tables, charts) used only within this module. |
| `data-access` | `libs/modules/<id>/data-access/src/` | API call functions, TypeScript types that model the API response, and custom React hooks. |
| `utils` | `libs/modules/<id>/utils/src/` | Pure functions with no side effects and no React — formatters, calculators, validators. |

Each sub-library has its own `project.json` (telling Nx it exists), its own `tsconfig.json` (extending the root `tsconfig.base.json`), and a single public entry-point `src/index.ts`.

The path aliases in `tsconfig.base.json` make every sub-library importable by a short name:

```
@mono/modules/payments/feature
@mono/modules/payments/ui
@mono/modules/payments/data-access
@mono/modules/payments/utils
```

---

## How the module connects to the shell

```
tsconfig.base.json
  └── "paths" aliases
        └── @mono/modules/payments/feature
              → libs/modules/payments/feature/src/index.ts

apps/shell/src/lib/modules.ts   (MODULES registry)
  └── { id: 'payments', route: '/payments', ... }

apps/shell/src/lib/module-icons.tsx   (MODULE_ICONS record)
  └── { payments: CreditCard }

apps/shell/src/app/(modules)/payments/page.tsx
  └── imports PaymentsDashboard from @mono/modules/payments/feature
```

The three shell consumers — `WorkspaceTopbar` (app-switcher dropdown), `ShellNav` (sidebar), and the workspace home grid (`page.tsx`) — all read from `MODULES`. Adding one entry to `MODULES` and one key to `MODULE_ICONS` is enough to make the module appear in all three places simultaneously.

---

## Data-flow diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│                                                             │
│  apps/shell/src/app/(modules)/payments/page.tsx             │
│  └─ <PaymentsDashboard />   (from @mono/modules/payments/   │
│                               feature)                      │
│       │                                                     │
│       │  calls on mount                                     │
│       ▼                                                     │
│  libs/modules/payments/data-access/src/lib/payments.api.ts  │
│  └─ fetchPaymentsSummary()                                  │
│       │                                                     │
│       │  uses                                               │
│       ▼                                                     │
│  libs/data-access/http/src/lib/http-client.ts               │
│  └─ get('/api/payments/summary')                            │
│       │  Authorization: Bearer <token>   (auto-attached)    │
│       │                                                     │
│       │  HTTP                                               │
│       ▼                                                     │
│  API Gateway  (NestJS, separate app)                        │
│  └─ GET /api/payments/summary                               │
│       │                                                     │
│       │  ApiResponse<PaymentsSummary> JSON                  │
│       ▼                                                     │
│  fetchPaymentsSummary() resolves → setSummary(res.data)     │
│       │                                                     │
│       ▼                                                     │
│  <PaymentsDashboard /> re-renders with real data            │
│  └─ passes metrics to <StatCard /> (from ui sub-lib)        │
│       └─ formats values via formatCurrency() (utils sub-lib)│
└─────────────────────────────────────────────────────────────┘
```

---

## Files you will create

| File | Action |
|---|---|
| `libs/modules/payments/feature/tsconfig.json` | New |
| `libs/modules/payments/feature/tsconfig.lib.json` | New |
| `libs/modules/payments/feature/project.json` | New |
| `libs/modules/payments/feature/src/index.ts` | New |
| `libs/modules/payments/feature/src/lib/payments-dashboard.tsx` | New |
| `libs/modules/payments/ui/tsconfig.json` | New |
| `libs/modules/payments/ui/tsconfig.lib.json` | New |
| `libs/modules/payments/ui/project.json` | New |
| `libs/modules/payments/ui/src/index.ts` | New |
| `libs/modules/payments/data-access/tsconfig.json` | New |
| `libs/modules/payments/data-access/tsconfig.lib.json` | New |
| `libs/modules/payments/data-access/project.json` | New |
| `libs/modules/payments/data-access/src/index.ts` | New |
| `libs/modules/payments/data-access/src/lib/payments.api.ts` | New |
| `libs/modules/payments/utils/tsconfig.json` | New |
| `libs/modules/payments/utils/tsconfig.lib.json` | New |
| `libs/modules/payments/utils/project.json` | New |
| `libs/modules/payments/utils/src/index.ts` | New |
| `apps/shell/src/app/(modules)/payments/page.tsx` | New |
| `apps/shell/src/app/(modules)/payments/transactions/page.tsx` | New |
| `apps/shell/src/app/(modules)/payments/settings/page.tsx` | New |

## Files you will modify

| File | Change |
|---|---|
| `tsconfig.base.json` | Add 4 path aliases under `"paths"` |
| `apps/shell/src/lib/modules.ts` | Add one entry to the `MODULES` array |
| `apps/shell/src/lib/module-icons.tsx` | Add one key to `MODULE_ICONS` |

---

## Next steps

Continue with [02 — Create the libs](./02-create-the-libs.md).
