# Standards for every agent in this runbook

Read this file in full before you change anything. It overrides your defaults. Where it conflicts with
a prompt, the prompt wins for that task only.

## 1. The bar

The finished library and docs must read as the work of a large, disciplined engineering organisation
that has maintained a design system for years, like Atlassian Design System, IBM Carbon,
Shopify Polaris, GitHub Primer, Radix or Base UI. They must not read as the work of a startup, or as AI-generated.

A reader should find no:

- broken links, dead anchors, missing pages, empty sections or "coming soon"
- demo that differs from the code shown beside it
- statement the code doesn't back up (for example "tested on React 17" when it isn't, or "a changelog
  lists every change" when there's none)
- inconsistency in terminology, spelling, heading case, code style, example data or page structure
  between any two pages
- marketing language, filler, emoji or exclamation marks
- console errors, accessibility violations, layout overflow at 360px, or contrast failures in either
  theme

Your work doesn't count as finished because you made an edit. It counts as finished when you have
verified it (see §8).

## 2. Repository facts

- Nx monorepo with **pnpm**. Always run tasks through Nx, e.g. `pnpm nx test ui`. Check `--help`
  before you use a flag you aren't sure of.
- Windows host. Both a POSIX shell and PowerShell are available.
- **Library**: `packages/ui` (`@innostes/ui`).
  - Its rules are in `packages/ui/CONTRIBUTING.md`, and you must follow them: Base UI primitives where
    one exists, `'use client'` only where needed, tokens only, `className` merged, a `data-slot` on
    every part, `forwardRef`, the `value`/`defaultValue`/`onValueChange` naming, the `sm`/`md`/`lg`
    scale, TSDoc with `@default` on every public prop, and tests.
  - Entry points: `@innostes/ui` (`src/index.ts`), `@innostes/ui/charts` (`src/charts`, needs
    Recharts), `@innostes/ui/editor` (`src/editor`, needs Tiptap 3).
  - Supports React 17, 18 and 19. Never use React 18+ only APIs (`useId`, `useSyncExternalStore`,
    `useTransition`, …). Use `src/lib/use-id.ts` and `src/lib/use-controllable-state.ts`.
  - Internal icons live in `src/lib/icons.tsx`. The library must never import an icon package.
    Docs demos use `lucide-react`.
- **Docs site**: `apps/landing` (Next.js and Fumadocs).
  - UI docs live in `apps/landing/content/docs` and are served at `/ui/docs`.
  - Developer docs (monorepo internals) live in `apps/landing/content/dev-docs` and are served at
    `/docs`. They are a different audience, so don't mix the two.
  - Demos live at `apps/landing/components/demos/<category>/<name>/<variant>.tsx`. A page references a
    demo as `<ComponentPreview name="<category>/<name>/<variant>" />`.
  - `components/demos/registry.ts` is **generated** by `scripts/generate-demo-registry.mjs`. Never edit
    it by hand.
  - The sidebar order comes from each folder's `meta.json`. A page that isn't listed there is invisible.
  - The frontmatter schema is in `apps/landing/lib/source.ts`: `title`, `description`, `icon` (a Lucide
    name), `status` (`Stable` | `Beta` | `Experimental`), `summary` and `install`.
  - MDX components are registered in `apps/landing/components/mdx.tsx`. `<ApiTable components={[…]}
    baseUi="…" />` renders props from `packages/ui/dist/api.json`, which the UI build generates from
    TSDoc. So a wrong API table is fixed in the TSDoc, not in the MDX.
  - The authoring guide is `apps/landing/content/dev-docs/guides/writing-docs.mdx`. Keep it in sync
    with any convention you introduce.
- **React compatibility suites**: `tests/ui-react17` and `tests/ui-react18` run the library's tests
  against the **built** package (`tests/react-compat.config.mts`).

## 3. Commands and verification

| Purpose | Command |
| --- | --- |
| Library tests (React 19) | `pnpm nx test ui` |
| Library types | `pnpm nx typecheck ui` |
| Library build, which writes `dist/api.json` | `pnpm nx build ui` |
| React 17 and 18 suites | `pnpm nx run-many -t test typecheck -p ui-react17-tests ui-react18-tests` |
| Docs types, which also regenerate the demo registry | `pnpm nx typecheck landing` |
| Docs build, which **compiles every MDX page** | `pnpm nx build landing` |
| Docs dev server | `pnpm nx dev landing`, then open http://localhost:3000/ui/docs |
| All docs quality gates (from prompt 02) | `pnpm nx run landing:docs-check` |

