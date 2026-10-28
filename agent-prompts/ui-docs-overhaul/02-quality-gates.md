# 02 – Quality gates

## Role

You are the staff engineer responsible for docs infrastructure. Turn the audit's mechanical findings
into automated checks, so that no later change can bring those defects back. Gates are the objective
definition of done for every later prompt.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md`, `apps/landing/scripts/generate-demo-registry.mjs`,
`apps/landing/lib/source.ts`, `packages/ui/scripts/generate-api-docs.mjs`, and the CI workflows under
`.github/workflows/` (check whether that folder exists).

## Objective

Add an Nx target `docs-check` (`pnpm nx run landing:docs-check`) that runs fast, deterministic checks over the
docs content and the library's public surface. Wire it into CI. Each check prints every violation with
its file and line, then exits non-zero.

Use Node scripts with no network access. Put them in `apps/landing/scripts/checks/`. Prefer the
dependencies already in the workspace.

## Checks to build

1. **Links**: every internal link and `#anchor` in `content/docs` and `content/dev-docs` resolves
   to an existing page and heading. Use the slug algorithm Fumadocs uses; read it, don't
   approximate it. External links are checked for syntax only.
2. **Coverage**: every symbol exported from `@innostes/ui`, `@innostes/ui/charts` and
   `@innostes/ui/editor` is either named in some page's `<ApiTable components>`, or listed in an
   explicit allowlist file (`docs-coverage-allowlist.json`) with a reason. Use this for helpers such
   as `cn` that are documented in prose.
3. **API tables**: every name in `<ApiTable components>` exists in `packages/ui/dist/api.json`, with
   at least one prop. Every prop in `api.json` has a description. A prop with a default declared in
   code has `@default`, where docgen can tell.
4. **Demos**:
   - every `ComponentPreview name` resolves to a demo file
   - every demo file is referenced by at least one page
   - demos import only from `@innostes/ui`, `@innostes/ui/charts`, `@innostes/ui/editor`, `react`,
     `lucide-react` and `components/demos/_data`
5. **Frontmatter**:
   - every component, widget and chart page has `title`, `description`, `icon`, `status` and
     `summary`
   - `icon` is a valid Lucide name
   - `description` is one sentence ending with a full stop
6. **Sidebar**: every page is listed in its folder's `meta.json`, and every `meta.json` entry exists.
7. **Template**: every page with `status` (that is, component pages) contains these `##` headings in
   this order: Import, When to use, Examples, Accessibility, Guidelines, API reference, Related.
   Anatomy is optional, after When to use. Headings use sentence case. Agents will make pages pass
   this in prompts 09–12. Until then it runs in **report mode** (it lists violations and exits 0),
   switched by a flag in the target config. Prompt 12 switches it to enforce.
8. **Prose lint**:
   - the banned words and patterns in STANDARDS §5
   - American spellings from a list you build (color→colour in prose only, behavior, customize,
     organization, center, gray)
   - emoji and exclamation marks
   - "John Doe" and similar placeholder data

   Ignore code spans, code blocks, JSX attributes and identifiers. False positives must be fixable
   with a narrow inline ignore (`{/* prose-ignore: reason */}`) that requires a reason. **Enforce**
   mode for banned words, emoji and placeholders. **Report** mode for spelling until prompt 17
   switches it.
9. **MDX safety**: catch unescaped `{` `}` and `<` in prose before the Next build does. Make the
   message point at the line and suggest a code span.
10. **Consistency**: the version string shown in the docs header equals `packages/ui/package.json`'s
    `version`. Any component count stated in the docs ("45+ components") matches the real count, or
    is removed.

## Also do

- An Nx target `docs-check` on the `landing` project. It depends on `ui:build`, because it reads
  `api.json`. Add a short `README.md` in `scripts/checks/`. It explains each check, report versus
  enforce mode, and how to add an allowlist or ignore entry with a reason.
- Add `docs-check` to CI next to the existing lint, test and build jobs. Follow the existing workflow
  style.
- Document the gates in `content/dev-docs/guides/writing-docs.mdx`.
- Run the gates. Fix only what is cheap and clearly mechanical, in your own scope: the 13 dashboard
  links, a missing `meta.json` entry, a missing full stop. Record everything else in `AUDIT.md`
  under its existing ID, or add new IDs.

## Rules

- Never make a gate pass by loosening it. Every allowlist entry needs a reason string.
- Checks must run in under 30 seconds on this repo, excluding the UI build.

## Definition of done

`pnpm nx run landing:docs-check` exists, runs in CI and is documented. Enforced checks pass. Report-mode checks
print their current counts, and you record those counts in `PROGRESS.md` so later prompts can show
they reached zero. STANDARDS §8 is met.
