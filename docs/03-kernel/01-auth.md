# Auth Kernel

The auth kernel (`@mono/kernel/auth`) provides session management for the entire platform. It handles login, logout, token refresh, and session reads — both on the client and on the server.

---

## Package split

| Import path | Environment | Purpose |
|---|---|---|
| `@mono/kernel/auth` | Client + Server | `AuthProvider`, `useAuth()` |
| `@mono/kernel/auth/server` | Server only | `getServerSession()` |

The split exists because `getServerSession()` reads HTTP-only cookies using Next.js server APIs (`cookies()`). Those APIs do not exist in the browser. Importing the server module in a Client Component will throw a `server-only` error at build time — that is intentional.

---

## AuthProvider

`AuthProvider` wraps the entire application (in `apps/shell/src/app/layout.tsx`). It must be the outermost Client Component.

**What it does:**

1. On mount, reads `sessionStorage` for an existing token.
2. If a token is found, calls `GET /api/auth/me` to validate it and populate the user object.
3. Exposes session state to every child component via React context.
4. Sets `isLoading = true` during the initial validation and `false` once complete.

**Usage (already in place, do not duplicate):**

```tsx
// apps/shell/src/app/layout.tsx
import { AuthProvider } from '@mono/kernel/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

---

## useAuth()

`useAuth()` is the primary hook for reading and mutating session state inside Client Components.

### Type signature

```ts
interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

function useAuth(): AuthContextValue;
```

### Fields

| Field | Type | Description |
|---|---|---|
| `user` | `AuthUser \| null` | The authenticated user, or `null` when logged out |
| `token` | `string \| null` | The current JWT access token |
| `isAuthenticated` | `boolean` | `true` when `user !== null && token !== null` |
| `isLoading` | `boolean` | `true` during the initial session check on mount |
| `login` | `function` | Authenticate with email + password |
| `logout` | `function` | Destroy the session everywhere |
| `refreshToken` | `function` | Rotate the access token |

### Basic usage

```tsx
'use client';

import { useAuth } from '@mono/kernel/auth';

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <span>{user!.name}</span>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}
```

---

## login()

```ts
login(email: string, password: string): Promise<void>
```

**Step-by-step sequence:**

1. Sends `POST /api/auth/login` with `{ email, password }` in the request body.
2. The server validates credentials and responds with `{ accessToken, user }`.
3. `AuthProvider` stores the `accessToken` in `sessionStorage` under the key `auth_token`.
4. The server sets an HTTP-only cookie (`session`) containing the token — this is how Server Components read the session.
5. `AuthProvider` updates `user` and `token` in React state.
6. `isAuthenticated` becomes `true`.

**Usage:**

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@mono/kernel/auth';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    try {
      await login(
        form.get('email') as string,
        form.get('password') as string,
      );
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {error && <p>{error}</p>}
      <button type="submit">Sign in</button>
    </form>
  );
}
```

---

## logout()

```ts
logout(): Promise<void>
```

**Step-by-step sequence:**

1. Sends `POST /api/auth/logout` to the server.
2. The server clears the HTTP-only `session` cookie.
3. `AuthProvider` removes `auth_token` from `sessionStorage`.
4. `AuthProvider` sets `user = null` and `token = null` in React state.
5. `isAuthenticated` becomes `false`.

**Usage:**

```tsx
'use client';

import { useAuth } from '@mono/kernel/auth';

export function SignOutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Sign out
    </button>
  );
}
```

---

## refreshToken()

```ts
refreshToken(): Promise<void>
```

**What it does:**

1. Sends `POST /api/auth/refresh` with the current session cookie (sent automatically by the browser).
2. The server validates the existing token and issues a new one.
3. `AuthProvider` replaces the token in `sessionStorage` and in React state.

**When to call it:** You rarely call this manually. The API client layer calls it automatically when a `401` response is received. Call it explicitly only if you need to force a token rotation.

```tsx
'use client';

import { useAuth } from '@mono/kernel/auth';

export function TokenRefreshButton() {
  const { refreshToken } = useAuth();

  return (
    <button onClick={refreshToken}>
      Refresh session
    </button>
  );
}
```

---

## getServerSession()

```ts
// Import ONLY from @mono/kernel/auth/server
import { getServerSession } from '@mono/kernel/auth/server';

async function getServerSession(): Promise<AuthUser | null>
```

**What it does:**

1. Calls `cookies()` from `next/headers` to read the HTTP-only `session` cookie.
2. If the cookie is absent, returns `null` immediately.
3. Sends `GET /api/auth/me` with the cookie value as a Bearer token.
4. Returns the `AuthUser` object on success, or `null` if the token is expired or invalid.

> **Note:** `getServerSession()` only works in Server Components, Server Actions, and Route Handlers. It will throw at build time if called from a Client Component.

---

## Protecting a page (Server Component pattern)

Use `getServerSession()` in Server Components to redirect unauthenticated users before any client-side code runs.

```tsx
// apps/shell/src/app/(modules)/settings/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from '@mono/kernel/auth/server';

export default async function SettingsPage() {
  const user = await getServerSession();

  if (!user) {
    redirect('/login');
  }

  return <SettingsShell user={user} />;
}
```

The redirect happens on the server. The browser never receives any page content — it receives a `307` immediately.

---

## Protecting a component (client-side pattern)

Use `useAuth()` when you need to conditionally render UI based on auth state inside a Client Component.

```tsx
'use client';

import { useAuth } from '@mono/kernel/auth';

export function AdminPanel() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!user?.roles.includes('admin')) {
    return <p>Access denied.</p>;
  }

  return <div>Admin content here</div>;
}
```

Always handle `isLoading` before checking `isAuthenticated`. During the first render, `isLoading` is `true` and `isAuthenticated` is `false` — rendering "not authenticated" state during that window would cause a flash.

---

## Choosing the right guard

| Scenario | Use |
|---|---|
| Protect an entire page before render | `getServerSession()` + `redirect()` in a Server Component |
| Hide/show UI based on auth state | `useAuth()` in a Client Component |
| Role-based UI branching | `useAuth()`, check `user.roles` |
| Server Action that requires auth | `getServerSession()` at the top of the action |

---

## Common mistakes

**Wrong — importing server module in a Client Component:**

```tsx
'use client';
// This will throw: server-only module imported in client context
import { getServerSession } from '@mono/kernel/auth/server';
```

**Correct — use `useAuth()` on the client:**

```tsx
'use client';
import { useAuth } from '@mono/kernel/auth';
```

**Wrong — reading `sessionStorage` without a browser check:**

```ts
const token = sessionStorage.getItem('auth_token'); // throws on the server
```

**Correct:**

```ts
const token = typeof window !== 'undefined'
  ? sessionStorage.getItem('auth_token')
  : null;
```
