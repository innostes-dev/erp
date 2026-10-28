# 13 – Checklist verification (every page, diagram, ADR and rule, with evidence)

## Role

You are an independent architecture compliance reviewer, not involved in prompts 01–12. Prove, with
evidence, that every checklist item in `STANDARDS.md` §5 holds for every page, diagram, ADR and
fitness function. A check passes only when you can cite the code, a test, a gate result or the
rendered page. "Probably fine" is a fail.

## Read first

`STANDARDS.md` (all of it), the whole of `PROGRESS.md` (note every exception), `AUDIT.md`, and the
configs of every gate, generator and fitness function.

## Step 1: inventory

- Every page under `content/dev-docs/architecture/`, `operations/` and `decisions/`.
- Every diagram (Mermaid block or generated output), with its page.
- Every ADR.
- Every rule stated in the docs ("must", "never", "always", "only"): search the pages for these
  words, then read them in context.
- Every fitness function contract and every exception.
- The arc42 section map: confirm that all 12 sections are covered.

## Step 2: mechanical verification

Run uncached, and record the results:

- `pnpm nx build landing`
- `landing:arch-docs-check` (diagrams, frontmatter, ADRs, links, arc42 coverage)
- `arch-check` (the fitness functions)
- every generator stale check (module catalogue, entity diagrams, table reference, configuration
  reference, error catalogue if it's linked)
- the rendered QA crawl for `/docs/**`

Map each gate to the checklist IDs it proves.

## Step 3: evidence matrix

- **Pages × A1–A10**:
  - A4: re-verify **every** factual claim on the page against the code. Not a sample. Cite
    `file:line`.
  - A5: each rule on the page is linked to its enforcement, and that enforcement exists and passes.
  - A6: every present-tense statement describes something that exists.
- **Diagrams × D1–D7**:
  - D3: every element name exists in the code. List them with their locations.
  - D6: check both themes and 360px in the browser.
- **ADRs × R1–R9**:
  - R4: for each rationale statement, cite its source (a commit, doc or code comment), or confirm
    it's explicitly marked as unrecorded.
- **Rules × F1–F4**:
  - For each stated rule, name the contract or test.
  - Demonstrate that it fails on a violation: temporarily introduce one in a scratch change, run the
    check, then revert.
  - Confirm that CI runs it, and that the docs link to it and it links back.
- **Exceptions**: every fitness function exception and recorded exception has a debt item in the
  risk register, and a reason that holds.

## Step 4: report – `agent-prompts/architecture-docs/CHECKLIST-REPORT.md`

The sections are:

- Summary (counts; the pass rate per checklist ID)
- Matrices (pages × A, diagrams × D, ADRs × R, rules × F; ✓, ✗ or n/a, with each ✗ linked)
- Findings (`CHK-001…`, with the evidence, the fix and the owner prompt)
- Exceptions review
- arc42 coverage table

## Step 5: fix and re-verify

- Fix every finding, following the owning prompt's rules.
- Code changes are limited to the kinds allowed in STANDARDS §6. If a finding needs an architecture
  change, record a proposed ADR and a risk, and mark the finding as justified.
- Repeat steps 2–3 for everything affected, until no ✗ remains apart from justified exceptions.

## Definition of done

- The report covers every item with evidence, and all gates pass uncached.
- Every finding is fixed or justified.
- STANDARDS §7 is met.
- End the report with one line: "All P pages, D diagrams, R ADRs and F rules verified against A1–A10,
  D1–D7, R1–R9 and F1–F4, with all 12 arc42 sections covered: X fully compliant, Y with justified
  exceptions, 0 failing." If anything is still failing, use the true number, and list those items
  as blocking.
- Commit as `chore(docs): verify architecture documentation against the checklists`.
