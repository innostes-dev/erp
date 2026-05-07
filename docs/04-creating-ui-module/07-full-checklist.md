# Step 7 — Full Checklist and Troubleshooting

Use this as a final verification pass after completing the previous steps. Every file is listed with exactly what it must contain or what change it must include.

---

## Files to create

Work through this list in order. Earlier items are imported by later ones.

### Utils sub-library

- [ ] `libs/modules/payments/utils/project.json`
  - `"name": "modules-payments-utils"`
  - `"sourceRoot": "libs/modules/payments/utils/src"`
  - `"tags": ["type:util", "scope:payments", "platform:web"]`

- [ ] `libs/modules/payments/utils/tsconfig.json`
  - `"extends": "../../../../tsconfig.base.json"`
  - `"compilerOptions": { "jsx": "react-jsx", "strict": true }`
  - `"references": [{ "path": "./tsconfig.lib.json" }]`

- [ ] `libs/modules/payments/utils/tsconfig.lib.json`
  - `"extends": "./tsconfig.json"`
  - `"include": ["src/**/*.ts", "src/**/*.tsx"]`

- [ ] `libs/modules/payments/utils/src/index.ts`
  - Exports `formatCurrency`, `calcPercentChange`, `formatCount`

- [ ] `libs/modules/payments/utils/src/lib/payments.utils.ts`
  - Implements `formatCurrency`, `calcPercentChange`, `formatCount`

### Data-access sub-library

- [ ] `libs/modules/payments/data-access/project.json`
  - `"name": "modules-payments-data-access"`
  - `"sourceRoot": "libs/modules/payments/data-access/src"`
  - `"tags": ["type:data-access", "scope:payments", "platform:web"]`

- [ ] `libs/modules/payments/data-access/tsconfig.json`
  - Same structure as `utils/tsconfig.json`

- [ ] `libs/modules/payments/data-access/tsconfig.lib.json`
  - Same structure as `utils/tsconfig.lib.json`

- [ ] `libs/modules/payments/data-access/src/lib/payments.api.ts`
  - Exports `fetchPaymentsSummary`, `fetchTransactions`
  - Exports types `PaymentMetric`, `PaymentsSummary`, `Transaction`
  - `fetchPaymentsSummary` calls `get('/api/payments/summary')` from `@mono/data-access/http`

- [ ] `libs/modules/payments/data-access/src/lib/use-payments.ts`
  - `'use client'` directive at top
  - Exports `usePayments` hook returning `{ summary, loading, error, refetch }`

- [ ] `libs/modules/payments/data-access/src/index.ts`
  - Exports everything from `./lib/payments.api`
  - Exports `usePayments` and `UsePaymentsResult` from `./lib/use-payments`

### UI sub-library

- [ ] `libs/modules/payments/ui/project.json`
  - `"name": "modules-payments-ui"`
  - `"sourceRoot": "libs/modules/payments/ui/src"`
  - `"tags": ["type:ui", "scope:payments", "platform:web"]`

- [ ] `libs/modules/payments/ui/tsconfig.json`
  - Same structure as other sub-libs

- [ ] `libs/modules/payments/ui/tsconfig.lib.json`
  - Same structure as other sub-libs

- [ ] `libs/modules/payments/ui/src/lib/stat-card.tsx`
  - `'use client'` directive at top
  - Exports `StatCard` component and `StatCardMetric` interface
  - Imports `calcPercentChange` from `@mono/modules/payments/utils`

- [ ] `libs/modules/payments/ui/src/index.ts`
  - Exports `StatCard` and `StatCardMetric`

### Feature sub-library

- [ ] `libs/modules/payments/feature/project.json`
  - `"name": "modules-payments-feature"`
  - `"sourceRoot": "libs/modules/payments/feature/src"`
  - `"tags": ["type:feature", "scope:payments", "platform:web"]`

- [ ] `libs/modules/payments/feature/tsconfig.json`
  - Same structure as other sub-libs

- [ ] `libs/modules/payments/feature/tsconfig.lib.json`
  - Same structure as other sub-libs

- [ ] `libs/modules/payments/feature/src/lib/payments-dashboard.tsx`
  - `'use client'` directive at top
  - Imports `usePayments` from `@mono/modules/payments/data-access`
  - Imports `StatCard` from `@mono/modules/payments/ui`
  - Imports `formatCurrency`, `formatCount` from `@mono/modules/payments/utils`
  - Exports `PaymentsDashboard`

- [ ] `libs/modules/payments/feature/src/index.ts`
  - `export { PaymentsDashboard } from './lib/payments-dashboard';`

