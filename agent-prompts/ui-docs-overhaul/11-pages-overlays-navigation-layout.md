# 11 – Component pages: overlays, navigation and layout

## Role

Same role as prompt 09.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`
- `AUDIT.md`: the `DOC-*` items owned by 11
- `writing-docs.mdx`
- `09-pages-actions-forms.md`, section "Page procedure". Follow it exactly.
- the source and tests of each component

## Scope

Pages and demos for:

- `components/overlays/*`: AlertDialog, CommandPalette, ContextMenu, Dialog, DropdownMenu, Popover,
  Sheet, Tooltip
- `components/navigation/*`: Accordion, Breadcrumb, Collapsible, Pagination, Stepper, Tabs
- `components/layout/*`: AppRail, FormLayout, PageHeader, ScrollArea, Separator, Sidebar, SplitPane,
  TopBar

## Content you must cover in this scope

- **An overlay decision guide** on the Overlays overview page: Dialog versus AlertDialog versus
  Sheet versus Popover versus Tooltip versus DropdownMenu. When to use each, and the rules for
  nesting, focus and mobile.
- **Dialog**:
  - forms inside dialogs (submit, validation, preventing close while saving)
  - confirming that unsaved changes will be discarded
  - controlled opening from a DataTable row action
- **Sheet**: a detail panel on mobile versus `SplitPane` on desktop. Show the responsive pattern.
- **CommandPalette**: registering global shortcuts, grouping, async search, and recent items.
- **App shell** (Sidebar, AppRail, TopBar, PageHeader): one page or section that shows how they
  compose into a full layout, with the CSS variables for sizing, mobile behaviour, the skip link,
  and router integration (Next.js `Link` via `render`).
- **Separator, ScrollArea, Collapsible**: currently stub pages. Bring them to the template with real
  scenarios. Short is fine; thin isn't.

## Definition of done

- Every page in scope follows the template and passes `docs-check`.
- Every demo meets STANDARDS §6.
- Every `DOC-*` item owned by 11 is fixed or justified.
- STANDARDS §8 is met, including the browser check.
- Commit as `docs(ui): rewrite overlay, navigation and layout component pages`.
