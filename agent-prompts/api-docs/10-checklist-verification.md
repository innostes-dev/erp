# 10 – Checklist verification (every endpoint, schema, tag and page, with evidence)

## Role

You are an independent compliance reviewer who wasn't involved in prompts 01–09. Prove, with
evidence, that every item in the checklists in `STANDARDS.md` §5 holds for every operation, schema,
tag and guide page. A check passes only when you can point at the spec, a test, the code or the
rendered page. "Probably fine" is a fail.

## Read first

`STANDARDS.md` (all of it), the whole of `PROGRESS.md` (note every recorded exception), `AUDIT.md`,
and the gate configs from prompts 02, 04, 05, 07 and 09.

## Step 1: build the inventory from the code

- Regenerate the spec. List every operation, every schema reachable from any operation, and every
  tag.
- Separately, list every route registered in the running app (introspect `app.routes`).
- The two lists must match. Any difference is a finding.
- List every page in `content/api-docs` (the guides and the generated pages).

## Step 2: mechanical verification

Run every gate uncached and record the results:

- `openapi-check` and `openapi-lint`, with the report-mode list empty
- the contract tests and the undocumented-status guard
- the example-executability test
- the error-code catalogue stale check
- the changelog shape-change check
- the generated-reference stale check
- the samples target
- the rendered QA crawl
- the link check
- `pnpm nx build landing`

Map each gate to the checklist IDs it proves.

## Step 3: evidence matrix (manual where the gates can't prove it)

For **every operation**, E1–E17. Where a gate proves an item, cite the gate. Otherwise cite the
evidence:

- **E3**: quote the description, and judge it against E3's four required elements (what it does,
  who may call it, side effects, idempotency).
- **E5**: the dependency in the code (`file:line`) against the spec's security.
- **E9**: list the errors traced through the service code (`file:line` per raise) against the
  documented responses. They must be identical sets.
- **E13**: the soft-delete text, and the test proving it.
- **E16**: the test names, one per documented status.

For **every schema**, S1–S8. For S5, show the test or response that proves optional versus
nullable. For S8, confirm the response fields against the model fields.

For **every tag**, T1–T3.

For **every guide page**, G1–G8. For G2, list each claim with its backing test. For G3, give the
samples-target result for the page.

## Step 4: report – `agent-prompts/api-docs/CHECKLIST-REPORT.md`

1. **Summary**:
   - the counts (operations, schemas, tags, pages)
   - the pass rate per checklist ID
   - the items fully compliant / with justified exceptions / failing
2. **Matrices**:
   - operations × E1–E17
   - schemas × S1–S8
   - tags × T1–T3
   - pages × G1–G8
   - each cell is ✓, ✗ or n/a, and each ✗ links to its finding
3. **Findings**: `CHK-001…`, each with the item, the checklist ID, the evidence, the fix and the
   owner prompt.
4. **Exceptions review**: every exception recorded in `PROGRESS.md` or the lint-exceptions file,
   with whether its reason holds. A weak reason becomes a finding.

## Step 5: fix and re-verify

- Fix every finding, following the rules of the prompt that owns the area (03 for code-level docs,
  04 for tests, 05 for the site, 06 for guides, 07 for catalogues and policies).
- Behaviour fixes need tests and an "API changes" entry, and a changelog entry under prompt 07's
  check.
- Repeat steps 2–3 for everything affected, until no ✗ remains apart from justified exceptions.

## Definition of done

- `CHECKLIST-REPORT.md` covers every operation, schema, tag and page, with evidence for every
  checklist ID.
- All gates pass uncached.
- Every finding is fixed or justified.
- STANDARDS §8 is met.
- The report ends with exactly one line: "All N operations, M schemas, T tags and P pages verified
  against E1–E17, S1–S8, T1–T3 and G1–G8: X fully compliant, Y with justified exceptions, 0
  failing." If anything is still failing, use the true number, and list those items as blocking.
- Commit as `chore(api): verify every endpoint and page against the documentation checklists`.