### Shell pages

- [ ] `apps/shell/src/app/(modules)/payments/page.tsx`
  - Imports `PaymentsDashboard` from `@mono/modules/payments/feature`
  - Default-exports a function component that renders `<PaymentsDashboard />` inside `<div className="p-8">`
  - No `'use client'` directive (it is a Server Component)
  - No auth check (handled by the parent layout)

- [ ] `apps/shell/src/app/(modules)/payments/transactions/page.tsx`
  - Default-exports a placeholder page with heading "Transactions"

- [ ] `apps/shell/src/app/(modules)/payments/settings/page.tsx`
  - Default-exports a placeholder page with heading "Payment Settings"

---

## Files to modify

### `tsconfig.base.json`

- [ ] Four new entries added inside `"paths"`:

```json
"@mono/modules/payments/feature":     ["libs/modules/payments/feature/src/index.ts"],
"@mono/modules/payments/ui":          ["libs/modules/payments/ui/src/index.ts"],
"@mono/modules/payments/data-access": ["libs/modules/payments/data-access/src/index.ts"],
"@mono/modules/payments/utils":       ["libs/modules/payments/utils/src/index.ts"]
```

### `apps/shell/src/lib/modules.ts`

- [ ] New object appended to `MODULES` array:

```typescript
{
  id: 'payments',
  name: 'Payments',
  description: 'Transaction volume, revenue, and payment processing metrics.',
  route: '/payments',
  gradient: 'from-emerald-500 to-teal-600',
  iconColor: 'text-emerald-100',
  borderColor: 'hover:border-emerald-300',
  navItems: [
    { id: 'dashboard',    label: 'Dashboard',    route: '/payments',              iconId: 'home'     },
    { id: 'transactions', label: 'Transactions', route: '/payments/transactions', iconId: 'document' },
    { id: 'settings',     label: 'Settings',     route: '/payments/settings',     iconId: 'cog'      },
  ],
}
```

### `apps/shell/src/lib/module-icons.tsx`

- [ ] `CreditCard` added to the lucide-react import statement
- [ ] `payments: CreditCard` added to `MODULE_ICONS`

---

## How to verify everything works

```bash
# 1. Check Nx recognises all four sub-libs
pnpm nx show projects | grep payments
# Expected:
# modules-payments-feature
# modules-payments-ui
# modules-payments-data-access
# modules-payments-utils

# 2. Run TypeScript type checking across the monorepo
pnpm nx run-many -t typecheck --all
# Or, just for the payments libs:
pnpm nx typecheck modules-payments-feature

# 3. Start the shell dev server
pnpm nx serve shell

# 4. Navigate in the browser
# /            → Payments card visible in workspace grid
# /payments    → PaymentsDashboard renders (skeletons, then stat cards)
# /payments/transactions  → Transactions heading + placeholder
# /payments/settings      → Payment Settings heading + placeholder
```

Also verify the app-switcher and sidebar:
- Click the grid/waffle icon in the top bar — Payments entry visible in dropdown
- Click the Payments card from the workspace home — sidebar switches to show Dashboard / Transactions / Settings nav items
- Click each sidebar nav item — URL changes and the active item is highlighted

---

## Common mistakes and fixes

### TypeScript cannot find `@mono/modules/payments/feature`

**Symptom:** `Cannot find module '@mono/modules/payments/feature' or its corresponding type declarations`

**Cause:** The path alias is missing from `tsconfig.base.json`, or the value points to a path that does not exist.

**Fix:**
1. Open `tsconfig.base.json` and confirm the four entries are present under `"paths"`.
2. Confirm the file at `libs/modules/payments/feature/src/index.ts` exists.
3. Restart your editor's TypeScript language server (in VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server").

---

### Nx does not list the new projects

**Symptom:** `pnpm nx show projects | grep payments` returns nothing.

**Cause:** `project.json` is missing, malformed, or the `$schema` path does not resolve.

**Fix:**
1. Confirm all four `project.json` files exist.
2. Validate JSON syntax — use `cat libs/modules/payments/feature/project.json | python3 -m json.tool` to check.
3. Confirm the `$schema` path resolves: `ls libs/modules/payments/feature/../../../../node_modules/nx/schemas/project.json` should print the file.
4. Clear the Nx cache and retry: `pnpm nx reset && pnpm nx show projects`.

---

### The Payments card does not appear on the workspace home

**Symptom:** Workspace home at `/` renders only existing module cards.

**Cause:** The `payments` entry was not appended to the `MODULES` array, or a syntax error broke the array.

