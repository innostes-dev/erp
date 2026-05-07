# Project Structure — File by File

## Workspace root

```
mono/
├── package.json          Root dependencies (shared across all apps/libs)
├── pnpm-workspace.yaml   Tells pnpm: apps/*, libs/**, tools/* are workspace packages
├── tsconfig.base.json    Shared TS compiler options + ALL @mono/* path aliases
├── nx.json               Nx caching, target defaults, plugin config
├── eslint.config.mjs     ESLint v9 flat config with module boundary rules
├── prettier.config.mjs   Formatting rules
├── CODEOWNERS            Maps /libs/modules/<name>/ to a team
└── .npmrc                Registry = PayPal internal npm proxy (only for this folder)
```

---

## apps/shell — The Next.js host

```
apps/shell/
├── next.config.ts          transpilePackages lists every @mono/* lib used
├── tailwind.config.ts      Content paths + animation keyframes + safelist
├── postcss.config.mjs      Standard Tailwind v3 PostCSS plugin
├── tsconfig.json           Extends tsconfig.base.json, adds jsx settings
└── src/
    ├── styles/
    │   └── globals.css     @tailwind directives, scrollbar, ::selection
    │
    ├── app/                Next.js App Router pages
    │   ├── layout.tsx      ROOT layout — wraps everything in KernelProviders
    │   ├── page.tsx        Workspace launcher (auth-guarded, server component)
    │   ├── login/
    │   │   ├── layout.tsx  Bare layout (no nav, no sidebar)
    │   │   └── page.tsx    Split-panel login page (server component)
    │   └── (analytics)/    Route group — gives /analytics its own layout
    │       ├── layout.tsx  Shell sidebar layout for module pages
    │       └── analytics/
    │           └── page.tsx  Auth-guarded, renders <AnalyticsDashboard />
    │
    ├── components/
    │   ├── kernel-providers.tsx   Composes ConfigProvider + AuthProvider + RouterRegistrar
    │   ├── router-registrar.tsx   Client component that registers the Next.js router with kernel/router
    │   ├── login-form.tsx         Email/password form — calls useAuth().login()
    │   ├── workspace-topbar.tsx   Top nav: logo, search, bell, avatar dropdown
    │   ├── workspace-greeting.tsx Time-of-day greeting (client component)
    │   ├── module-card.tsx        Clickable card per module — hover animation + gradient icon
    │   └── shell-nav.tsx          Collapsible sidebar with module nav + user footer
    │
    └── lib/
        ├── cn.ts            clsx + twMerge helper: cn('a', condition && 'b')
        ├── modules.ts       MODULES registry — single source of truth for all module cards
        └── module-icons.tsx SVG icon components (BarChartIcon, SearchIcon, BellIcon …)
```

### How a page renders

1. `app/layout.tsx` — server component, calls `getServerSession()`, passes user to `<KernelProviders>`
2. `KernelProviders` — `ConfigProvider` → `AuthProvider` → `RouterRegistrar` — all client components
3. Page file (e.g. `analytics/page.tsx`) — server component, re-checks auth, imports feature component
4. Feature component (e.g. `<AnalyticsDashboard />`) — client component, fetches data, renders UI

---

## apps/api-gateway — The NestJS BFF

```
apps/api-gateway/
├── tsconfig.json
├── project.json          tags: type:app, scope:infra, platform:server
└── src/
    ├── main.ts           NestFactory bootstrap, ValidationPipe, CORS
    ├── app.module.ts     Root module — imports AuthModule
    └── auth/
        ├── auth.module.ts
        └── auth.controller.ts   POST /auth/login, GET /auth/me, POST /auth/logout
```

The auth controller is mocked. Wire it to a real user store (database, LDAP, SSO) for production.

---

## libs/kernel — Shared runtime

Each kernel lib is an independent Nx project. They can only depend on `type:util` and `type:types` — never on each other or on module code.

### kernel/auth

```
src/lib/
├── auth.types.ts       User, AuthState, AuthActions, LoginCredentials interfaces
├── auth.context.ts     React context object
├── auth.provider.tsx   useReducer-based provider, stores JWT in sessionStorage
├── use-auth.ts         useContext hook — returns { user, login, logout, isAuthenticated }
├── server-session.ts   Server-only: reads cookie/header, fetches /auth/me
├── with-auth.tsx       HOC that redirects to /login if not authenticated
└── has-permission.ts   hasPermission(user, 'permission:name') — RBAC helper
```

