# Contributing to @innostes/ui

## Commands

```sh
pnpm nx build ui        # JS + types + dist/styles.css + dist/api.json
pnpm nx test ui         # Vitest + Testing Library (jsdom), React 19
pnpm nx run-many -t test typecheck -p ui-react17-tests ui-react18-tests   # same tests on React 17 and 18
pnpm nx typecheck ui    # library and tests
pnpm nx dev landing     # docs site at http://localhost:3000/ui/docs
```

## Folder structure

```
src/
  components/
    actions/        Button, ButtonGroup, Toggle, ToggleGroup
    forms/          Field, Input, Select, Combobox, …
    data-display/   DataTable, Table, Card, Badge, …
    feedback/       Alert, Toast, Progress, Skeleton, …
    overlays/       Dialog, Sheet, Popover, Menus, Tooltip
    navigation/     Tabs, Breadcrumb, Pagination, Accordion, …
    layout/         Sidebar, PageHeader, Separator, ScrollArea
    <category>/index.ts       re-exports the category
    <category>/<name>/<name>.tsx
  widgets/          AppSwitcher, ChangeLog, KanbanBoard, MetricCard, NotificationBell, PermissionMatrix, Sparkline, UserMenu, WidgetCard
  charts/           CartesianCharts, DonutChart (data visualisation built on Recharts)
  editor/           RichTextEditor (rich text document authoring built on Tiptap)
  lib/              cn, mergeClassName, shared styles, internal icons and hooks
  test/setup.ts     jsdom polyfills and jest-dom matchers
  index.ts          public entry: re-exports every category
tailwind/
  theme.css         design tokens (@theme default)
  dark.css          opt-in dark theme
  tailwind.css      entry for Tailwind apps
  styles.css        source of the precompiled dist/styles.css
scripts/
  generate-api-docs.mjs   writes dist/api.json from TSDoc
```

## Component checklist

Every component must:

1. **Live in the right category folder** and be exported from that category's `index.ts`.
2. **Build on Base UI** when a primitive exists. Don't re-implement focus, keyboard or ARIA logic.
3. **Start with `'use client'`** if it uses state, effects, context or event handlers. Keep pure
   helpers (variants, formatters) in a separate file without the directive, so they work in
   Server Components.
4. **Use tokens only** (`bg-primary`, `text-muted-foreground`, `border-border`, …). No raw colours.
5. **Accept and merge `className`**: `cn()` for plain elements, `mergeClassName()` for Base UI parts
   (supports the state-function form).
6. **Set `data-slot`** on every rendered part (`data-slot="dialog-content"`).
7. **Forward the ref** with `forwardRef` to the root element. The package supports React 17–19,
   so don't rely on React 19's ref-as-prop, and don't use React 18+ only APIs
   (`useId`, `useSyncExternalStore`, `useTransition`, …). Spread remaining props onto the root
   so `aria-*`, `data-*` and event handlers work.
8. **Follow the conventions**: `value`/`defaultValue`/`onValueChange`, the `sm`/`md`/`lg` size scale,
   flat named exports (`DialogContent`, not `Dialog.Content`).
9. **Document every public prop with TSDoc**, including `@default`. The docs' API tables are
   generated from it.
10. **Be tested**: roles, accessible names, keyboard behaviour, controlled/uncontrolled state.
    Test behaviour users can observe, not class names or snapshots.
11. **Have a docs page** in `apps/landing/content/docs/components/<category>/<name>.mdx` with at
    least one demo in `apps/landing/components/demos/<category>/<name>/`.

## Releasing

See the developer docs: `/docs/guides/releasing`.
