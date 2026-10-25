# Master Prompt Chain — `@innostes/ui` Completion

This folder is a **chain of standalone prompts**. Each file is self-contained: hand any one of
them to an AI coding agent (with repo access) on its own and it has enough context to execute
that step correctly, without needing the rest of this conversation.

Run them **in order**. Each prompt states its own preconditions; if a precondition isn't met yet,
run the earlier prompt first. Nothing here should be skipped — together they cover every
remaining item in `PENDING.md`.

| # | File | Goal |
|---|------|------|
| 1 | [01-run-test-suite.md](01-run-test-suite.md) | Run and fix the Vitest suites for `ui`, `ui-react17-tests`, `ui-react18-tests` |
| 2 | [02-workspace-build-typecheck.md](02-workspace-build-typecheck.md) | Get `build`/`typecheck` green across the entire Nx workspace |
| 3 | [03-lint-format-pass.md](03-lint-format-pass.md) | Lint/format every changed file |
| 4 | [04-docs-sidebar-appshell.md](04-docs-sidebar-appshell.md) | Write Fumadocs pages + demos for Sidebar customization, AppRail, TopBar, CommandPalette, AppSwitcher, NotificationBell, UserMenu |
| 5 | [05-docs-dashboard-widgets.md](05-docs-dashboard-widgets.md) | Write Fumadocs pages + demos for EntityList, ActivityFeed, ActionList, WelcomeBanner, QuickActions |
| 6 | [06-docs-charts.md](06-docs-charts.md) | Write the Charts docs page (`@innostes/ui/charts`) |
| 7 | [07-docs-customization-conventions.md](07-docs-customization-conventions.md) | Write the general "Customization" conventions page |
| 8 | [08-docs-full-dashboard-example.md](08-docs-full-dashboard-example.md) | Build the full HRMS-style example wiring everything together |
| 9 | [09-npm-packaging-readiness.md](09-npm-packaging-readiness.md) | `publint`, `arethetypeswrong`, `size-limit`, LICENSE, CHANGELOG, package.json field audit |
| 10 | [10-ci-pnpm-migration.md](10-ci-pnpm-migration.md) | Migrate CI workflow from `npm` to `pnpm` |
| 11 | [11-rough-edges-fixups.md](11-rough-edges-fixups.md) | Fix the known rough edges listed in PENDING.md |
| 12 | [12-final-commit.md](12-final-commit.md) | Final verification sweep + commit everything |

## Ground rules every prompt in this chain must follow

- **Package manager:** `pnpm` only. Never use `npm`/`yarn` for anything in this repo.
- **Nx-first:** run all tasks through `pnpm nx run` / `run-many` / `affected`, never by calling
  the underlying tool (vite, vitest, tsc) directly.
- **React compatibility:** `@innostes/ui` must keep working on React 17, 18, and 19. Never add an
  API that only exists in React 18+/19+ to package source without a fallback (e.g. no raw
  `useSyncExternalStore`, no React-19-only ref-as-prop pattern — keep `forwardRef`).
- **Customization is a hard requirement:** every new/edited component must expose a `classNames`
  (`SlotClassNames<Slot>` from `src/lib/slots.ts`) prop where it has more than one internal
  element, a `data-slot` attribute on every styled element, and must use CSS variables/tokens
  instead of hard-coded sizes where a reasonable person would want to resize it.
- **Responsiveness is a hard requirement:** no fixed pixel sizes for anything that should scale;
  prefer fluid type tokens (`text-display`/`text-heading`/`text-subheading`/`text-metric`),
  container queries (`@container`, `@max-*`, `@md:` etc.) over viewport-only breakpoints where the
  component can be nested in a sidebar/panel, and `pointer-coarse:` for touch target sizing.
- **Do not commit anything** until explicitly told to in prompt 12 — every earlier prompt should
  leave changes in the working tree only.
- Each prompt ends with a **"Definition of done"** checklist — don't report a step finished until
  every box is actually true, verified by actually running the relevant command.
