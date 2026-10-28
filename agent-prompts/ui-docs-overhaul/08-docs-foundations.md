# 08 – Foundations and getting started

## Role

You are the principal technical writer for the design system, working with its lead engineer. You
write the pages an enterprise evaluator reads first: they decide whether the library is trustworthy.
Every sentence must be accurate, specific and verifiable against the code.

## Read first

- `STANDARDS.md` (§5 voice is critical here)
- `PROGRESS.md`, especially the IA and building blocks from prompt 07
- `AUDIT.md`: the `DOC-*` items owned by 08
- `packages/ui/tailwind/theme.css`, `dark.css`, `tailwind.css` and `styles.css`
- `packages/ui/package.json`
- the current `index.mdx`, `installation.mdx`, `theming.mdx` and `conventions.mdx`

## Pages to write (rewrite fully; keep URLs stable or add redirects)

1. **Introduction** (`index.mdx`):
   - what the library is
   - who it's for (teams building admin and ERP interfaces)
   - what it's built on (Base UI, Tailwind tokens)
   - the guarantees, each linked to its policy page: accessibility target, supported React versions,
     semantic versioning, licence
   - a live hero example
   - how to choose between the components, widgets and charts entry points
   - a generated component index: no hand-written list that can go stale
2. **Installation**:
   - requirements (exact versions)
   - package manager tabs
   - styles with and without Tailwind
   - providers
   - the optional peer dependencies per entry point (Recharts for charts, with the React 17 guidance;
     Tiptap for the editor)
   - verification ("you should see…")
   - troubleshooting: duplicate React, styles not applied, popups behind content, SSR hydration
     warnings
3. **Framework guides**: Next.js App Router (Server Components, `'use client'` boundaries,
   `next-themes`) and Vite. Each guide is a complete working setup, tested by creating a scratch app
   in a temp directory and building it. Delete the scratch app afterwards, and record the result.
4. **Theming**:
   - how tokens work
   - overriding them
   - scoped themes
   - white-label and per-tenant theming
   - creating a brand theme
   - The **token reference must be generated** from `theme.css` and `dark.css` at build time, showing
     the light value, the dark value and a swatch, and grouped by role. No hand-written table.
5. **Dark mode**:
   - how to enable it
   - the class or `data-theme` strategy
   - `next-themes`
   - avoiding a flash of the wrong theme
   - how to test it
6. **Foundations**:
   - **Colour**: semantic roles, plus the verified contrast table (compute contrast ratios at build
     time, and show AA pass or fail for both themes).
   - **Typography**: the scale, the fluid type tokens and when to use each.
   - **Spacing and layout**: the spacing scale, density, container queries.
   - **Icons**: `lucide-react` is recommended. Cover sizing inside components, `aria-hidden`, and
     icon-only buttons.
   - **Motion**: durations, `prefers-reduced-motion` behaviour (verify the components respect it;
     if they don't, add an `AUDIT.md` item for the right library prompt).
7. **Accessibility statement**:
   - the conformance target (WCAG 2.2 AA)
   - what the library guarantees, and what the application team must still do
   - testing methods (automated tests, and the browser crawl from prompt 16)
   - the screen-reader and browser combinations tested. Only list what is actually tested;
     otherwise state the plan honestly.
   - known issues, linked to `AUDIT.md` items once they are public issues
   - how to report a problem
8. **Conventions**:
   - rewrite it without the duplication: composition, controlled and uncontrolled, events
     (`eventDetails`), styling (`className`, `classNames`, `data-slot`, state attributes, variant
     helpers), `render`, refs, Server Components, sizes, labels and internationalisation, RTL
   - The list of components that support `classNames` must be generated, or removed in favour of
     each API table.
   - No repo-internal paths.

## Rules

- Every code block must be complete and correct. Copy-paste it into a scratch file and typecheck it,
  or derive it from a tested demo.
- Every claim about behaviour must be checked in code or tests. If it isn't true yet, don't write
  it. Add an `AUDIT.md` item instead.
- Don't write the changelog, versioning, security or support pages here. Prompt 15 does those; link
  to their URLs from the IA.

## Definition of done

- All the pages above meet the voice and accuracy rules.
- The generated token and contrast tables render correctly in both themes.
- The framework guides have been verified with real scratch builds (recorded in `PROGRESS.md`).
- `docs-check` passes.
- STANDARDS §8 is met.
- Commit as `docs(ui): rewrite getting started, foundations and accessibility`.
