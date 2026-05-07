# Kernel Libraries — Reference Guide

The kernel is the shared runtime that every module and the shell consume. It lives in `libs/kernel/` and is the only code that legitimately crosses module scope boundaries.

**Rule:** Kernel libs can only depend on `type:util` and `type:types`. They cannot import from each other or from any module.

---

## kernel/auth

### Server-side: `getServerSession()`

Use in Server Components and page files to check auth before rendering.

```ts
// apps/shell/src/app/(analytics)/analytics/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from '@mono/kernel/auth';

export default async function AnalyticsPage() {
  const user = await getServerSession();
  if (!user) redirect('/login');
  // user is typed as User — id, email, name, roles, permissions
}
```

`getServerSession()` reads the JWT from the cookie/`Authorization` header and calls `GET /auth/me` on the api-gateway. If the token is missing or expired it returns `null`.

### Client-side: `useAuth()`

```ts
'use client';
import { useAuth } from '@mono/kernel/auth';

function ProfileMenu() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div>
      <p>{user.name}</p>
      <button onClick={() => void logout()}>Sign out</button>
    </div>
  );
}
```

### RBAC: `hasPermission()`

```ts
import { hasPermission, hasRole } from '@mono/kernel/auth';

hasPermission(user, 'reports:export')   // → boolean
hasRole(user, 'admin')                  // → boolean
```

### HOC: `withAuth()`

Wraps a page component and redirects to `/login` if unauthenticated. Use when you prefer HOC over manual redirect.

```ts
import { withAuth } from '@mono/kernel/auth';

export default withAuth(function ReportingPage() {
  return <div>Protected</div>;
});
```

---

## kernel/state

### Global kernel store

Manages shell-level state that any component can read.

```ts
import { useKernelStore } from '@mono/kernel/state';

function Sidebar() {
  const { isSidebarOpen, toggleSidebar, theme, locale } = useKernelStore();
  return <aside style={{ width: isSidebarOpen ? 240 : 68 }}>…</aside>;
}
```

Available state: `isSidebarOpen`, `toggleSidebar()`, `theme` (`'light' | 'dark'`), `locale` (string), `setTheme()`, `setLocale()`.

### Module store factory: `createModuleStore()`

Every module that needs its own state should use this instead of calling `zustand.create()` directly. It adds devtools with a namespaced store name so you can see it in Redux DevTools.

```ts
// Inside libs/modules/reporting/feature/src/lib/reporting.store.ts
import { createModuleStore } from '@mono/kernel/state';

interface ReportingState {
  reports: Report[];
  isLoading: boolean;
  loadReports: () => Promise<void>;
}

export const useReportingStore = createModuleStore<ReportingState>(
  'reporting',                          // ← shows as "reporting" in DevTools
  (set) => ({
    reports: [],
    isLoading: false,
    loadReports: async () => {
      set({ isLoading: true });
      const data = await fetchReports();
      set({ reports: data, isLoading: false });
    },
  }),
);
```

---

## kernel/event-bus

### Firing an event

```ts
import { eventBus } from '@mono/kernel/event-bus';

// Type-safe: TS will error if payload doesn't match AppEventMap
eventBus.emit('notification:show', {
  message: 'Report exported successfully',
  type: 'success',
});
```

### Listening to an event (React hook)

```ts
'use client';
import { useEvent } from '@mono/kernel/event-bus';

function NotificationHost() {
  useEvent('notification:show', ({ message, type }) => {
    // show toast, update state, etc.
    console.log(type, message);
  });
  return null;
}
```

`useEvent` automatically removes the listener on unmount — no cleanup needed.

### Adding a new event

1. Open `libs/kernel/event-bus/src/lib/event-bus.types.ts`
2. Add your event to `AppEventMap`:

```ts
export interface AppEventMap {
  // existing events …
  'reporting:export-ready': { fileUrl: string; fileName: string };
}
```

TypeScript will immediately enforce the payload shape everywhere `emit` and `useEvent` are called for that event key.

---

## kernel/router

### Imperative navigation from non-React code

```ts
import { navigate } from '@mono/kernel/router';

// Usable from service classes, event handlers, setTimeout — anywhere
async function afterExport(url: string) {
  await sendEmail(url);
  navigate('/reporting');
}
```

The `RouterRegistrar` component (mounted in `KernelProviders`) calls `registerRouter(router)` once on the client so that `navigate()` has access to the Next.js router singleton.

### AppLink component

Drop-in replacement for `next/link` with optional telemetry tracking:

```tsx
import { AppLink } from '@mono/kernel/router';

<AppLink href="/analytics" track={{ event: 'nav_click', module: 'analytics' }}>
  Go to Analytics
</AppLink>
```

---

## kernel/config

### Reading a feature flag

```ts
'use client';
import { useFeatureFlag } from '@mono/kernel/config';

function ReportsTab() {
  const isV2 = useFeatureFlag('analytics-v2');
  return isV2 ? <ReportsV2 /> : <ReportsV1 />;
}
```

### Adding a new flag

1. Open `libs/kernel/config/src/lib/config.types.ts`
2. Add the flag name to `FeatureFlagMap`:

```ts
export interface FeatureFlagMap {
  'analytics-v2': boolean;
  'admin-dark-mode': boolean;
  'reporting-scheduled-exports': boolean;   // ← new flag
}
```

TypeScript will now autocomplete and type-check `useFeatureFlag('reporting-scheduled-exports')` everywhere.

---

## kernel/telemetry

### Initialising with a real adapter

By default telemetry is a no-op. Initialise it in `app/layout.tsx` or a provider:

```ts
import { initTelemetry } from '@mono/kernel/telemetry';

initTelemetry({
  captureError: (error, context) => Sentry.captureException(error, { extra: context }),
  captureEvent: (name, props) => analytics.track(name, props),
  capturePageView: (path) => analytics.page(path),
});
```

Once initialised, the HTTP client and `withPageTracking` HOC will call these automatically.
