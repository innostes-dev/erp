# 01 – Audit (find everything, fix nothing)

## Role

You are a principal engineer who has run design-system programmes at a large enterprise. You're doing
an adoption review of `@innostes/ui` and its docs. Your job is to find **every** defect, gap and
inconsistency, and write them down so precisely that another engineer can fix each one without asking
you anything.

## Read first

- `agent-prompts/ui-docs-overhaul/STANDARDS.md`, in full. It is the bar you audit against.
- `agent-prompts/ui-docs-overhaul/PROGRESS.md`. Its seed notes are leads to verify, not conclusions.
- `packages/ui/CONTRIBUTING.md`, `packages/ui/README.md`,
  `apps/landing/content/dev-docs/guides/writing-docs.mdx` and
  `apps/landing/content/dev-docs/packages/ui.mdx`.

## Setup

1. Run `git status`. If there are uncommitted changes you didn't make, stop, and write in `PROGRESS.md`
   that the user must commit them first.
2. Create and switch to the branch `docs/enterprise-overhaul`.
3. Run the full verification in STANDARDS §8.3, except `docs-check`, which doesn't exist yet. Record
   the baseline results. A failing baseline is itself a finding.

## What to audit

Read every file in scope. Don't sample.

### A. Library (`packages/ui/src`, every component, widget, chart and editor file)

For each public component:

- Does it follow every rule in `CONTRIBUTING.md`?
- Is the API consistent with its siblings (prop names, size scale, callback names, `classNames`
  slots, `labels` for translatable text)?
- Does every public prop have accurate TSDoc with `@default`?
- Is there any hard-coded English text that isn't overridable?
- Are there raw colours?
- Is right-to-left handled?
- Is there any React 18+ only API?
- Are there bugs, including edge cases (empty data, very long text, 0 and negative numbers, disabled,
  controlled-but-not-updated)?
- Does the a11y match the WAI-ARIA pattern?
- Do the tests cover the documented behaviour?

Also cover:

- The exports in `src/index.ts`, `src/charts/index.ts`, `src/editor/index.ts` and each category
  `index.ts`.
- `package.json` metadata: `repository`, `homepage`, `bugs`, `license` file, `sideEffects`, `exports`
  and `peerDependencies`.
- `tailwind/*.css` tokens: contrast of every foreground/background token pair in light and dark,
  against WCAG 2.2 AA. Compute it; don't guess.

### B. Docs content (`apps/landing/content/docs`, every page)

For each page:

- Its structure against the component page template (STANDARDS §6).
- Missing sections.
- Claims the code doesn't back.
- Snippets that wouldn't compile, or that differ from the demo.
- Wrong prop names.
- Banned phrases, spelling, heading case.
- Example data that breaks STANDARDS §5.
- Frontmatter completeness.
- Status that doesn't match reality.

Across pages:

- **Coverage**: every exported component or helper has a docs page, or is deliberately covered on a
  parent's page.
- Every page is in its `meta.json`.
- Every demo file is used by a page, and every `ComponentPreview` name exists.
- Every `ApiTable` name exists in `dist/api.json` and has props.
- Every internal link and `#anchor` resolves. Write a throwaway script for this; don't eyeball it.

### C. Docs platform (`apps/landing`, outside content)

- Page template components, header, sidebar and search.
- Metadata: title template, description, Open Graph image, canonical URL, `sitemap`, `robots`, `404`.
- Dark mode, the theme switcher, mobile navigation and the copy buttons.
- Any feature a mature docs site has that this one lacks: edit link, last updated, status legend,
  version label policy, `llms.txt`, feedback.

### D. Developer docs (`content/dev-docs`)

Accuracy only, against the current repo: commands, paths and the package structure (including the new
`editor` entry and compat-suite changes).

## Deliverable: `agent-prompts/ui-docs-overhaul/AUDIT.md`

Structure it like this:

```markdown
# Audit – <date>

## Baseline
<results of the verification commands>

## Summary
<counts by area and severity; the five most damaging problems for an enterprise evaluator>

## Findings
| ID | Severity | Area | Location | Finding | Fix | Owner prompt |
```

- **IDs**: `LIB-001`, `DOC-001`, `PLAT-001`, `DEV-001`, …, stable and never reused.
- **Severity**:
  - `S1`: broken or wrong (an incorrect claim, a bug, a broken link, an a11y failure, or a build or
    test failure).
  - `S2`: missing (a missing page, section, test or policy).
  - `S3`: inconsistency or polish.
- **Location**: the file path, and the line where useful.
- **Fix**: the concrete change, not "improve X".
- **Owner prompt**: the number of the prompt in this runbook whose scope covers it (see README).

Aim for completeness over brevity. A typical result for this codebase is several hundred findings. Group
repeated issues into one row per file only when the fix is identical, and list every location.

Also add a **Coverage matrix** section: one row per exported symbol, with columns for docs page, demo,
API table, tests and status.

## Rules

- Change no source or docs files in this prompt. You only write `AUDIT.md` and the `PROGRESS.md` entry,
  plus any throwaway scripts, which you delete before committing.
- Verify every seed note in `PROGRESS.md`, and include it or mark it as already fixed.

## Definition of done

`AUDIT.md` exists, with the baseline, the summary, the full findings table and the coverage matrix.
Every in-scope file has been read. `PROGRESS.md` has your entry. You have committed on
`docs/enterprise-overhaul` as `chore(docs): add enterprise readiness audit`.
