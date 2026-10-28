# innostes UI: library and docs overhaul (agent runbook)

These prompts take `@innostes/ui` (`packages/ui`) and its documentation site (`apps/landing`, served at
`/ui/docs`) to the standard of a mature open-source design system maintained by a large engineering
organisation. The result should hold up to review by a skeptical senior staff engineer deciding whether
their company should adopt it.

Run the prompts **one at a time, in order, each in a fresh agent session** started at the repository
root. Each prompt is self-contained. Agents share context only through the repository and
[`PROGRESS.md`](./PROGRESS.md).

## Before you start

1. Commit or stash any uncommitted work on `main`. Prompt 01 creates the working branch from there.
2. Give agents permission to run `pnpm`, `git` (local only, no push), Node scripts and a local dev server.
   Prompt 16 also installs Playwright browsers.
3. Use the strongest model you have at the highest reasoning effort. These are long tasks.

## How to run each prompt

Paste this, replacing the file name:

```text
Read agent-prompts/ui-docs-overhaul/STANDARDS.md and agent-prompts/ui-docs-overhaul/PROGRESS.md
in full, then carry out agent-prompts/ui-docs-overhaul/01-audit.md exactly. Do not stop until its
Definition of done is met and you have appended your entry to PROGRESS.md and committed.
```

After each run:

- Read the agent's entry in `PROGRESS.md`. If it lists **blocking** open issues, rerun the same prompt
  with: "Continue <prompt>. Resolve the blocking items in your previous PROGRESS.md entry."
- Run `pnpm nx run landing:docs-check` (it exists from prompt 02 onwards). It must pass before you continue.

## Order

| # | Prompt | Area | Changes code? |
| --- | --- | --- | --- |
| 01 | [Audit](./01-audit.md) | Inventory every defect. Fix nothing. | No |
| 02 | [Quality gates](./02-quality-gates.md) | Automated checks that fail on the defects found | Scripts and CI |
| 03 | [Library: actions and forms](./03-library-actions-forms.md) | Component correctness, API, a11y, tests | Library |
| 04 | [Library: data display and feedback](./04-library-data-display-feedback.md) | Same | Library |
| 05 | [Library: overlays, navigation, layout](./05-library-overlays-navigation-layout.md) | Same | Library |
| 06 | [Library: widgets, charts, editor](./06-library-widgets-charts-editor.md) | Same | Library |
| 07 | [Docs platform](./07-docs-platform.md) | Information architecture, page building blocks, site features | Docs app |
| 08 | [Foundations and getting started](./08-docs-foundations.md) | Introduction, installation, theming, foundations, policies | Docs |
| 09 | [Pages: actions and forms](./09-pages-actions-forms.md) | Component pages to the page standard | Docs |
| 10 | [Pages: data display and feedback](./10-pages-data-display-feedback.md) | Same | Docs |
| 11 | [Pages: overlays, navigation, layout](./11-pages-overlays-navigation-layout.md) | Same | Docs |
| 12 | [Pages: widgets, charts, editor](./12-pages-widgets-charts-editor.md) | Same, plus missing pages | Docs |
| 13 | [Patterns and guides](./13-patterns-guides.md) | Task-oriented guides for ERP screens | Docs |
| 14 | [Examples](./14-examples.md) | Full-page reference screens | Docs |
| 15 | [Governance and release](./15-governance-release.md) | Changelog, versioning, support, security, package metadata | Docs and package |
| 16 | [Browser QA](./16-browser-qa.md) | Automated crawl: a11y, overflow, console, both themes | Scripts and fixes |
| 17 | [Editorial pass](./17-editorial-pass.md) | Line-by-line copy edit of every page | Docs |
| 18 | [Release readiness review](./18-release-readiness.md) | Adversarial final review and fixes | Anything |
| 19 | [Checklist verification](./19-checklist-verification.md) | Every component proven against every checklist item, with evidence | Scripts and fixes |

Prompts 03–06 change the library before the docs are rewritten, so the pages document final behaviour.
Don't reorder them.

## Files

- [`STANDARDS.md`](./STANDARDS.md): the rules every agent follows. Voice, page template, example data,
  engineering constraints, known traps and the definition of done. Edit this to change the bar.
- [`PROGRESS.md`](./PROGRESS.md): the shared log. Each agent appends what it changed, what it decided
  and what it left open.
- `AUDIT.md`: written by prompt 01. It's the master defect list, and later prompts tick items off.
- `RELEASE-REVIEW.md` (prompt 18) and `CHECKLIST-REPORT.md` (prompt 19): the final evidence. Read
  their last lines for the verdict.
