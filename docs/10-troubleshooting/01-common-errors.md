# Common Errors

Exact fixes for the errors you are most likely to encounter. Each entry includes the exact error message, the cause, and the fix.

---

## 1. `EADDRINUSE: address already in use :::3001`

**What it means:** A previous dev server process did not exit cleanly and is still holding the port.

**Fix:**

```bash
lsof -ti:3000,3001 | xargs kill -9
```

This finds all processes on ports 3000 and 3001 and kills them immediately. Then restart your dev servers normally.

If you only need to free one port:

```bash
lsof -ti:3001 | xargs kill -9
```

---

## 2. `Cannot find module 'express'`

**What it means:** You imported a type from the `express` package (e.g., `Request`, `Response`) in a NestJS file, but `express` is not explicitly installed or its types are not available in that package's scope.

**Fix:** Do not import from `express` directly. Declare an inline interface instead.

```ts
// Wrong
import { Request } from 'express';

// Correct
interface RequestWithUser {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}
```

NestJS's `@Req()` decorator types its parameter as `any` by default. Use an inline interface to narrow it — you get the types you need without the import.

---

## 3. `server-only` error in a Client Component

**Full error:**

```
Error: This module cannot be imported from a Client Component module.
It should only be used from a Server Component.
```

**What it means:** You imported `getServerSession` (or another server-only export) in a file that is a Client Component (has `'use client'` or is imported by one).

**Fix:** Import from `@mono/kernel/auth` (the client-safe export) instead of `@mono/kernel/auth/server`.

```ts
// Wrong — in a Client Component
import { getServerSession } from '@mono/kernel/auth/server';

// Correct — use the client hook instead
import { useAuth } from '@mono/kernel/auth';
```

If you genuinely need session data on the server, move the code to a Server Component and pass the data down as props.

---

## 4. `Functions cannot be passed to Client Components as props`

**Full error:**

```
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
```

**What it means:** A Server Component is passing a callback function as a prop to a Client Component. Functions are not serializable — they cannot cross the server/client boundary in the React Server Components model.

**Fix:** Remove the function from the props. Instead, pass an identifier (an ID, a key, a string) and let the Client Component look up or construct the handler internally.

```tsx
// Wrong — passing a function across the boundary
<ClientCard onSelect={() => router.push(`/items/${id}`)} />

// Correct — pass the id, handle navigation inside the Client Component
<ClientCard itemId={id} />
```

Inside the Client Component:

```tsx
'use client';

import { useRouter } from 'next/navigation';

export function ClientCard({ itemId }: { itemId: string }) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(`/items/${itemId}`)}>
      View
    </button>
  );
}
```

---

## 5. `TypeError: Cannot read properties of undefined (reading 'auth_token')`

**What it means:** Code is trying to access `sessionStorage.auth_token` on the server, where `sessionStorage` does not exist. `sessionStorage` is a browser-only API.

**Fix:** Guard every `sessionStorage` access with a `typeof window` check.

```ts
// Wrong
const token = sessionStorage.getItem('auth_token');

// Correct
const token = typeof window !== 'undefined'
  ? sessionStorage.getItem('auth_token')
  : null;
```

If this is in a React component, move the read into a `useEffect` — effects only run in the browser.

```ts
useEffect(() => {
  const token = sessionStorage.getItem('auth_token');
  // use token
}, []);
```

---

## 6. `Module '"@mono/kernel/auth"' has no exported member 'X'`

**What it means:** You are importing something that is not exported from the package's `index.ts`, or the path alias in `tsconfig.base.json` does not point to the right file.

**Fix — step 1:** Check the package's `index.ts`.

```ts
// libs/kernel/auth/src/index.ts
export { AuthProvider } from './provider';
export { useAuth } from './use-auth';
// Is your export listed here?
```

If the export is missing, add it.

**Fix — step 2:** Check `tsconfig.base.json` to verify the path alias is correct.

```json
{
  "compilerOptions": {
    "paths": {
      "@mono/kernel/auth": ["libs/kernel/auth/src/index.ts"],
      "@mono/kernel/auth/server": ["libs/kernel/auth/src/server/index.ts"]
    }
  }
}
```

After editing `tsconfig.base.json`, restart your editor's TypeScript server (in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server").

---

## 7. Port 3000 shows NestJS output instead of Next.js

**What it means:** The `PORT` environment variable in your `.env` file is being picked up by the Next.js dev server, overriding its default port.

**Fix:** Remove `PORT` from `.env` entirely. Set it only in the NestJS project's `project.json` so it stays scoped to the API gateway.

```json
// apps/api-gateway/project.json
{
  "targets": {
    "dev": {
      "options": {
        "env": {
          "PORT": "3001"
        }
      }
    }
  }
}
```

Next.js defaults to port 3000 and does not need `PORT` set explicitly.

---

## 8. `class-validator` or `class-transformer` not found

**Full error:**

```
Error: Cannot find module 'class-validator'
```

**What it means:** These packages are peer dependencies of `@nestjs/common` for DTO validation. They are not installed by default.

**Fix:**

```bash
pnpm add -w class-validator class-transformer
```

The `-w` flag installs them to the workspace root so all packages in the monorepo can resolve them.

After installing, restart the NestJS dev server.

---

## 9. TypeScript `TS2307: Cannot find module '@mono/...'`

**Full error:**

```
TS2307: Cannot find module '@mono/kernel/ui' or its corresponding type declarations.
```

**What it means:** The path alias for `@mono/kernel/ui` is missing from `tsconfig.base.json`, or the consuming project's `tsconfig.json` does not extend `tsconfig.base.json`.

**Fix — step 1:** Add the alias to `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@mono/kernel/ui": ["libs/kernel/ui/src/index.ts"]
    }
  }
}
```

**Fix — step 2:** Ensure the consuming project extends the base config:

```json
// apps/shell/tsconfig.json
{
  "extends": "../../tsconfig.base.json"
}
```

**Fix — step 3:** Restart the TypeScript server in your editor.

---

## 10. `nx run-many` fails with "project X has no 'dev' target"

**Full error:**

```
NX  The following projects have no 'dev' target: my-new-lib
```

**What it means:** A new project was generated without a `dev` target in its `project.json`, or you ran `run-many --all` and it is picking up a lib that does not need a dev server.

**Fix — option A:** Add a `dev` target to the project's `project.json` if it needs one.

```json
// libs/my-lib/project.json
{
  "targets": {
    "dev": {
      "executor": "@nx/js:tsc",
      "options": {
        "watch": true
      }
    }
  }
}
```

**Fix — option B:** Scope `run-many` to only the projects that have a dev server:

```bash
pnpm nx run-many --target=dev --projects=shell,api-gateway
```

This is the recommended approach for local development — you rarely need to run a dev watcher on every lib simultaneously.
