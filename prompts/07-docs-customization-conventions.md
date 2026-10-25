# Prompt 7 — Docs: Customization conventions page

## Context
`apps/landing/content/docs/conventions.mdx` **already exists** — read it first. This is an
**update**, not a from-scratch page. Several customization mechanisms were added/expanded during
this phase and the conventions page needs to reflect all of them clearly, since this is the page
developers will read to understand "how do I actually customize this library."

The five mechanisms that must each get a clear, example-backed subsection:
1. **Design tokens** — CSS custom properties in `packages/ui/tailwind/theme.css`/`dark.css`
   (colors, the fluid type scale `--text-display/heading/subheading/metric`, the `chart-1..8`
   palette, the `--color-sidebar*` set). Overriding a token re-themes every component that uses
   it, automatically, in both light and dark mode.
2. **CSS variables for sizing** — not a token (not semantic), just a dimension: `--sidebar-width`,
   `--sidebar-width-icon`, `--sidebar-width-mobile`, `--app-rail-width`, `--top-bar-height`. Show
   how these are set (usually via a component prop like `SidebarProvider`'s `width`, which writes
   the var inline) vs. overridden globally in CSS.
3. **`className`** — plain Tailwind/CSS escape hatch on the component's root element, works like
   any React component.
4. **`classNames` (plural) / `SlotClassNames<Slot>`** — the multi-part override prop
   (`lib/slots.ts`). Explain: every styled element also carries a `data-slot` attribute as a
   plain-CSS hook even without using this prop; `classNames` values are always merged LAST so they
   win over internal defaults via Tailwind's conflict resolution. List which components currently
   support it (grep `src` for `classNames?:` to get the authoritative list — don't rely on memory,
   it has grown this phase: at least `MetricCard`, `WidgetCard`, `PageHeader`, `EmptyState`,
   `Stepper`, `DataTable`, `CommandPalette`, `AppSwitcher`, `NotificationList`/`NotificationBell`).
5. **`render` prop (polymorphism)** — via Base UI's `useRender`/`mergeProps`, for swapping the
   underlying element/component entirely (e.g. rendering a nav item as Next.js `<Link>` instead of
   `<a>`) while keeping the component's own behavior/ARIA intact.

Also document the two responsiveness mechanisms added this phase, since "customization" and
"responsiveness" are closely related asks from the project owner:
6. **Fluid typography** — `clamp()`-based type tokens instead of fixed sizes.
7. **Container queries** — `@container`/`@max-*`/`@md:` etc. used for component-level (not
   viewport-level) responsiveness, e.g. `DataTable`'s `responsive="stack"` mode, `Stepper`
   collapsing labels, `WelcomeBanner` hiding its illustration — explain WHY container queries are
   used instead of viewport breakpoints here (because these components can live inside a
   sidebar-width panel, not just full-width).

## Task
1. Read the current `conventions.mdx` in full.
2. Rewrite/extend it so all 7 items above are covered with a short code example each (prefer
   real, runnable snippets — pull exact prop names from source, don't invent syntax).
3. Cross-link it from the new component pages written in prompts 4-6 ("see Conventions for the
   full customization model") rather than repeating this content on every page.
4. If `conventions.mdx` isn't yet linked prominently from the root nav/landing `/ui` page, make
   sure it is — this is meant to be a first-stop page for new developers.

## Definition of done
- [ ] All 7 mechanisms documented with accurate, working code examples.
- [ ] The list of components supporting `classNames` is verified against a real grep of
      `packages/ui/src`, not recalled from memory.
- [ ] Pages from prompts 4-6 link back here instead of duplicating the explanation.
- [ ] `pnpm nx run-many -t build typecheck -p landing` passes.
- [ ] Nothing is committed.
