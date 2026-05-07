# Module Boundaries & Layer Architecture

Boundaries are enforced at **lint time** by `@nx/enforce-module-boundaries` in `eslint.config.mjs`. A violation is a lint error — CI will catch it before it reaches main.

---

## The four layers

Every domain module is split into four libraries with a strict dependency direction:

```
┌─────────────────────────────────────────────────────────┐
│  app (shell)                                            │
│  Can depend on: feature, ui, data-access, util, kernel  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  feature                                                │
│  Orchestrates UI + data + state. The "page container".  │
│  Can depend on: ui, data-access, util, kernel           │
└──────┬──────────────────────────┬───────────────────────┘
       │                          │
┌──────▼──────┐          ┌────────▼────────────────────────┐
│  ui         │          │  data-access                    │
│  Pure       │          │  API calls, types, Zustand store │
│  components │          │  Can depend on: util, types,     │
│  No kernel  │          │  kernel                         │
│  No fetch   │          └────────────────────────────────┬┘
└──────┬──────┘                                           │
       │                                                  │
       └──────────────────────┬───────────────────────────┘
                              │
                    ┌─────────▼──────────────────┐
                    │  utils                     │
                    │  Pure functions only        │
                    │  No React, no side effects  │
                    │  No dependencies           │
                    └────────────────────────────┘
```

### Why ui cannot import data-access

UI components should be dumb — they receive data through props and render it. If `ui` could import `data-access`, components would become coupled to a specific API shape and couldn't be reused or tested in isolation.

### Why utils has no dependencies

Utils are pure functions (formatters, transformers, validators). If they could import anything with side effects, they'd become impossible to test or reuse safely.

---

## The three boundary axes

### 1. Type (layer) isolation

```
type:app       → can use feature, ui, data-access, util, types, kernel, testing
type:kernel    → can use util, types only
type:feature   → can use ui, data-access, util, types, kernel
type:ui        → can use ui, util, types
type:data-access → can use util, types, kernel
type:util      → can use util, types
type:types     → no dependencies allowed
```

### 2. Platform isolation

```
platform:web    → CANNOT import platform:server
platform:server → CANNOT import platform:web
```

This prevents accidental use of browser APIs in server code and vice versa. The `server-only` package in `kernel/auth/server-session.ts` is the runtime enforcement; the tag rule is the lint-time enforcement.

### 3. Scope (horizontal) isolation

Each domain module has a `scope:<name>` tag. Modules cannot import from each other:

```
scope:analytics   → cannot import scope:reporting
scope:reporting   → cannot import scope:analytics
```

Cross-module communication must go through the kernel event bus:

```ts
// ✅ Correct — fire an event, let the consumer handle it
eventBus.emit('reporting:export-ready', { fileUrl });

// ❌ Wrong — direct import from another module's scope
import { useReportingStore } from '@mono/modules/reporting/feature';
```

---

## Reading a lint error

When you break a boundary:

```
error  A project tagged with "type:ui" can only depend on libs tagged
       with ["type:ui","type:util","type:types"].
       Dependency rule violated: @mono/modules/reporting/ui imports
       from @mono/modules/reporting/data-access
```

**Fix:** Move the data fetching to `feature` layer and pass the data down as props to the `ui` component.

---

## Allowed dependency matrix

| From ↓ / To → | app | kernel | feature | ui | data-access | util | types | testing |
|---|---|---|---|---|---|---|---|---|
| **app** | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **kernel** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **feature** | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **ui** | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **data-access** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **util** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **types** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Nx project tags reference

Every `project.json` has a `tags` array. Nx uses these for boundary enforcement.

```json
{
  "tags": ["type:feature", "scope:analytics", "platform:web"]
}
```

| Tag prefix | Possible values |
|---|---|
| `type:` | `app`, `kernel`, `feature`, `ui`, `data-access`, `util`, `types`, `testing` |
| `scope:` | `shell`, `infra`, `analytics`, `reporting`, … (one per domain) |
| `platform:` | `web`, `server`, `isomorphic` |

When adding a new module, always tag each layer correctly or the boundary rules will not protect you.
