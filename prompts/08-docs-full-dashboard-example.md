# Prompt 8 — Full HRMS-style dashboard example

## Context
`apps/landing/content/docs/examples/dashboard.mdx` and
`apps/landing/components/demos/examples/dashboard.tsx` **already exist** — read both first. This
is an **update/expansion**, not a new page. The original dashboard example predates this phase's
additions (AppRail, TopBar, AppSwitcher, NotificationBell, UserMenu, WelcomeBanner, charts, the
newer dashboard widgets) and should be upgraded to actually wire all of them together, matching
the HRMS reference screenshot's overall composition: icon rail on the far left → sidebar next to
it → top bar with AppSwitcher/NotificationBell/UserMenu → main content with WelcomeBanner,
MetricCards, charts, and dashboard widgets (EntityList/ActivityFeed/ActionList/QuickActions).

A second example, `apps/landing/content/docs/examples/setup-wizard.mdx` /
`components/demos/examples/setup-wizard.tsx`, already exists for the "ECOSYSTEM" setup-wizard
screenshot — leave that one alone unless the dashboard example needs something it doesn't have
yet (unlikely, different composition).

## Task
1. Read the existing dashboard example page + demo file in full before changing anything.
2. Rebuild the demo composition to actually use, together in one coherent layout:
   - `AppRail` (+ `AppRailItem`s) as the leftmost icon rail.
   - `SidebarProvider` + `Sidebar` (pick a variant that looks right next to the rail — probably
     `variant="sidebar"`, `collapsible="icon"`) with a realistic HRMS nav (Dashboard, Employees,
     Payroll, Attendance, Reports, Settings) including at least one sub-menu to show that off too.
   - `TopBar` with `AppSwitcher`, `NotificationBell`, `UserMenu` in `TopBarEnd`.
   - `SidebarInset` / main content area with: `WelcomeBanner`, a row of `MetricCard`s, at least one
     chart from `@innostes/ui/charts` (e.g. a `BarChart` for headcount or a `DonutChart` for
     attendance — matches the reference screenshot's chart), and 2-3 of the dashboard widgets
     (`EntityList` for birthdays, `ActivityFeed` for recent activity, `QuickActions` for shortcuts).
3. Keep the whole thing responsive — this is the flagship example, it should visibly adapt (rail
   collapses, sidebar goes off-canvas, DataTable-style widgets stack) at narrow widths, since
   "responsive and customizable" is the core thesis of this whole package. Test by resizing the
   actual rendered preview in the dev server, not just by reading the code.
4. Update the `.mdx` prose to walk through the composition section by section (rail → sidebar →
   top bar → content), linking to each component's own docs page (written in prompts 4-6) instead
   of re-explaining their props here.

## Definition of done
- [ ] The dashboard example visibly uses AppRail, Sidebar (with a sub-menu), TopBar, AppSwitcher,
      NotificationBell, UserMenu, WelcomeBanner, MetricCard, at least one chart, and at least 2
      dashboard widgets, all in one working composition.
- [ ] Resizing the preview down to a narrow width demonstrably triggers the responsive behaviors
      (rail/sidebar collapse, widget stacking) without layout breakage.
- [ ] The `.mdx` prose links to each real component doc page rather than duplicating content.
- [ ] `pnpm nx run-many -t build typecheck -p landing` passes.
- [ ] Nothing is committed.
