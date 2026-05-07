# Code Style

This project enforces TypeScript strict mode and a consistent code style across every package. The rules below are not optional — CI will fail for TypeScript errors, and code review will reject style violations.

---

## TypeScript

### Strict mode

`tsconfig.base.json` enables `"strict": true`. This activates:

- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `strictPropertyInitialization`
- `noImplicitReturns`

Every file in every package inherits these settings. Do not override them in a project-level `tsconfig.json`.

### Never use `any`

`any` disables the type checker. Use `unknown` instead and narrow the type before use.

```ts
// Wrong
function parse(input: any) {
  return input.value;
}

// Correct
function parse(input: unknown): string {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Expected object');
  }
  if (!('value' in input) || typeof (input as { value: unknown }).value !== 'string') {
    throw new Error('Expected string value');
  }
  return (input as { value: string }).value;
}
```

For third-party library types that do not ship declarations, use `@types/...` packages. If none exist, write a `.d.ts` declaration file in the consuming package.

### Prefer `unknown` for catch blocks

```ts
try {
  await fetchData();
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);
  }
}
```

### Return types on exported functions

Always annotate the return type of exported functions. It makes the public API explicit and prevents accidental type widening.

```ts
// Wrong
export function getUser(id: string) {
  return db.find(id);
}

// Correct
export function getUser(id: string): Promise<User | null> {
  return db.find(id);
}
```

---

## Comments

**Do not write comments that explain what the code does. Write code that explains itself.**

Write a comment only when the **why** is non-obvious — a workaround for a third-party bug, a business rule that would look like a mistake without context, or a performance optimization that makes the code harder to read.

```ts
// Wrong — the code already says this
// Check if user is authenticated
if (!user) return null;

// Wrong — obvious from context
// Loop through items
for (const item of items) { ... }

// Correct — explains a non-obvious decision
// next/image requires explicit width/height for remote URLs.
// Using unoptimized here because the image domain is not known at build time.
<Image unoptimized src={externalUrl} width={100} height={100} alt="" />

// Correct — business rule that looks like a bug
// Customers on legacy plans are identified by a missing `planId`.
// Do not replace this with `planId === undefined` — null is also used for grandfathered accounts.
if (customer.planId == null) { ... }
```

---

## Naming conventions

### Components

PascalCase. The file name must match the component name.

```
UserProfileCard.tsx     → export function UserProfileCard() {}
InvoiceDetailModal.tsx  → export function InvoiceDetailModal() {}
```

### Hooks

`use` prefix, PascalCase remainder.

```ts
useAuth()
useKernelStore()
useInvoiceList()
```

### Files

kebab-case for all source files.

```
user-profile-card.tsx
invoice-detail-modal.tsx
use-invoice-list.ts
auth.service.ts
billing.module.ts
```

### Constants

UPPER_SNAKE_CASE.

```ts
const MAX_RETRY_COUNT = 3;
const DEFAULT_PAGE_SIZE = 20;
const AUTH_COOKIE_NAME = 'session';
```

### Types and interfaces

PascalCase. No `I` prefix on interfaces.

```ts
// Wrong
interface IUserService { ... }
type TPayload = { ... };

// Correct
interface UserService { ... }
type Payload = { ... };
```

---

## File organization order

Within every source file, maintain this top-to-bottom order:

1. `'use client'` directive (if applicable — first line only)
2. Framework imports (`react`, `next/...`)
3. Third-party imports
4. Internal monorepo imports (`@mono/...`)
5. Relative imports (`./`, `../`)
6. Type-only imports (grouped with their origin section, using `import type`)
7. Constants
8. Types and interfaces (local to this file)
9. Helper functions (non-exported)
10. The main export (component, class, or function)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ChevronRight } from 'lucide-react';

import { useAuth } from '@mono/kernel/auth';
import { cn } from '@mono/kernel/ui';
import type { AuthUser } from '@mono/kernel/auth';

import { formatDate } from './utils';

const DEFAULT_LABEL = 'Continue';

interface Props {
  user: AuthUser;
  onComplete: () => void;
}

function buildRedirectUrl(path: string): string {
  return `/app${path}`;
}

export function OnboardingStep({ user, onComplete }: Props) {
  // ...
}
```

---

## Import order

Enforced by ESLint. The order is:

1. Framework (`react`, `next`, `@nestjs`)
2. Third-party (npm packages)
3. Monorepo internal (`@mono/...`)
4. Relative (`./`, `../`)

Group each tier with a blank line between groups.

---

## Named exports only (in libs)

Library packages must use named exports. Default exports make refactoring harder and break tree-shaking analysis in some bundlers.

```ts
// Wrong (in a lib)
export default function AuthProvider() { ... }

// Correct
export function AuthProvider() { ... }
```

Default exports are acceptable in Next.js page and layout files (`page.tsx`, `layout.tsx`) because the framework requires them.

---

## 'use client' directive

Place it on the very first line of the file, before any imports. Add it only when a component uses browser APIs, React state, effects, or event handlers.

```tsx
'use client';

import { useState } from 'react';
```

Do not add `'use client'` to:

- Server Components (the default in the App Router)
- Files that only export types or constants
- NestJS service, controller, or module files

The directive propagates downward. If a Client Component imports another component, that child component does not also need the directive.

---

## Error handling in NestJS

Never return error objects or raw strings from a controller. Throw a typed `HttpException` subclass. NestJS catches it and responds with the correct HTTP status.

```ts
// Wrong
return { error: 'User not found' };

// Wrong
throw new Error('User not found');

// Correct
import { NotFoundException } from '@nestjs/common';

throw new NotFoundException('User not found');
```

Use the appropriate exception class for the situation:

| Situation | Exception |
|---|---|
| Resource not found | `NotFoundException` (404) |
| Unauthenticated request | `UnauthorizedException` (401) |
| Insufficient permission | `ForbiddenException` (403) |
| Invalid request body | `BadRequestException` (400) |
| Unexpected server error | `InternalServerErrorException` (500) |

All of these are importable from `@nestjs/common`.
