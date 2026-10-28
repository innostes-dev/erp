# 07 – Docs platform: information architecture, building blocks and site features

## Role

You are the lead engineer for the docs site of a mature design system. Before anyone rewrites
content, give the site the structure and reusable building blocks it needs, so prompts 08–14 can
write consistent pages fast. This prompt changes `apps/landing` code, MDX components, `meta.json`
files and the authoring guide. It doesn't rewrite page content beyond what the structure requires.

## Read first

- `STANDARDS.md` (especially §6)
- `PROGRESS.md`
- `AUDIT.md`: the `PLAT-*` items, and the `DOC-*` items owned by 07
- `apps/landing/components/docs/*`, `components/mdx.tsx`, `lib/source.ts`, `app/(docs)/**` and
  `app/(home)/**`
- `content/docs/meta.json`, and the `components/actions/button.mdx` page and its custom demos
  (the current best page)
- the Fumadocs version in `apps/landing/package.json`. Read the bundled docs or types under
  `node_modules/fumadocs-*` instead of guessing APIs.

## Tasks

### 1. Information architecture

Design the sidebar the way a mature system does, and implement it in `meta.json` files.

Suggested shape (adjust it with reasons):

- **Get started**: Introduction, Installation, Framework guides (Next.js, Vite)
- **Foundations**: Theming, Colour, Typography, Spacing and layout, Icons, Motion, Dark mode
- **Accessibility**
- **Components** (by category, each category with an overview page)
- **Widgets**
- **Charts**
- **Patterns**
- **Examples**
- **Resources**: Conventions, Changelog, Versioning and support, Migration guides, Contributing,
  Security, FAQ

Then:

- Create empty-free stubs only where a later prompt will fill them. Each stub must hold real,
  accurate placeholder-free content of at least one paragraph, or not exist yet. No "coming soon".
  List in `PROGRESS.md` which prompt fills which page.
- Every category gets an overview page: a short intro, plus a grid of its components, each with a
  thumbnail or live mini preview, its one-line summary and its status. Generate the grid from page
  frontmatter, so it never goes stale.
- Update the header navigation links in `app/(docs)/ui/docs/layout.tsx` to match.

### 2. Page building blocks

Create MDX components, register them in `components/mdx.tsx`, and document each in `writing-docs.mdx`:

- `<KeyboardTable rows={[[keys, action]]} />`: renders keys with the library's `Kbd`.
- `<DoDont>` with `<Do>` and `<Dont>`: a side-by-side guideline pair, each with an optional live
  preview and a caption. Tokens only, accessible, labelled with text as well as colour.
- `<Anatomy>`: a parts list with `data-slot` names and the nesting.
- `<PropsPlayground component="…" controls={…} />`: generalise the existing `ButtonPlayground`, so
  any component page can offer live prop controls with generated code. Keep it accessible. Migrate
  `ButtonPlayground` onto it.
- `<StatusBadge>` usage in headers, plus a **status legend** page with the meanings from STANDARDS
  §6, linked from every badge.
- `<Since version="…" />` for marking props or components added in a version. You'll use it from
  prompt 15 onwards.
- Make sure `ComponentPreview` shows the demo source from the same file (it must never drift). Check
  it has a "Copy" button, a light/dark toggle per preview if feasible, and a resizable width or
  360px toggle for responsive checks.

### 3. Site features expected of an enterprise docs site

- "Edit this page" link (repository URL from `packages/ui/package.json` `repository`. If that's
  missing, add a constant in `lib/shared.ts` and flag it in `PROGRESS.md`) and "Last updated" from
  git history.
- Previous and next page links, and a table of contents on every page.
- Metadata:
  - title template `<Page> – innostes UI`
  - meta description from frontmatter
  - an Open Graph image per page (generated)
  - canonical URLs
  - `sitemap.xml`
  - `robots.txt`
- A custom `404` page with search and the top links.
- `llms.txt` and `llms-full.txt`, generated from content at build time, following the llms.txt
  convention, so teams using AI assistants get accurate answers.
- The version shown in the header comes from `packages/ui/package.json`, not a hard-coded constant
  (`lib/shared.ts` has `uiVersion = '0.0.1'`).
- Search covers headings and the API tables' prop names.
- Print styles that don't print the navigation.

### 4. Authoring guide

Rewrite `content/dev-docs/guides/writing-docs.mdx` so a new contributor can write a page to standard
without help. Cover:

- the page template
- every MDX building block
- the example data rules
- the demo conventions
- the voice rules, with the banned list summarised and a link to the lint
- how to run `docs-check`

## Definition of done

- The sidebar matches your IA. Category overview pages exist and are generated from frontmatter.
- All the building blocks exist, are documented and are used on at least one page.
- `ButtonPlayground` has been migrated onto `PropsPlayground`.
- The site features work in `build` output. Verify the sitemap, `robots.txt`, OG images, `404`,
  `llms.txt` and the edit links.
- STANDARDS §8 is met.
- Commit as `feat(docs): information architecture, page building blocks and site features`.