**Fix:**
1. Open `apps/shell/src/lib/modules.ts` and confirm the object is inside the array (between `[` and `]`).
2. Check for trailing commas (TypeScript allows them, but confirm the JSON-like structure is valid TypeScript).
3. Check the browser console for a runtime error that would prevent the page from rendering.

---

### The module icon is the fallback `BarChart2` instead of `CreditCard`

**Symptom:** The workspace card and sidebar show a bar-chart icon instead of a credit card.

**Cause:** The `MODULE_ICONS` record does not have a `payments` key, or the key name does not match the `id` in `MODULES`.

**Fix:**
1. Open `module-icons.tsx` and confirm `MODULE_ICONS` contains `payments: CreditCard`.
2. Confirm `CreditCard` is imported from `lucide-react` at the top of the file.
3. Confirm the `id` in `MODULES` is exactly `'payments'` (lowercase, no spaces).

---

### Navigating to `/payments` shows a 404

**Symptom:** The browser shows Next.js's default 404 page.

**Cause:** The file `apps/shell/src/app/(modules)/payments/page.tsx` does not exist, or the path is wrong.

**Fix:**
1. Confirm the file exists at exactly that path (case-sensitive).
2. Confirm the folder is named `payments` not `Payments`.
3. Confirm the folder is inside `(modules)/`, not inside `app/` directly.
4. Restart the dev server — Next.js picks up new route files on save but may need a restart if the folder was created while it was running.

---

### The page renders but `PaymentsDashboard` shows an error state immediately

**Symptom:** The EmptyState panel with a Retry button appears as soon as the page loads.

**Cause:** `fetchPaymentsSummary` is calling the real API but the endpoint does not exist yet, returning a non-2xx response.

**Fix:** Switch to mock data in `payments.api.ts` while the API is being developed:

```typescript
export async function fetchPaymentsSummary(): Promise<ApiResponse<PaymentsSummary>> {
  await new Promise((r) => setTimeout(r, 400)); // simulate latency
  return {
    success: true,
    data: {
      updatedAt: new Date().toISOString(),
      metrics: [
        { label: 'Total revenue',      value: 1_284_300, previous: 1_102_000, format: 'currency' },
        { label: 'Transactions',        value: 42_810,    previous: 38_200,    format: 'count'    },
        { label: 'Success rate',        value: 98.4,      previous: 97.9,      format: 'percent'  },
        { label: 'Failed transactions', value: 683,       previous: 810,       format: 'count', lowerIsBetter: true },
      ],
    },
  };
}
```

---

### `'use client'` errors at build time

**Symptom:** Build error like `You're importing a component that needs "useState". It only works in a Client Component but none of its parents are marked with "use client"`.

**Cause:** A component that uses React hooks does not have `'use client'` at the top of the file.

**Fix:** Add `'use client';` as the very first line (before any imports) of:
- `payments-dashboard.tsx`
- `stat-card.tsx`
- `use-payments.ts`

The shell page files (`page.tsx`) do **not** need `'use client'` — they are Server Components that import a Client Component boundary.

---

### Sidebar nav items show fallback icons

**Symptom:** Sidebar nav items for `transactions` or `settings` show `BarChart2` instead of `FileText` or `Settings`.

**Cause:** The `iconId` values in `navItems` do not match keys in `NAV_ICONS`.

**Fix:** Check `apps/shell/src/lib/module-icons.tsx` — the `NAV_ICONS` record must have keys `home`, `document`, and `cog`. The Payments navItems use exactly those keys:

```typescript
{ id: 'dashboard',    iconId: 'home'     },  // → Home
{ id: 'transactions', iconId: 'document' },  // → FileText
{ id: 'settings',     iconId: 'cog'      },  // → Settings
```

If you use a custom `iconId` that is not yet in `NAV_ICONS`, add it following the pattern in [Step 5](./05-register-in-modules-registry.md#4-navitems--structure-and-available-iconid-values).

---

## Summary of all shell surfaces

| Surface | File | How it reads your module |
|---|---|---|
| Workspace home grid | `apps/shell/src/app/page.tsx` | Iterates `MODULES`, renders `ModuleCard` for each |
| App-switcher dropdown | `apps/shell/src/components/workspace-topbar.tsx` | Iterates `MODULES`, renders a button for each |
| Sidebar module list | `apps/shell/src/components/shell-nav.tsx` | Iterates `MODULES` when no module is active |
| Sidebar nav items | `apps/shell/src/components/shell-nav.tsx` | Reads `activeModule.navItems` when inside a module route |
| Module icon | All three above | Looks up `MODULE_ICONS[mod.id]` |
