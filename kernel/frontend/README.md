# Innostes Business OS: Platform Kernel (Frontend)

The frontend kernel package (`@innostes/kernel`) delivers foundational client infrastructure, first-run initialization gates, and typed API communication for the **Innostes Business Operating System (Business OS)**.

It is loaded dynamically by the UI engine (`apps/web-app`), mirroring how `kernel/backend` is loaded by `apps/api-server`.

---

## 1. Directory Structure

```
kernel/frontend/
├── src/
│   ├── core/
│   │   └── api/
│   │       └── client.ts    # configureApi, apiRequest, ApiError, HttpStatus
│   ├── setup/               # First-run setup: SetupGate, SetupWizard, types
│   └── index.ts             # Public package exports
├── package.json
└── tsconfig.json
```

`@innostes/kernel` is a source-only monorepo package compiled on the fly by Vite within `apps/web-app`.

---

## 2. Key Components & Usage

### 1. API Client Configuration

Configure the centralized API client in your application root:

```tsx
import { configureApi } from '@innostes/kernel';

configureApi({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8001',
});
```

### 2. First-Run Setup Gate (`<SetupGate>`)

Wrap your main application with `<SetupGate>` to guard access until the platform instance is initialized:

```tsx
import { SetupGate } from '@innostes/kernel';

export function RootApp() {
  return (
    <SetupGate>
      <AppRouter />
    </SetupGate>
  );
}
```

#### How the Setup Gate Works:
1. Calls `GET /setup/status` on application load.
2. If setup is uncompleted (`is_configured: false`), it lazy-loads the setup wizard at `/setup`.
3. The wizard prompts the administrator for the one-time **Setup Token** printed in the API server logs and sends it via the `X-Setup-Token` header.
4. Once initial tenant credentials and organization name are configured, the gate redirects to `/` and the backend locks `/setup` actions (subsequent calls return 404).

### 3. Strongly-Typed Error Handling

All failed API requests reject with `ApiError`:

```ts
import { ApiError, HttpStatus } from '@innostes/kernel';

try {
  await apiRequest('/salesflow/deals');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === HttpStatus.UNAUTHORIZED) {
      // Redirect to login or session refresh
    }
  }
}
```

---

## 3. Commands

```bash
# Type-check TypeScript sources
pnpm nx typecheck kernel-frontend
```

---

## 4. License

Open-source software licensed under the **[MIT License](../../LICENSE)**.
