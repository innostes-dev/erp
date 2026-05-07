# Step 5 — Register in the Modules Registry

Adding one entry to `MODULES` and one key to `MODULE_ICONS` is all it takes to make the Payments module appear in every shell surface: the workspace home grid, the top-bar app-switcher dropdown, and the collapsible sidebar.

---

## 1. Add the entry to `MODULES`

Open `apps/shell/src/lib/modules.ts` and append the Payments entry to the `MODULES` array.

**Before:**

```typescript
export const MODULES: ModuleDefinition[] = [
  {
    id: 'analytics',
    // ...
  },
];
```

**After:**

```typescript
export const MODULES: ModuleDefinition[] = [
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Real-time dashboards, metrics, and data insights across the platform.',
    route: '/analytics',
    gradient: 'from-indigo-500 to-violet-600',
    iconColor: 'text-indigo-100',
    borderColor: 'hover:border-indigo-300',
    navItems: [
      { id: 'dashboard', label: 'Dashboard',  route: '/analytics',          iconId: 'home'      },
      { id: 'reports',   label: 'Reports',    route: '/analytics/reports',  iconId: 'document'  },
      { id: 'insights',  label: 'Insights',   route: '/analytics/insights', iconId: 'lightbulb' },
      { id: 'settings',  label: 'Settings',   route: '/analytics/settings', iconId: 'cog'       },
    ],
  },
  // ─── ADD THIS ────────────────────────────────────────────────────────────
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
  },
];
```

### Field reference

| Field | Type | Purpose |
|---|---|---|
| `id` | `string` | Unique slug. Must match the key in `MODULE_ICONS`. |
| `name` | `string` | Human-readable name shown in the sidebar header and workspace card. |
| `description` | `string` | Short description shown in the workspace card and app-switcher tooltip. |
| `route` | `string` | The root URL of the module. Used by the sidebar to detect which module is active. |
| `gradient` | `string` | Tailwind gradient classes applied to the icon badge. |
| `iconColor` | `string` | Tailwind text-color class for the icon inside the badge. Use a `100`-weight shade so it is legible on the gradient. |
| `borderColor` | `string` | Tailwind hover border class applied to the workspace card. |
| `badge` | `string` (optional) | Short label shown in the top-right corner of the workspace card, e.g. `"beta"` or `"new"`. |
| `navItems` | `NavItem[]` | Ordered list of sidebar navigation links for this module. |

---

## 2. Add the icon to `MODULE_ICONS`

Open `apps/shell/src/lib/module-icons.tsx` and add the `CreditCard` icon for the `payments` key.

**Before:**

```typescript
import {
  BarChart2,
  // ... existing imports
} from 'lucide-react';

export const MODULE_ICONS: Record<string, IconComponent> = {
  analytics: BarChart2,
};
```

**After:**

```typescript
import {
  BarChart2,
  CreditCard,             // ← ADD THIS
  // ... existing imports
} from 'lucide-react';

export const MODULE_ICONS: Record<string, IconComponent> = {
  analytics: BarChart2,
  payments:  CreditCard,  // ← ADD THIS
};
```

The `id` field in `MODULES` and the key in `MODULE_ICONS` must be identical. If they differ the sidebar and workspace card will fall back to `BarChart2` (the default icon in `shell-nav.tsx`) and show a warning in the console.

---

## 3. Gradient + color combinations

Choose a gradient that is distinct from other modules already in `MODULES`. All gradients follow the Tailwind pattern `from-<color>-500 to-<color>-600`. The `iconColor` should be the `100`-weight version of the same color family.

| Gradient | `iconColor` | `borderColor` | Good for |
|---|---|---|---|
| `from-indigo-500 to-violet-600` | `text-indigo-100` | `hover:border-indigo-300` | Analytics, insights |
| `from-emerald-500 to-teal-600` | `text-emerald-100` | `hover:border-emerald-300` | Payments, finance |
| `from-rose-500 to-pink-600` | `text-rose-100` | `hover:border-rose-300` | Alerts, notifications |
| `from-amber-500 to-orange-600` | `text-amber-100` | `hover:border-amber-300` | Reports, exports |
| `from-sky-500 to-cyan-600` | `text-sky-100` | `hover:border-sky-300` | Data, pipelines |
| `from-violet-500 to-purple-600` | `text-violet-100` | `hover:border-violet-300` | Auth, identity |
| `from-slate-500 to-gray-600` | `text-slate-100` | `hover:border-slate-300` | Admin, settings |
| `from-lime-500 to-green-600` | `text-lime-100` | `hover:border-lime-300` | Health, monitoring |

