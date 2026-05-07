# Adding a New Module

A module is a self-contained product area (e.g. Payments, Orders, Catalog). Adding one requires changes in three places: the libs, the shell routing, and the module registry. Nothing else.

---

## Step 1 — Create the lib

```
libs/modules/
└── payments/
    ├── feature/src/
    │   ├── index.ts              ← exports PaymentsDashboard component
    │   └── lib/
    │       └── payments-dashboard.tsx
    ├── ui/src/index.ts           ← shared UI components
    ├── data-access/src/index.ts  ← API fetch hooks
    └── utils/src/index.ts        ← pure utilities
```

Each lib has its own `project.json` and `tsconfig.json`. Follow the pattern in `libs/modules/analytics/`.

The feature entry point:
```typescript
// libs/modules/payments/feature/src/index.ts
export { PaymentsDashboard } from './lib/payments-dashboard';
```

Add the path alias to `tsconfig.base.json`:
```json
"@mono/modules/payments/feature": ["libs/modules/payments/feature/src/index.ts"]
```

---

## Step 2 — Add shell routes

Create a folder under `apps/shell/src/app/(modules)/`:

```
apps/shell/src/app/(modules)/
└── payments/
    ├── page.tsx                  ← main dashboard
    ├── transactions/
    │   └── page.tsx              ← sub-page
    └── settings/
        └── page.tsx
```

Every page under `(modules)/` is automatically:
- **Auth-protected** — `(modules)/layout.tsx` redirects to `/login` if no session
- **Wrapped** in the shell layout (WorkspaceTopbar + ShellNav)

A minimal page:
```typescript
// apps/shell/src/app/(modules)/payments/page.tsx
import { PaymentsDashboard } from '@mono/modules/payments/feature';

export default function PaymentsPage() {
  return (
    <div className="p-8">
      <PaymentsDashboard />
    </div>
  );
}
```

---

## Step 3 — Register in the module registry

Open `apps/shell/src/lib/modules.ts` and add to `MODULES`:

```typescript
{
  id: 'payments',
  name: 'Payments',
  description: 'Transaction processing, refunds, and payment method management.',
  route: '/payments',
  gradient: 'from-green-500 to-emerald-600',
  iconColor: 'text-green-100',
  borderColor: 'hover:border-green-300',
  navItems: [
    { id: 'dashboard', label: 'Dashboard',    route: '/payments',              iconId: 'home' },
    { id: 'transactions', label: 'Transactions', route: '/payments/transactions', iconId: 'document' },
    { id: 'settings',  label: 'Settings',    route: '/payments/settings',     iconId: 'cog' },
  ],
},
```

Add the module icon to `apps/shell/src/lib/module-icons.tsx`:

```typescript
import { CreditCard } from 'lucide-react';

export const MODULE_ICONS: Record<string, IconComponent> = {
  analytics: BarChart2,
  payments:  CreditCard,   // ← add this
};
```

---

## That's it

The module now appears in:
- The workspace selector page (card grid)
- The app-switcher dropdown (⊞ waffle icon in header)
- The sidebar when navigating to `/payments/*`

No changes needed to layouts, guards, or any other shared files.

---

## File checklist

| File | Action |
|---|---|
| `libs/modules/payments/feature/src/index.ts` | Create — export main component |
| `tsconfig.base.json` | Add path alias |
| `apps/shell/src/app/(modules)/payments/page.tsx` | Create — render feature component |
| `apps/shell/src/lib/modules.ts` | Add entry to `MODULES` array |
| `apps/shell/src/lib/module-icons.tsx` | Add icon to `MODULE_ICONS` map |