`typecheck landing` does **not** compile MDX. Only `build landing` catches MDX errors.

## 4. Known traps (each of these has already bitten this repo)

- **Line endings.** Some files are CRLF and some are LF. Python's text-mode writes and some `sed`
  invocations silently convert a whole file, which turns a one-line change into a full-file diff.
  After you edit, run `git diff --stat`. If a file shows far more changed lines than you touched,
  restore its original endings. Prefer the file-edit tool over shell rewrites.
- **MDX braces.** `{tag}` in prose is evaluated as JavaScript and breaks the page at build time.
  Put such text in code spans (`` `Remove ${tag}` ``).
- **Base UI `format` on Meter and Progress** is applied to the **raw value**, so `value={72}
  format={{ style: 'percent' }}` renders "7,200%". `Gauge` already handles this. Check any other place
  that passes `format`.
- **Tiptap `onCreate`** fires asynchronously. In tests, wait for the editor instance rather than for
  the textbox.
- **The React compat suites** need every dependency that imports `react` to resolve to the suite's own
  React. CommonJS dependencies that require `react` must be installed in the compat project and
  aliased with `fromCompat()`.
- **The test worker can time out on its first cold start** on this machine. Rerun once before you
  debug.
- **`--skip-nx-cache`**: use it for your final verification run, so a cached pass can't hide a failure.

## 5. Writing standard

### Voice

- Plain, precise and calm. Second person ("you"), present tense, active voice.
- Say what something does, when to use it and what to watch out for. No selling.
- Short sentences. One idea per sentence. Lead with the most important fact.
- State facts the code backs. If a behaviour has a limit, say so plainly, e.g. "Native drag and drop
  doesn't work on touch screens."
- Write the way the best existing pages here are written. Model your pages on
  `components/actions/button.mdx` for structure and `widgets/widget-card.mdx` for tone.

### Spelling and style

- **British English** in prose and in TSDoc, matching the existing code comments: colour, behaviour,
  customise, organisation, centre, licence (noun). Code identifiers keep their spelling (`color`,
  `center`).
- **Sentence case** for every heading, title, button label and table header: "Date picker", not
  "Date Picker". Product and component names keep their casing in code spans (`DataTable`). Pick one
  rule for sidebar titles in frontmatter and apply it to every page. Record the choice in
  `writing-docs.mdx`.
- Use the en dash for ranges (0–100), the ellipsis character in UI text ("Saving…") and curly quotes
  in prose.
- Code spans for every identifier, prop, value, file name, CSS variable and keyboard key name in
  tables.
- Numbers: numerals for measurements and counts in technical text ("3 columns", "40px").

### Banned (these are what make docs read as AI-written or as marketing)

Words and phrases: seamless(ly), robust, powerful, effortless(ly), leverage, elevate, unlock,
supercharge, delve, dive into, comprehensive, cutting-edge, state-of-the-art, blazing(ly) fast,
best-in-class, world-class, game-changer, "simply", "just" (meaning "merely"), "easily", "out of the
box" (say "by default"), "under the hood", "it's worth noting", "in this guide we will", "let's",
"Happy coding", "Note that", rhetorical questions, and "flagship" or "beautiful" applied to the
product itself.

Patterns:

- Emoji and exclamation marks.
- Bold labels at the start of every bullet in a list ("**Fast**: …"). Allowed only in a real
  definition list.
- Every paragraph ending in a summary sentence.
- Three-adjective lists.
- Headings like "Overview of X" or "Understanding X".
- Restating the heading in the first sentence.
- Hedging ("may potentially").
- Unexplained "etc."

Prompt 02 adds a lint rule that enforces this list.

### Example data (one fictional universe across every demo, snippet and guide)

- Company: **Northwind Traders Pvt Ltd**, a distributor in Bengaluru. Customers, suppliers and other
  companies come from one fixed list: Acme Traders, Globex Retail, Initech Pvt Ltd, Umbrella
  Logistics, Stark Components, Wayne Foods. Define it once in
  `apps/landing/components/demos/_data/` and import from there in new demos.
- People: realistic Indian names, used consistently (Kavya Reddy, Arjun Mehta, Priya Shah, Rahul
  Verma, Meera Iyer, Sara Khan, Ravi Kumar). Never "John Doe", "Jane", "User 1", "foo", "bar", "test"
  or lorem ipsum.
