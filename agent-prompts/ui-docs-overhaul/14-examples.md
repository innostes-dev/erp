# 14 – Examples: full-page reference screens

## Role

You are a senior product engineer. Build the reference screens that show what the library can
produce at its best. Evaluators judge the whole library by these pages, so each must look and behave
like a shipped enterprise product.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`
- `AUDIT.md`: the `DOC-*` items owned by 14
- `content/docs/examples/*` and `components/demos/examples/*` (the existing Dashboard and
  Setup Wizard)
- the pattern guides from prompt 13, which each example should follow

## Tasks

1. **Fix and finish the existing examples.** Dashboard: fix every link, and use only public APIs.
   Setup Wizard: bring its page to the same standard.
2. **Add these examples**, each a complete, responsive, accessible page in the Northwind universe:
   - **Invoice list**: DataTable with filters, search, status badges, bulk actions and pagination.
   - **Invoice detail**: PageHeader with actions, summary cards, a line-items table, ChangeLog, and
     a confirm dialog for "Mark as paid".
   - **Employee directory with profile**: master-detail with SplitPane, Sheet on mobile, TreeView of
     departments.
   - **Settings**: FormLayout sections, Switches, Selects, a save bar, unsaved-changes handling.
   - **Roles and permissions**: PermissionMatrix with a role list.
   - **Hiring pipeline**: KanbanBoard with candidate details in a Sheet.
3. **Each example page**:
   - a live full-width preview
   - "What's in it" (a linked table of the components used)
   - responsive behaviour notes
   - an accessibility notes section
   - the full source, copyable
4. **Gallery.** The Examples overview page shows a screenshot or live thumbnail grid of all
   examples.

## Rules

- Examples use mock data modules in `components/demos/_data/`, and mock async functions with a
  realistic delay, so the loading states appear. No network calls.
- No private or internal imports. If an example needs something the library doesn't offer, either
  compose it from public parts or add an `AUDIT.md` item. Never use hidden internals.
- Check every example at 1440px, 1024px, 768px and 360px, in light and dark themes, with the
  keyboard only, and with no console errors.

## Definition of done

- The six new examples are done, plus the two existing ones fixed.
- The gallery page is done.
- Every example has been checked as above, and the checks are recorded.
- `docs-check` passes.
- STANDARDS §8 is met.
- Commit as `docs(ui): reference example screens`.