### kernel/state

```
src/lib/
├── kernel.store.ts         Global Zustand store: theme, locale, isSidebarOpen
├── create-module-store.ts  Factory: createModuleStore('name', initializer) → Zustand store
└── state.types.ts          KernelState interface
```

Use `createModuleStore` in your module — it wraps Zustand with devtools automatically:

```ts
// Inside your module's feature or data-access lib
const useMyStore = createModuleStore('my-module', (set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}));
```

### kernel/event-bus

```
src/lib/
├── event-bus.types.ts   AppEventMap — all typed cross-module events
├── event-bus.ts         Singleton mitt bus: emit(), on(), off()
└── use-event.ts         React hook: useEvent('notification:show', handler)
```

Adding a new cross-module event:

```ts
// event-bus.types.ts
export interface AppEventMap {
  'auth:login': { userId: string };
  'notification:show': { message: string; type: 'success' | 'error' | 'info' | 'warning' };
  'reporting:export-ready': { fileUrl: string };  // ← add here
}
```

### kernel/router

```
src/lib/
├── navigate.ts       registerRouter(router) + navigate(path) — imperative nav from non-React code
├── app-link.tsx      <AppLink href="/analytics"> — wraps next/link with optional tracking
└── use-app-router.ts Hook that returns the registered router instance
```

### kernel/config

```
src/lib/
├── config.types.ts    FeatureFlagMap (all flag names typed), AppConfig
├── config.provider.tsx Provides config to the React tree
├── config.context.ts   Config context object
├── get-config.ts       Server-side config reader
└── use-feature-flag.ts useFeatureFlag('analytics-v2') → boolean
```

### kernel/telemetry

```
src/lib/
├── telemetry.types.ts    TelemetryAdapter interface
├── telemetry.ts          initTelemetry(adapter) — plug in Datadog/Segment/custom
└── with-page-tracking.tsx HOC that fires a page-view event on mount
```

---

## libs/modules/analytics — Example module

```
libs/modules/analytics/
├── utils/src/lib/analytics.utils.ts    formatMetric(), calcChange() — pure functions
├── data-access/src/lib/analytics.api.ts  fetchAnalyticsSummary() — API calls, types
├── ui/src/lib/metric-card.tsx          MetricCard component — presentational only
└── feature/src/lib/analytics-dashboard.tsx  AnalyticsDashboard — orchestrates data + UI
```

Import hierarchy (enforced by ESLint):
```
feature  imports  data-access + ui + utils + kernel
ui       imports  utils only
data-access  imports  utils + kernel
utils    imports  nothing (pure)
```

---

## libs/shared

```
shared/types/src/index.ts       PaginatedResponse, ApiResponse, ApiError, BaseEntity
shared/utils/src/index.ts       formatDate, formatCurrency, slugify, debounce, groupBy …
shared/hooks/src/               useDebounce, useLocalStorage, useMediaQuery, useOnClickOutside
shared/constants/src/index.ts   ROUTES, HTTP_STATUS, DEFAULT_PAGE_SIZE
shared/testing/src/             renderWithProviders, createMockUser, MSW server
```

---

## libs/ui

```
ui/components/src/lib/
├── button.tsx          <Button variant="primary|ghost|danger" size="sm|md|lg">
├── badge.tsx           <Badge variant="default|success|warning|error">
├── spinner.tsx         <Spinner size="sm|md|lg">
├── error-boundary.tsx  <ErrorBoundary fallback={<p>Error</p>}>
└── empty-state.tsx     <EmptyState title="…" description="…" action={<Button>}>

ui/tokens/src/index.ts  Design token object (colors, spacing, radii …)
ui/icons/src/lib/       ChevronRight, Close, Menu, User SVG components
```

---

## libs/data-access/http

```
src/lib/http-client.ts
```

Axios instance pre-configured with:
- `Authorization: Bearer <token>` injected from sessionStorage on every request
- Response interceptor: 401 → fires `auth:logout` event
- Error interceptor: captures to telemetry adapter
