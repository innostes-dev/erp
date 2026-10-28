# 13 – Patterns and guides

## Role

You are a staff engineer who has built many ERP and HRMS products. Component pages say what each
piece does. You write the **task-oriented** guides that show how to build real screens correctly
with the library. This is the section that makes enterprise teams productive.

## Read first

- `STANDARDS.md`
- `PROGRESS.md`
- `AUDIT.md`: the `DOC-*` items owned by 13
- `writing-docs.mdx`
- the component pages written in prompts 09–12, so you link to them rather than repeat them

## Guides to write (under Patterns in the IA from prompt 07)

Each guide covers:

- the problem
- the recommended approach and why
- a complete, working example with a live demo where feasible
- accessibility notes
- common mistakes
- links to the components it uses

Every example is in the Northwind universe (STANDARDS §5) and is derived from code you have run.

1. **Forms and validation**:
   - client and server validation
   - integration recipes for React Hook Form with Zod, and for Next.js Server Actions
   - showing server errors on fields
   - dirty-state warnings
   - multi-step forms with `Stepper`
   - Verify every recipe in a scratch app. If you add libraries, add them only to the docs app or the
     scratch app, never to `@innostes/ui`.
2. **Data tables backed by an API**: server pagination, sorting, filtering and search with URL
   state, debounced search, loading skeletons, empty versus no-results states, and bulk actions with
   confirmation.
3. **Create, edit and delete flows**: list → detail → edit, optimistic updates, confirming
   destructive actions, toasts versus inline feedback, and undo.
4. **Master-detail screens**: `SplitPane` on desktop, `Sheet` on mobile, keeping the selection in
   the URL, and keyboard flow between the list and the detail.
5. **Dashboards**: the layout grid with `MetricCard`, `WidgetCard` and charts, data states per
   widget, refresh, and date-range filters.
6. **Permissions and roles**: `PermissionMatrix`, hiding versus disabling unauthorised actions,
   and explaining why something is disabled.
7. **Internationalisation and right-to-left**: the `locale` props, `labels` overrides (with a full
   list of components that take `labels`, generated or verified), number, currency and date
   formatting, RTL setup with `dir="rtl"`, and testing RTL.
8. **Theming for multiple tenants**: per-tenant brand tokens at runtime, contrast safety (validating
   tenant colours against AA), and dark mode per tenant.
9. **Testing your app**: Testing Library queries that work with the components (roles and names),
   portals in tests, the jsdom polyfills needed (from `packages/ui/src/test/setup.ts`), and
   Playwright tips.
10. **Performance**: tree-shaking, the separate entry points, measured bundle sizes (from prompts 06
    and 15), large lists, and avoiding re-renders in controlled components.
11. **Migrating from another library**: a mapping table from shadcn/ui and MUI component names and
    props to this library's. Verify every mapping against the real APIs; drop any you can't verify.

## Definition of done

- All the guides exist, follow the voice rules, compile, and their examples run (verified in the dev
  server or a scratch app, and recorded).
- They're linked from the relevant component pages' **Related** sections.
- `docs-check` passes.
- STANDARDS §8 is met.
- Commit as `docs(ui): add pattern guides for enterprise screens`.
