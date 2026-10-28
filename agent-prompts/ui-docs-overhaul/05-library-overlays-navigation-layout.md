# 05 – Library: overlays, navigation and layout

## Role

Same role as prompt 03: a senior design-system engineer who owns the correctness of these components.
This prompt changes the **library**. Docs pages come in prompt 11.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`: follow every earlier "Decision"
- `AUDIT.md`: the `LIB-*` items owned by 05
- `packages/ui/CONTRIBUTING.md`
- `03-library-actions-forms.md`, section "Component review checklist". Apply it in full.

## Scope

- `src/components/overlays/**`: AlertDialog, CommandPalette, ContextMenu, Dialog, DropdownMenu,
  Popover, Sheet, Tooltip
- `src/components/navigation/**`: Accordion, Breadcrumb, Collapsible, Pagination (and
  `usePagination`), Stepper, Tabs
- `src/components/layout/**`: AppRail, FormLayout, PageHeader, ScrollArea, Separator, Sidebar,
  SplitPane, TopBar

## Specific items known to need attention

- **Overlays**:
  - focus trap and focus return
  - `Escape` handling when overlays are nested (a dialog containing a select or a popover)
  - scroll lock without a layout shift
  - portal stacking (z-index scale defined once, as tokens)
  - the `isolation: isolate` advice in installation
  - initial focus
  - mobile `Sheet` behaviour
  - AlertDialog requiring an explicit choice
  - CommandPalette:
    - keyboard shortcut registration and cleanup
    - grouping
    - empty state
    - async results
    - announcements
- **Sidebar, AppRail, TopBar** form the app shell. Verify:
  - collapse states and persistence
  - mobile off-canvas behaviour
  - active-item semantics (`aria-current="page"`)
  - keyboard reachability
  - skip-link support: if the shell lacks a "Skip to content" mechanism, add one
  - RTL mirroring
  - CSS variable sizing documented in TSDoc
- **SplitPane** is new (Beta). Verify:
  - pointer capture
  - RTL
  - nested split panes
  - behaviour inside a resizing container
  - Decide whether a collapsed state and persistence callbacks are needed for master-detail ERP
    screens. Implement them if they are, with tests.
- **Pagination and Stepper**: verify the container-query responsiveness and the labels for
  translation.

## Definition of done

- Every component in scope passes the checklist, or has a recorded exception.
- Every in-scope `LIB-*` item is fixed or justified.
- API changes are listed.
- Coverage for these folders is at least 90% of lines.
- STANDARDS §8 is met.
- Commit as `fix(ui): harden overlay, navigation and layout components`.
