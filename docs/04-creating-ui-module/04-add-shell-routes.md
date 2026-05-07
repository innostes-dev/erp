# Step 4 — Add Shell Routes

This step creates the Next.js App Router pages inside `apps/shell/src/app/(modules)/payments/`. Once the files exist, navigating to `/payments` in the browser will render your `PaymentsDashboard` component.

---

## How the route group works

The folder `(modules)` is a Next.js **route group** — the parentheses mean it does not appear in the URL. Every page file nested anywhere under `(modules)/` is automatically wrapped by `(modules)/layout.tsx`.

```
apps/shell/src/app/
├── layout.tsx               ← root layout: sets up KernelProviders (auth context, config, etc.)
│
└── (modules)/
    ├── layout.tsx           ← module layout: redirects to /login if unauthenticated; renders WorkspaceTopbar + ShellNav
    │
    ├── analytics/
    │   └── page.tsx         ← /analytics — already exists
    │
    └── payments/            ← YOU CREATE THIS
        ├── page.tsx         ← /payments
        ├── transactions/
        │   └── page.tsx     ← /payments/transactions
        └── settings/
            └── page.tsx     ← /payments/settings
```

---

## 1. Create the main payments page

### `apps/shell/src/app/(modules)/payments/page.tsx`

```tsx
import { PaymentsDashboard } from '@mono/modules/payments/feature';

export default function PaymentsPage() {
  return (
    <div className="p-8">
      <PaymentsDashboard />
    </div>
  );
}
```

That is all you need. There is no auth check in this file because `(modules)/layout.tsx` already handles it for every page in the group. There is no `'use client'` directive because the page itself is a React Server Component — `PaymentsDashboard` carries its own `'use client'` directive and becomes a client component boundary automatically.

---

## 2. Create the Transactions sub-page

### `apps/shell/src/app/(modules)/payments/transactions/page.tsx`

```tsx
export default function PaymentsTransactionsPage() {
  return (
    <div className="p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Full transaction history and detailed records.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">Transaction table coming soon.</p>
        </div>
      </div>
    </div>
  );
}
```

Replace the placeholder content with your real transactions table component once it is built.

---

## 3. Create the Settings sub-page

### `apps/shell/src/app/(modules)/payments/settings/page.tsx`

```tsx
export default function PaymentsSettingsPage() {
  return (
    <div className="p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure payment methods, currencies, and processing rules.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">Settings panel coming soon.</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. How `(modules)/layout.tsx` protects all pages

Open `apps/shell/src/app/(modules)/layout.tsx` to see what it does:

```tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@mono/kernel/auth/server';
import { WorkspaceTopbar } from '../../components/workspace-topbar';
import { ShellNav } from '../../components/shell-nav';

export default async function ModuleLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <WorkspaceTopbar />
      <div className="flex flex-1 overflow-hidden">
        <ShellNav />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

`getServerSession()` reads the `auth_token` cookie and verifies it against the API. If it returns `null`, Next.js redirects to `/login` before any module page code runs. Your page files never need to repeat this check.

`WorkspaceTopbar` and `ShellNav` are rendered once in the layout and shared across every page in the group. You do not include them in individual page files.

---

## 5. When you DO need `getServerSession()` in a page

Call `getServerSession()` directly in a page only when you need to **pass the authenticated user as a prop** to a component.

Common examples:

- Showing the user's name in a personalised greeting on the page
- Pre-filtering a list to records owned by the current user
- Passing the user's roles to a permission-aware component

**Example: passing the user to a component**

```tsx
// apps/shell/src/app/(modules)/payments/page.tsx
import { getServerSession } from '@mono/kernel/auth/server';
import { PaymentsDashboard } from '@mono/modules/payments/feature';

export default async function PaymentsPage() {
  // layout.tsx has already verified the session; this will never be null here.
  // We call it again only because we need the user object.
  const user = await getServerSession();

  return (
    <div className="p-8">
      <PaymentsDashboard userId={user!.id} />
    </div>
  );
}
```

Notes:
- `getServerSession()` is cached by Next.js's request deduplication within a single render pass, so calling it twice (once in the layout, once in the page) does **not** make two HTTP requests.
- You do not need to add a null-check or redirect in the page because the layout already redirected non-authenticated users. The `!` non-null assertion is safe here.
- If you do not need the user object, keep the page file as a plain synchronous function with no `getServerSession()` call (like the minimal example in step 1).

---

## 6. Verify the routes exist

Start the shell dev server and navigate to each URL:

```bash
pnpm nx serve shell
```

| URL | Expected result |
|---|---|
| `/payments` | `PaymentsDashboard` with four loading skeletons then stat cards |
| `/payments/transactions` | Heading "Transactions" with placeholder |
| `/payments/settings` | Heading "Payment Settings" with placeholder |

If you see a 404, check that the file is at exactly the right path. Next.js App Router is case-sensitive — `Payments/page.tsx` will not match `/payments`.

---

## Next steps

Continue with [05 — Register in the modules registry](./05-register-in-modules-registry.md).
