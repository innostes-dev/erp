# State Management

The platform has one global state store, exposed through `useKernelStore()` from `@mono/kernel/state`. It is built on [Zustand](https://github.com/pmndrs/zustand).

---

## What is useKernelStore()?

`useKernelStore()` is a Zustand hook that holds platform-level UI state. It is the single source of truth for concerns that span the entire shell — things like sidebar visibility and which module is currently active.

It is **not** for business data. Feature-level state (a list of invoices, a selected record, form values) belongs inside the module that owns it.

---

## Available state

### Type definition

```ts
interface KernelState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  activeModuleId: string | null;
  setActiveModuleId: (id: string | null) => void;
}
```

### Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `isSidebarOpen` | `boolean` | `true` | Whether the navigation sidebar is expanded |
| `toggleSidebar` | `() => void` | — | Flips `isSidebarOpen` |
| `activeModuleId` | `string \| null` | `null` | The route key of the currently active module |
| `setActiveModuleId` | `(id: string \| null) => void` | — | Sets which module is active |

### Usage

```tsx
'use client';

import { useKernelStore } from '@mono/kernel/state';

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar, activeModuleId } = useKernelStore();

  return (
    <aside className={isSidebarOpen ? 'w-64' : 'w-16'}>
      <button onClick={toggleSidebar}>
        {isSidebarOpen ? 'Collapse' : 'Expand'}
      </button>
      <nav>
        {/* highlight nav item when activeModuleId matches */}
      </nav>
    </aside>
  );
}
```

---

## How to add new global state

Follow these three steps every time you add a field to the kernel store. Only add state that is a platform concern — see the rules below before proceeding.

### Step 1 — Extend the store interface

Open `libs/kernel/state/src/store.ts` and add your field and action to the `KernelState` interface.

```ts
interface KernelState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  activeModuleId: string | null;
  setActiveModuleId: (id: string | null) => void;

  // Add your new state here
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}
```

### Step 2 — Add to initial state

Inside the `create()` call, add the initial value alongside the existing fields.

```ts
export const useKernelStore = create<KernelState>()((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  activeModuleId: null,
  setActiveModuleId: (id) => set({ activeModuleId: id }),

  // New state
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

### Step 3 — Export from the package index

Make sure `libs/kernel/state/src/index.ts` exports the hook (it typically re-exports everything from `store.ts` already). If you added a standalone selector or type, export those too.

```ts
// libs/kernel/state/src/index.ts
export { useKernelStore } from './store';
export type { KernelState } from './store';
```

After these three steps, any component can call `useKernelStore()` and access `theme` and `setTheme`.

---

## When to use global state vs local state vs module state

Picking the wrong state location creates unnecessary coupling. Use this decision tree:

### Use `useKernelStore()` when:

- The state is a shell/platform concern that multiple unrelated components read.
- Examples: sidebar open/closed, current active module, global theme.

### Use React `useState` when:

- The state is local to one component and never needed elsewhere.
- Examples: whether a dropdown is open, a controlled input value.

### Use module-level state when:

- The state belongs to a single feature module and multiple components inside that module read it.
- Create a Zustand store inside the module (e.g., `libs/modules/billing/src/store.ts`), keep it scoped to that module.
- Examples: selected invoice ID in the billing module, pagination state in a data table.

### Never use `useKernelStore()` for:

- Server-fetched data (user lists, transaction records, etc.)
- Form state
- Anything that resets when a module unmounts

---

## Rules

**Kernel state is for platform concerns only.**

The sidebar, the active module, the theme — these are platform-level concepts that every module shares. They belong in the kernel store.

A list of orders belongs to the orders module. A selected customer ID belongs to the CRM module. Putting business data in the kernel store creates hidden coupling between modules and violates the module boundary rules enforced by Nx tags.

If you are unsure whether something belongs in the kernel store, the answer is almost always: create module-local state instead.
