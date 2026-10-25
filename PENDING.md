# innostes UI — Pending Items

Snapshot of where the `@innostes/ui` package and the wider workspace stand, and what's left
before everything is committed and the package is fully npm-ready. Nothing listed as "done" below
has been committed to git yet — see [Not committed](#not-committed) at the bottom.

## Execution plan: `prompts/`

Every item in [Pending](#pending) has been turned into a standalone, self-contained master prompt
in [`prompts/`](prompts/00-index.md), numbered in the order they should run. Each prompt file can
be handed to an AI coding agent on its own — it restates the context it needs, the exact task,
and a "Definition of done" checklist, so nothing gets missed or hand-waved. Start at
[`prompts/00-index.md`](prompts/00-index.md).

| # | Prompt | Covers |
|---|--------|--------|
| 1 | [01-run-test-suite.md](prompts/01-run-test-suite.md) | Run + fix the 3 Vitest suites (never executed) |
| 2 | [02-workspace-build-typecheck.md](prompts/02-workspace-build-typecheck.md) | Full workspace build/typecheck (interrupted, unverified) |
| 3 | [03-lint-format-pass.md](prompts/03-lint-format-pass.md) | Lint/format every changed file |
| 4 | [04-docs-sidebar-appshell.md](prompts/04-docs-sidebar-appshell.md) | Docs: Sidebar customization, AppRail, TopBar, CommandPalette, AppSwitcher, NotificationBell, UserMenu |
| 5 | [05-docs-dashboard-widgets.md](prompts/05-docs-dashboard-widgets.md) | Docs: EntityList, ActivityFeed, ActionList, WelcomeBanner, QuickActions |
| 6 | [06-docs-charts.md](prompts/06-docs-charts.md) | Docs: `@innostes/ui/charts` |
| 7 | [07-docs-customization-conventions.md](prompts/07-docs-customization-conventions.md) | Update the Conventions page with all 5+ customization mechanisms |
| 8 | [08-docs-full-dashboard-example.md](prompts/08-docs-full-dashboard-example.md) | Rebuild the full HRMS-style dashboard example |
| 9 | [09-npm-packaging-readiness.md](prompts/09-npm-packaging-readiness.md) | publint, attw, size-limit, LICENSE, CHANGELOG, package.json audit |
| 10 | [10-ci-pnpm-migration.md](prompts/10-ci-pnpm-migration.md) | CI: npm → pnpm |
| 11 | [11-rough-edges-fixups.md](prompts/11-rough-edges-fixups.md) | The 4 known rough edges below |
| 12 | [12-final-commit.md](prompts/12-final-commit.md) | Final clean verification sweep + the actual commit |

## Done

### Package foundation
- React 17 / 18 / 19 support (`forwardRef` everywhere, no React 18+-only APIs).
- Two React-version compat test projects (`tests/ui-react17`, `tests/ui-react18`) that build
  against the **published** `dist/` output, not source.
- `pnpm` only, Nx-driven tasks, Vitest test runner, TSDoc → `dist/api.json` generator that powers
  the docs site's API tables.
- 46+ base components across actions / forms / data-display / feedback / overlays / navigation /
  layout, plus a `widgets/` layer (MetricCard, WidgetCard, Sparkline, EntityList, ActivityFeed,
  ActionList, WelcomeBanner, QuickActions, AppSwitcher, NotificationBell + NotificationList,
  UserMenu) and a `charts/` sub-entry (`@innostes/ui/charts`, Recharts-based: BarChart, LineChart,
  AreaChart, DonutChart) that apps only pay for if they import it.

### Theming & customisation
- Design tokens (`theme.css` + `dark.css`) incl. new `chart-1..8` categorical colours and a
  dedicated **sidebar/app-shell token set** (`--color-sidebar*`) so the shell can be themed
  independently of cards/menus.
- Fluid, responsive type scale tokens (`--text-display`, `--text-heading`, `--text-subheading`,
  `--text-metric`) — no fixed px headings; `MetricCard` values and `WelcomeBanner` titles now use
  these instead of fixed `text-2xl`/`text-3xl`.
- `classNames` prop (`SlotClassNames<Slot>` helper in `lib/slots.ts`) added to: `MetricCard`,
  `WidgetCard`, `PageHeader`, `EmptyState`, `Stepper`, `DataTable`. Every part also carries a
  `data-slot` for plain-CSS overrides even without the prop.
- Touch-friendly target sizes via `pointer-coarse:` variants on `Button`, `Input`, `Toggle`,
  `Calendar` day cells (WCAG 2.5.5 vibe — bigger hit areas on phones/tablets, unchanged on mouse).
- iOS Safari zoom-on-focus fix: form inputs are `text-base` by default and only drop to `text-sm`
  at `sm:` and above.
- `DataTable` gained a `responsive="stack"` mode (container-query driven) that turns rows into
  label/value cards below `@2xl` instead of horizontally scrolling.
- `Tabs` list now scrolls horizontally instead of overflowing when tabs don't fit.
- `Stepper` collapses non-current titles/descriptions on narrow containers (container queries).

### Sidebar / App shell overhaul (the big ask: "can they customize design of sidebar? completely")
- `Sidebar` now takes `side` (`left`/`right`), `variant` (`sidebar`/`floating`/`inset`),
  `collapsible` (`icon`/`offcanvas`/`none`).
- All sidebar sizing is CSS variables on `SidebarProvider`: `width`, `iconWidth`, `mobileWidth` →
  `--sidebar-width`, `--sidebar-width-icon`, `--sidebar-width-mobile`.
- New parts: `SidebarSeparator`, `SidebarGroupAction`, `SidebarMenuAction`, `SidebarMenuBadge`,
  `SidebarMenuSub` / `SidebarMenuSubItem` / `SidebarMenuSubButton` (nested nav), `SidebarRail`
  (drag-style edge toggle).
- New `AppRail` + `AppRailItem` + `AppRailHeader`/`AppRailFooter`/`AppRailSeparator` — the icon
  rail from the HRMS reference screenshot, for two-level (rail + sidebar) navigation.
- New `TopBar` / `TopBarStart` / `TopBarCenter` / `TopBarEnd`.
- New `CommandPalette` (⌘K), `AppSwitcher` (the "ECOSYSTEM" module launcher from the reference
  image), `NotificationBell` + `NotificationList`, `UserMenu`.

### Tests written (not yet run — see Pending)
- `packages/ui/src/widgets/app-shell.test.tsx` — Sidebar variants/side/collapsible, sub-menus,
  badges, group actions, AppRail, TopBar, CommandPalette (hotkey, filtering, arrow-key nav),
  AppSwitcher, NotificationBell, UserMenu.
- `packages/ui/src/widgets/dashboard-widgets.test.tsx` — `formatRelativeTime`, EntityList,
  ActivityFeed (day grouping + `<time>` elements), ActionList, WelcomeBanner, QuickActions, and
  customisation hooks (`classNames` on MetricCard, `data-label` stacking on DataTable).
- `packages/ui/src/charts/charts.test.tsx` — BarChart/LineChart/AreaChart accessible-table output,
  value formatting, legend toggle, single-series legend suppression, DonutChart centre value +
  legend + percentage table.

### Build verified
- `pnpm nx run-many -t build typecheck -p ui ui-react17-tests ui-react18-tests` — **passes**,
  including the new `@innostes/ui/charts` entry point on both Recharts 2.15 (React 17 project) and
  Recharts 3 (React 18 project).

## Pending

### Immediate next steps
1. **Run the full test suite** (`pnpm nx test ui`, then the two compat projects) — skipped this
   turn per instruction, needs doing before anything is considered final. The new test files
   above have not been executed even once.
2. **Build + typecheck the whole workspace** (`apps/landing`, `apps/web-app`, docs site) — the
   run that was in flight got interrupted. `apps/landing`'s MDX docs pages for the new
   widgets/charts/app-shell components **do not exist yet** (no `.mdx` pages, no demo files under
   `apps/landing/components/demos/`), so the docs site will build but won't document any of
   today's additions yet.
3. **Lint / format pass** — none of today's new or edited files have been run through
   Prettier/ESLint explicitly this session (some were auto-reformatted by the editor's save
   hooks per the system reminders, but that's not a substitute for an explicit check).

### Docs site content gap (apps/landing)
Nothing has been written yet for:
- Sidebar customisation guide (`side`/`variant`/`collapsible`, CSS var sizing, token theming) —
  this directly answers the user's "can they customize design of sidebar? completely" question
  and should probably be the first new doc page.
- AppRail, TopBar, CommandPalette, AppSwitcher, NotificationBell, UserMenu — no component pages.
- EntityList, ActivityFeed, ActionList, WelcomeBanner, QuickActions — no widget pages.
- Charts (`@innostes/ui/charts`) — no docs page explaining the separate entry point, the
  Recharts 2 vs 3 peer requirement split by React version, or theming via `chart-1..8` tokens.
- A general "Customization" conventions page covering the five mechanisms (tokens, CSS vars,
  `className`, `classNames`, `render`) — mentioned as a goal but not written.
- Updated full HRMS-style dashboard example wiring AppRail + Sidebar + TopBar + AppSwitcher +
  NotificationBell + UserMenu + WelcomeBanner + MetricCard + charts together (the "full HRMS
  dashboard example" mentioned as an npm-readiness deliverable).

### npm packaging readiness (requested: "make sure we have full ui npm package ready")
Not yet done:
- `publint` run against the built `packages/ui` (installed as a dependency already, never
  executed).
- `@arethetypeswrong/cli` run against the built package (installed, never executed).
- Package size check / `size-limit` config (installed, no config file, never run).
- `LICENSE` file for `packages/ui` (package.json says `"license": "MIT"` but no LICENSE file
  exists in the package or repo root).
- `CHANGELOG.md` for `packages/ui`.
- Double-check `files`, `exports`, `sideEffects`, `engines` fields in `packages/ui/package.json`
  now that there's a second entry point (`./charts`) and new CSS isn't accidentally excluded.
- CI workflow still uses `npm`, not `pnpm` (flagged previously, still unresolved) — blocks a real
  CI run of any of this.

### Known rough edges to revisit
- `AppSwitcher` test had to be scoped to `within(list)` because the trigger and the popup list
  item both render accessible names starting with the app name (e.g. "HRMS" vs "HRMS People &
  HR") — worth a UX pass on whether the list item's accessible name should be shortened.
- `CommandPalette` keyboard model (arrow keys + Enter) has not been checked against the rest of
  the component set's conventions doc (e.g. Home/End behaviour, Escape handling symmetry with
  `Dialog`).
- `DataTable` `responsive="stack"` mode is new and only covered by one basic test (data-label
  presence); no test yet for selection checkboxes or sort buttons inside stacked cards.
- Sidebar `variant="floating"` / `variant="inset"` have styling in place but no visual/browser
  screenshot check has been done this session (all verification so far is type-checking + build,
  not a running dev server screenshot).

## Not committed

Everything above is **uncommitted working-tree changes** (48 modified/new files as of this
snapshot — see `git status`). Nothing has been staged or committed. A commit should happen only
after at least the test suite and workspace build are confirmed green.