- Money: INR, formatted with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`
  (₹1,24,500). When a demo shows locale switching, it formats with the selected locale.
- IDs: `INV-2026-0142`, `SO-1042`, `EMP-0231`, `PO-1182`.
- Dates: `en-IN` formatting, in 2026.
- Domain: ERP and HRMS (invoices, purchase orders, employees, leave, payroll, inventory, approvals).

## 6. Page standards

### Component page template (every component page, in this order; omit a section only when it can't apply)

1. Frontmatter: `title`, `description` (one sentence on what it is), `icon`, `status`, and `summary`
   (one sentence on what you'd use it for).
2. A lead `<ComponentPreview>` showing the most common real use. Not a bare default.
3. `## Import`, with the exact entry point.
4. `## When to use`, with **When not to use** inside it. Name the alternative component and link it.
   For example: Select vs Combobox vs Searchable Select vs Radio Group.
5. `## Anatomy`, for components with parts: the exported parts, how they nest, and each part's
   `data-slot`.
6. `## Examples`: one `###` per real scenario, each with a live demo **and** its exact source. Cover
   the props people need: variants, sizes, states (loading, empty, error, disabled, read-only),
   controlled use, form integration, and composition with other components.
7. `## Accessibility`: what it renders (roles), what you must provide (labels), a **keyboard table**
   when it handles keys, and known limits.
8. `## Guidelines`: do and don't, with short reasons. Content guidance (label wording, truncation,
   empty text).
9. `## API reference`: `<ApiTable>` for every exported part, with `baseUi` set when it wraps Base UI.
10. `## Related`: two to four linked components or guides.

### Demos

- Every demo compiles, uses only the public entry points, follows §5's example data, works at 360px
  wide, and looks correct in light and dark themes.
- The code shown is the code that runs. Never hand-write a snippet that differs from the demo.
- One concept per demo. Name the files by what they show (`controlled.tsx`, `with-validation.tsx`),
  not `demo2.tsx`.

### Status meanings (define them once on a public page and apply them consistently)

- **Stable**: the API is covered by semantic versioning, fully documented and tested.
- **Beta**: usable in production; the API may change in a minor release with a migration note.
- **Experimental**: may change or be removed at any time.

A component is Stable only if it meets the page template in full, has tests covering its documented
behaviour, and passes browser QA.

## 7. Engineering rules

- Fix root causes. Never weaken a test, gate, type or lint rule to get green. If a gate is wrong, fix
  the gate and explain why in `PROGRESS.md`.
- A **public API change** (renamed or removed prop, changed default or behaviour) is allowed only to
  fix a real defect or an inconsistency with the conventions. Record it in `PROGRESS.md` under
  "API changes", and in `CHANGELOG.md` once prompt 15 has created it.
- Don't add runtime dependencies to `@innostes/ui` without a written reason in `PROGRESS.md`. Docs
  tooling (dev dependencies) is fine.
- Keep diffs focused on your prompt's scope. If you find a defect outside your scope, add it to
  `AUDIT.md` with an ID and the area it belongs to. Don't fix it unless it blocks you.
- No comments explaining *what* code does. Only short ones that explain a non-obvious *why*.
- Work on the branch `docs/enterprise-overhaul`; prompt 01 creates it. Commit at the end of your
  prompt with a conventional commit message such as `docs(ui): rewrite form component pages to page
  standard`. Never push, rewrite history or force-anything.

## 8. Definition of done (applies to every prompt, in addition to its own)

1. Every task in your prompt is done, or is listed in `PROGRESS.md` as open, with the reason and
   whether it is **blocking**.
2. Every `AUDIT.md` item in your scope is marked fixed, with the commit, or justified as won't-fix.
3. These pass, run uncached at the end:
   - `pnpm nx run-many -t test typecheck build -p ui --skip-nx-cache`
   - `pnpm nx run-many -t test typecheck -p ui-react17-tests ui-react18-tests --skip-nx-cache`
   - `pnpm nx build landing --skip-nx-cache`
   - `pnpm nx run landing:docs-check` (once it exists)
4. For docs or UI changes, you opened the changed pages in the dev server, checked light and dark
   themes at 1280px and 360px wide, and saw no console errors. If you can't run a browser, say so in
   `PROGRESS.md`. Never claim it.
5. `git diff --stat` shows no accidental line-ending rewrites.
6. You appended your entry to `PROGRESS.md` (format below) and committed.

### `PROGRESS.md` entry format

```markdown
## NN – <prompt title> – <date>

**Summary**: 2–4 sentences.
**Changed**: bullet list of areas and key files.
**API changes**: none | list (old → new, reason).
**Decisions**: conventions you set that later agents must follow.
**Verification**: commands run and their results; what you checked in the browser.
**Open issues**: each marked blocking or non-blocking, with the AUDIT ID.
```
