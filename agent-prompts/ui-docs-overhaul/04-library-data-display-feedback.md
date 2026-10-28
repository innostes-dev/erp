# 04 – Library: data display and feedback

## Role

Same role as prompt 03: a senior design-system engineer who owns the correctness of these components.
This prompt changes the **library**. Docs pages come in prompt 10.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`, especially the "Decisions" from prompt 03, which you must follow
- `AUDIT.md`: the `LIB-*` items owned by 04
- `packages/ui/CONTRIBUTING.md`
- `03-library-actions-forms.md`, section "Component review checklist". Apply that checklist in full
  to every component in your scope.

## Scope

- `packages/ui/src/components/data-display/**`: Avatar (and AvatarGroup), Badge, Card, DataTable
  (and `sort.ts`), EmptyState, IconTile, Kbd, Stat, Table, TreeView
- `packages/ui/src/components/feedback/**`: Alert, Gauge, Meter, Progress, Skeleton, Spinner, Toast
  (and `toast()` and `Toaster`)

## Specific items known to need attention

- **Meter and Progress `format`.** Base UI applies `format` to the raw value, so `value={72}
  format={{ style: 'percent' }}` shows "7,200%". Decide the correct behaviour: match `Gauge`, which
  formats the share of the range for percent styles. Fix it, add regression tests, and correct the
  TSDoc example.
- **DataTable** is the most important component for an ERP. Review it as such:
  - client and server sorting and pagination
  - selection (including "select all" across pages, and what it means)
  - loading, empty and error states
  - sticky header
  - column alignment for numbers
  - keyboard navigation and screen-reader announcements on sort
  - the `responsive="stack"` mode
  - performance with 1,000 rows (measure render time in a test or a benchmark script and record it)
  - typed column definitions
  - Decide whether row actions, column visibility and density belong in it. If they are missing
    and expected, implement them consistently, with tests, and record the decision.
- **TreeView** is new (Beta). Verify:
  - lazy children (`children: []` plus loading)
  - very deep trees
  - controlled expansion when `items` change
  - RTL arrow keys
- **Toast**:
  - queue limits
  - pause on hover and focus
  - announcement politeness by type
  - the action button
  - promise toasts, if they exist
  - stacking on mobile
- **Contrast**: confirm that `Badge`, `Alert` and `IconTile` tones meet 4.5:1 for text in both themes.

## Definition of done

- Every component in scope passes the checklist, or has a recorded exception.
- Every in-scope `LIB-*` item is fixed or justified.
- API changes are listed.
- Coverage for these folders is at least 90% of lines, with meaningful tests.
- STANDARDS §8 is met.
- Commit as `fix(ui): harden data display and feedback components`.
