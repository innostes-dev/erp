# 06 – Library: widgets, charts and editor

## Role

Same role as prompt 03. Widgets are composed blocks, so also judge them as a product designer would:
do they solve a real ERP or HRMS dashboard need with sensible defaults? This prompt changes the
**library**. Docs pages come in prompt 12.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`: follow every earlier "Decision"
- `AUDIT.md`: the `LIB-*` items owned by 06
- `packages/ui/CONTRIBUTING.md`
- `03-library-actions-forms.md`, section "Component review checklist". Apply it in full.

## Scope

- `src/widgets/**`: ActionList, ActivityFeed, AppSwitcher, ChangeLog, EntityList, KanbanBoard,
  MetricCard (and `delta.ts`), Notifications, PermissionMatrix, QuickActions, Sparkline, UserMenu,
  WelcomeBanner, WidgetCard
- `src/charts/**`: the cartesian charts, DonutChart and `chart-utils`
- `src/editor/**`: RichTextEditor

## Specific items known to need attention

- **Widgets**:
  - every widget composes the primitives rather than re-implementing them
  - consistent `loading`, `empty` and `error` states (`WidgetCard` defines the pattern; align the
    others with it)
  - consistent `labels` for translation
  - consistent heading levels
  - no raw colours
- **KanbanBoard** (Beta):
  - Native HTML drag and drop doesn't work on touch screens. Decide on a touch strategy (pointer
    events with a long-press drag, or a documented "Move to…" menu on each card) and implement it.
    The keyboard path must stay primary.
  - Verify `canMove`, WIP limits, empty columns, focus after a move, and RTL.
  - Check performance with 500 cards.
- **PermissionMatrix** (Beta):
  - sticky first column and header for wide matrices
  - responsiveness at 360px
  - very long resource names
  - `readOnly`
  - announcements of the mixed state
- **ChangeLog** (Beta): long values, rich values (badges, links) and right-to-left layout.
- **Charts**:
  - the accessible data tables
  - colour-blind-safe default palette (verify the `chart-1…8` tokens are distinguishable under
    deuteranopia and protanopia simulation)
  - the dark theme
  - responsiveness
  - empty data
  - single data point
  - negative values
  - the Recharts 2.15 and 3.x compatibility claimed in the docs
- **RichTextEditor** (Beta):
  - SSR (`immediatelyRender: false`)
  - controlled updates without moving the cursor
  - paste from Word or Google Docs
  - the link form's focus management
  - toolbar keyboard roving
  - `Field` integration (label, description, invalid)
  - character count via an extension
  - the bundle size of the editor entry (measure and record it)

## Definition of done

- Every component in scope passes the checklist, or has a recorded exception.
- Every in-scope `LIB-*` item is fixed or justified.
- API changes are listed.
- Coverage for `src/widgets`, `src/charts` and `src/editor` is at least 90% of lines.
- Bundle sizes for each entry point (gzip) are recorded in `PROGRESS.md`, for prompt 15.
- STANDARDS §8 is met.
- Commit as `fix(ui): harden widgets, charts and editor`.
