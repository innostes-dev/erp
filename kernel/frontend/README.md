# @innostes/kernel (frontend)

The kernel's frontend plug-in. It is rendered by the UI engine (`apps/web-app`), just as `kernel/backend` is loaded by `apps/api-server`.

```
src/
├── core/api/client.ts   # configureApi, apiRequest, ApiError
├── setup/               # first-run setup: SetupGate, SetupWizard, api, types
└── index.ts             # public exports
```

It is a source-only workspace package with no build step. Vite compiles it as part of web-app.

## Usage (in web-app)

```tsx
import { configureApi, SetupGate } from '@innostes/kernel';

configureApi({ baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8001' });

<SetupGate>
  <App />
</SetupGate>;
```

`SetupGate` asks `GET /setup/status`. On a fresh install it lazy-loads the setup wizard (a separate bundle) at `/setup`. The wizard first asks for the one-time setup token printed in the API server log, and sends it as `X-Setup-Token`. Once setup is done, the gate renders the app and `/setup` redirects to `/`. The API's setup actions then return 404.

API errors are `ApiError`s with `status`, `code` (e.g. `setup_required`) and `retryAfter`. Compare them against `HttpStatus` and `SetupErrorCode`, never against raw numbers or strings.

The wizard uses Tailwind utility classes, so the app's Tailwind config must scan this package: `@source '../../../kernel/frontend/src'` in web-app's `styles.css`.

## Commands

```sh
pnpm nx typecheck kernel-frontend
```