The gradient string goes directly into a Tailwind `bg-gradient-to-br` element. Do not add `bg-gradient-to-br` to the `gradient` field — the shell components add that class themselves.

---

## 4. `navItems` — structure and available `iconId` values

Each `NavItem` produces one entry in the sidebar when the user is inside your module.

```typescript
interface NavItem {
  id: string;      // unique within this module's navItems
  label: string;   // text shown when the sidebar is expanded
  route: string;   // full pathname, e.g. '/payments/transactions'
  iconId: string;  // key into NAV_ICONS in module-icons.tsx
}
```

### Sidebar active state logic

The sidebar in `shell-nav.tsx` determines whether a nav item is active with this rule:

- If the item's `route` equals the module's root `route`, it uses **exact match**: `pathname === item.route`
- Otherwise it uses **prefix match**: `pathname.startsWith(item.route)`

This means the Dashboard item (`route: '/payments'`) is only active on exactly `/payments`, not on `/payments/transactions`.

### Available `iconId` values

These are the keys already in `NAV_ICONS` in `module-icons.tsx`:

| `iconId` | Lucide component | When to use |
|---|---|---|
| `home` | `Home` | The main/dashboard nav item |
| `document` | `FileText` | Reports, transaction lists, records |
| `lightbulb` | `Lightbulb` | Insights, recommendations |
| `cog` | `Settings` | Settings, configuration |
| `chart` | `BarChart2` | Charts, graphs, metrics |

To add a new `iconId`, open `module-icons.tsx`, import the Lucide icon, and add it to `NAV_ICONS`:

```typescript
import { CreditCard, Wallet } from 'lucide-react';

export const NAV_ICONS: Record<string, IconComponent> = {
  home:      Home,
  document:  FileText,
  lightbulb: Lightbulb,
  cog:       Settings,
  chart:     BarChart2,
  // New additions:
  wallet:    Wallet,    // ← use iconId: 'wallet' in navItems
};
```

Then use the new `iconId` in your `navItems`:

```typescript
{ id: 'wallet', label: 'Wallet', route: '/payments/wallet', iconId: 'wallet' },
```

---

## 5. Where the module automatically appears

After saving both files, the following shell surfaces update with no additional code changes:

### Workspace home (`/`)

The `WorkspacePage` server component iterates `MODULES` and renders a `ModuleCard` for each entry. Your new card appears in the grid with:
- The gradient icon badge using `MODULE_ICONS['payments']` (`CreditCard`)
- The `name` and `description` fields
- The optional `badge` label in the top-right corner (if set)
- A hover animation with an "Open module" label

### Top-bar app-switcher

`WorkspaceTopbar` renders a dropdown when the waffle/grid icon is clicked. It maps `MODULES` to a list of items, each showing the gradient icon, name, and description. Clicking an item navigates to `route`.

### Sidebar (`ShellNav`)

`ShellNav` reads `MODULES` to:
1. Determine which module is active based on `pathname.startsWith(mod.route)`
2. Show the module's icon and name in the sidebar header
3. Render the module's `navItems` as the navigation list

When the user is not inside any module's route, the sidebar shows all modules as icon buttons (collapsed mode) or icon + name buttons (expanded mode).

---

## 6. Verify it appears

1. Start the dev server: `pnpm nx serve shell`
2. Log in and navigate to the workspace home at `/`
3. Confirm the Payments card appears in the module grid
4. Click the waffle icon in the top bar — Payments should appear in the dropdown
5. Click the Payments card — the sidebar should switch to the Payments nav items (Dashboard, Transactions, Settings)

---

## Next steps

Continue with [06 — Connect to the API](./06-connect-to-api.md).
