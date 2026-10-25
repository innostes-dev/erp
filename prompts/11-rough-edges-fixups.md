# Prompt 11 — Known rough edges

## Context
Four specific, already-identified loose ends from this phase. Each is small and independent —
fix all four.

**Precondition:** run prompt 1 (test suite) first — two of these four are literally about tests
that already exist; don't duplicate work.

## Task

### 1. `AppSwitcher` accessible-name overlap
In `packages/ui/src/widgets/app-switcher.tsx`, the trigger button's accessible name
("Switch application, current: HRMS") and a list item's accessible name ("HRMS People & HR", i.e.
app name + description concatenated) both start with the app name, which forced the test
(`app-shell.test.tsx`) to scope queries with `within(list)` to disambiguate. Do a real UX pass:
either shorten the list item's accessible name (e.g. put the description in a visually-rendered
but non-concatenated `aria-describedby` instead of folding it into the accessible name), or
restructure the DOM so Testing-Library-style queries wouldn't naturally collide — pick whichever
keeps the visual design intact. Update the component, then update the test to match the new
(better) accessible-name structure — don't just leave the `within(list)` workaround if the
underlying naming can be improved.

### 2. `CommandPalette` keyboard model consistency
Check `packages/ui/src/components/overlays/command-palette/command-palette.tsx`'s keyboard
handling (arrow keys, Enter, current Escape behavior) against this package's other overlay
components for consistency — specifically the `Dialog` component's Escape-to-close behavior, and
whether other list-like components in this package support `Home`/`End` to jump to first/last
item. If `CommandPalette` is missing `Home`/`End` support, or its Escape behavior differs from
`Dialog`'s without a deliberate reason, fix it to match. Add test coverage for whatever you add or
change.

### 3. `DataTable` `responsive="stack"` test coverage
`packages/ui/src/components/data-display/data-table/data-table.tsx`'s stack mode currently has
only one test (`data-label` presence, in `dashboard-widgets.test.tsx`). Add tests for:
- A selection checkbox column still works correctly when stacked (checkbox renders, click toggles
  selection, `aria-label`/`data-label` still correct).
- A sortable column header's sort button still works when stacked (click triggers sort, ARIA sort
  state updates).
Put these in the existing `dashboard-widgets.test.tsx` file alongside the current DataTable test,
or a new `data-table.test.tsx` next to the component if that fits the package's existing test-file
placement convention better (check: are component tests generally colocated with the component,
or centralized? Follow whichever pattern already dominates `packages/ui/src`).

### 4. Sidebar `variant="floating"` / `variant="inset"` visual verification
These two variants have styling written but were never visually checked — only type-checked and
built. Start the docs dev server (`pnpm nx dev landing` or equivalent), navigate to the sidebar
docs page (written in prompt 4) or build a throwaway local repro if that page doesn't demo both
variants yet, and actually look at both. Fix anything that looks wrong (spacing, shadow, border
radius, the `inset` variant's content-area offset, floating variant's margin/overlap with
surrounding content). If both already look correct, say so explicitly — don't skip the check just
because nothing was flagged in code review.

## Definition of done
- [ ] AppSwitcher's accessible names no longer need `within(list)` to disambiguate, OR a clear
      reason is documented for why the current structure is actually correct and the workaround
      stays.
- [ ] CommandPalette's keyboard model is either confirmed consistent with the rest of the package,
      or fixed, with new test coverage either way.
- [ ] DataTable stack mode has test coverage for selection and sorting.
- [ ] Sidebar `floating`/`inset` variants have been visually verified (with evidence — a
      description of what was checked and seen, not just "looks fine").
- [ ] `pnpm nx test ui` still passes after all of the above (re-run, don't assume).
- [ ] Nothing is committed.
