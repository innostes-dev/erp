# 12 – Pages: widgets, charts and editor (plus the missing pages)

## Role

Same role as prompt 09.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`
- `AUDIT.md`: the `DOC-*` items owned by 12
- `writing-docs.mdx`
- `09-pages-actions-forms.md`, section "Page procedure". Follow it exactly.
- the source and tests of each widget, chart and the editor

## Scope

- `content/docs/widgets/*` and the widget demos. **Create the missing pages**: ActivityFeed,
  EntityList, QuickActions, WelcomeBanner and ActionList. Make sure Notifications and
  NotificationBell are named consistently between code and docs.
- `content/docs/charts/*`: bring them to the template, with frontmatter (`icon`, `status`,
  `summary`) and the house voice. Add one page per chart type if the cartesian page covers several
  types with different guidance.
- `content/docs/components/forms/rich-text-editor.mdx` and its demos.

## Content you must cover in this scope

- **Widgets overview**: what a widget is (a composed block with data states) versus a component, the
  shared `loading`/`empty`/`error` contract, and how to compose your own widget with `WidgetCard`.
- **Each widget**: a realistic dashboard example in the Northwind universe. Show its data-fetching
  states with a mock async source.
- **KanbanBoard**: the move contract (`onValueChange`, `KanbanMove`, `canMove`), optimistic updates
  with rollback on server failure, the touch strategy implemented in prompt 06, and the full keyboard
  table.
- **PermissionMatrix**: the value format, persisting to an API, read-only system roles, and large
  matrices.
- **Charts**:
  - choosing a chart type
  - the accessibility model (the hidden data table, and the `aria-label` requirement)
  - colour and palette guidance
  - Recharts version guidance for React 17
  - empty and loading states inside `WidgetCard`
  - formatting values in `en-IN`
- **RichTextEditor**: installation of the peer dependencies, the value format, storing and rendering
  the HTML safely (sanitising on the server), adding extensions (character count, mentions),
  `Field` integration, and read-only display.

## After all component pages are done (prompts 09–12)

- Switch the `docs-check` template rule from report to **enforce** mode. Fix whatever it flags across
  all component pages, including the ones from prompts 09–11.
- Make sure every exported symbol is covered, so the coverage check passes with the allowlist
  containing only true helpers.

## Definition of done

- The missing widget pages exist.
- Every page in scope follows the template.
- The template rule is enforced and passes across all component pages.
- Every `DOC-*` item owned by 12 is fixed or justified.
- STANDARDS §8 is met, including the browser check.
- Commit as `docs(ui): widget, chart and editor pages; enforce page template`.
