# 10 – Component pages: data display and feedback

## Role

Same role as prompt 09.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`
- `AUDIT.md`: the `DOC-*` items owned by 10
- `writing-docs.mdx`
- `09-pages-actions-forms.md`, section "Page procedure". Follow it exactly for every page.
- the source and tests of each component you document

## Scope

Pages and demos for:

- `components/data-display/*`: Avatar, Badge, Card, DataTable, EmptyState, IconTile, Kbd, Stat,
  Table, TreeView
- `components/feedback/*`: Alert, Gauge, Meter, Progress, Skeleton, Spinner, Toast

## Content you must cover in this scope

- **DataTable** is the most-read page in an ERP library. Give it depth:
  - typed columns
  - client-side versus server-side mode, with a full server-side example using `manualSorting` and
    `manualPagination` against a mock API with a simulated delay
  - selection and bulk actions
  - row actions
  - empty, loading and error states
  - number and currency alignment
  - responsive stack mode
  - performance guidance with the measured numbers from prompt 04
  - accessibility of sorting announcements
  - Split it into sub-pages if it exceeds a comfortable length, and keep one overview.
- **Table versus DataTable**: when to choose each.
- **Feedback**: a decision guide across Alert, Toast, inline Field errors, EmptyState and dialogs.
  Which to use for which message, with severity wording guidance. Put it on the Feedback category
  overview page, and link to it from each feedback page.
- **Progress versus Meter versus Gauge**: the semantic difference, explained.
- **Toast**: imperative API reference (`toast.success`, …) with every option, the queue behaviour,
  and accessibility (politeness).

## Definition of done

- Every page in scope follows the template and passes `docs-check`.
- Every demo meets STANDARDS §6.
- Every `DOC-*` item owned by 10 is fixed or justified.
- STANDARDS §8 is met, including the browser check.
- Commit as `docs(ui): rewrite data display and feedback component pages`.
