# Prompt 1 — Run and fix the Vitest test suites

## Context
`@innostes/ui` lives at `packages/ui`. It is tested three ways:
- `pnpm nx test ui` — runs the package's own Vitest config against source.
- `pnpm nx test ui-react17-tests` — runs the SAME test files (via `tests/react-compat.config.mts`)
  against the **built** `packages/ui/dist` output, with React 17 installed in
  `tests/ui-react17`.
- `pnpm nx test ui-react18-tests` — same, but with React 18 installed in `tests/ui-react18`.

Three large test files were recently added and have **never been executed**:
- `packages/ui/src/widgets/app-shell.test.tsx`
- `packages/ui/src/widgets/dashboard-widgets.test.tsx`
- `packages/ui/src/charts/charts.test.tsx`

Build + typecheck for all three projects was last confirmed green, but `test` has not run at all
this round. Treat every assertion in these files as unverified until a real run says otherwise.

## Task
1. Build `ui` first, since the two compat projects test the built output:
   `pnpm nx run-many -t build -p ui`
2. Run `pnpm nx test ui` and read the full output.
3. Run `pnpm nx test ui-react17-tests` and `pnpm nx test ui-react18-tests` (rebuild `ui` first if
   you changed its source while fixing failures — the compat projects read `dist/`, not `src/`).
4. For every failure:
   - Read the actual component/widget/chart source involved before changing anything.
   - Decide whether the bug is in the **test** (wrong expectation) or the **component** (wrong
     behavior/markup/ARIA). Fix the actual root cause — do not loosen an assertion just to make it
     pass if the component is genuinely broken.
   - Common risk areas to check first, based on what's new: `CommandPalette` keyboard nav
     (`aria-activedescendant`, arrow keys, Enter), `AppSwitcher` accessible names (trigger vs. list
     item both start with the app name — may need `within(list)` scoping or a shortened accessible
     name on the list item), `ActivityFeed` day-grouping headings depend on the *current date* at
     test run time — make sure any "Today"/"Yesterday" logic is computed relative to a fixed
     `now`, not wall-clock time, so it isn't flaky across days.
   - If a React-17-only failure appears in the compat projects but not in `pnpm nx test ui`,
     suspect a React-18+-only API leaking into source (check for `useId`'s native behavior,
     `useSyncExternalStore`, or any Recharts/Base UI API that differs between React majors).
5. Re-run the failing project's test command after each fix — don't batch multiple unverified
   fixes before checking any of them actually worked.
6. Once all three are green, run the full typecheck again for the same three projects to make sure
   no fix introduced a type error:
   `pnpm nx run-many -t typecheck -p ui ui-react17-tests ui-react18-tests`

## Definition of done
- [ ] `pnpm nx test ui` passes with 0 failures (paste the final summary line).
- [ ] `pnpm nx test ui-react17-tests` passes with 0 failures.
- [ ] `pnpm nx test ui-react18-tests` passes with 0 failures.
- [ ] `pnpm nx run-many -t typecheck -p ui ui-react17-tests ui-react18-tests` passes.
- [ ] Every fix is explained in terms of root cause, not just "updated the assertion."
- [ ] Nothing is committed — this step only touches the working tree.
