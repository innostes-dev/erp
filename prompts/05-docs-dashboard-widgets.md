# Prompt 5 — Docs: dashboard widgets

## Context
Same Fumadocs conventions as [04-docs-sidebar-appshell.md](04-docs-sidebar-appshell.md) (page at
`content/docs/widgets/<name>.mdx`, demo at `components/demos/widgets/<name>/basic.tsx`, add to
`content/docs/widgets/meta.json`, `<ComponentPreview>` + `<ApiTable>`). `content/docs/widgets/`
already has `metric-card.mdx`, `sparkline.mdx`, `widget-card.mdx` — match their tone and depth.

## Task — write these pages

1. **`content/docs/widgets/entity-list.mdx`** — `EntityList` (avatar/initials, title, subtitle,
   meta, clickable rows via `onItemClick`, `emptyText`). Demo: a "Birthdays this week"-style list
   like the HRMS reference screenshot.

2. **`content/docs/widgets/activity-feed.mdx`** — `ActivityFeed` (`groupByDay`, `locale`, items
   with `time`). Explain the day-grouping behavior (Today/Yesterday/date headings) and that times
   render as real `<time datetime>` elements for accessibility/SEO. Demo with a realistic mixed
   feed (new employee joined, document uploaded, leave approved, etc.).

3. **`content/docs/widgets/action-list.mdx`** — `ActionList` (items with an `action` that is
   either `{ label, onClick }` or `{ label, href }`, rendering a button or a link accordingly).
   Demo: "Approve leave" (button) + "Onboarding" (link) side by side.

4. **`content/docs/widgets/welcome-banner.mdx`** — `WelcomeBanner` (`eyebrow`, `title`, `quote`,
   optional illustration). Mention the container-query behavior: illustration/quote hide on
   narrow containers (so it looks right embedded in a narrower dashboard column, not just full
   width).

5. **`content/docs/widgets/quick-actions.mdx`** — `QuickActions` (shortcut tiles, each either a
   link via `href` or a button via `onClick`, with `icon` + `label`). Demo: "New invoice", "Add
   employee", etc., matching the HRMS reference tiles.

6. For each page, include a short "Customization" subsection showing the `classNames` prop in use
   (pick one real slot per component) since every widget in this phase supports it — this doesn't
   need to be exhaustive, just prove it works with one example per page.

7. Update `content/docs/widgets/meta.json` to include all 5 new pages in a sensible order (e.g.
   alongside the other widgets alphabetically, or grouped as "dashboard" widgets if the file
   supports section headers like the top-level nav does).

## Definition of done
- [ ] All 5 pages exist, describe real current props, and each has at least one working demo.
- [ ] Each page's `classNames` customization example actually changes the rendered output
      (verify visually in the running dev server, not just that it compiles).
- [ ] `content/docs/widgets/meta.json` updated.
- [ ] `<ApiTable>` resolves correctly for each (regenerate `dist/api.json` if stale).
- [ ] `pnpm nx run-many -t build typecheck -p landing` passes.
- [ ] Nothing is committed.
