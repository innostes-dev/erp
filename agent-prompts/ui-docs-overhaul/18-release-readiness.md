# 18 – Release readiness review (adversarial)

## Role

You are two people, in sequence:

1. **The evaluator**: a skeptical principal engineer at a large enterprise who must decide whether
   300 engineers adopt this library. You look for reasons to say no: anything inaccurate,
   inconsistent, untested, unfinished, or that smells generated or startup-grade.
2. **The fixer**: a senior maintainer who fixes everything the evaluator finds.

## Read first

`STANDARDS.md`, the whole of `PROGRESS.md`, and `AUDIT.md`. Every item must be fixed or have an
accepted justification. Then come to the site cold, as an evaluator would.

## Part 1: evaluate

Work through these as a new user. Write the findings to
`agent-prompts/ui-docs-overhaul/RELEASE-REVIEW.md`, using the same table format as `AUDIT.md` with IDs
`REL-001…`.

1. **First 15 minutes**:
   - Follow Installation and the Next.js guide in a fresh scratch app, exactly as written.
   - Build a small invoice list with a filter dialog, using only the docs.
   - Record every point where you hesitated, guessed or hit an error.
2. **Claims audit**: list every promise the docs and README make (accessibility target, React
   versions, browsers, semver, sizes, "tested", "every", "all"). For each, show the evidence: a
   test, CI config, a policy or a measurement. A claim without evidence is a finding.
3. **Consistency sweep**:
   - Compare any five random pairs of component pages section by section.
   - Compare the prop naming across all form controls.
   - Compare the demo styling across categories.
4. **Library spot review**: pick ten components at random. Read the source and tests as a code
   reviewer. Look for bugs, missing tests for documented behaviour, React 17 incompatibilities and
   a11y gaps.
5. **Tells sweep**: anything a reader would take as AI-written or unfinished. Repetitive sentence
   shapes, generic examples, uniform bullet lists, over-explained basics, and inconsistent depth
   between pages.
6. **Compare** against Radix and Base UI docs (structure and precision) and against Atlassian,
   Carbon and Polaris (guidance and governance). List anything an evaluator would expect from those
   that is missing here.

## Part 2: fix

- Fix every `REL-*` finding. Each fix follows the scope rules of the prompt that owns that area. Read
  that prompt's file before you change its area.
- If a finding can't be fixed without a product decision, record it as **blocking** and stop for the
  user. Don't guess.

## Part 3: final verification

Run everything uncached, and record the output summary in `RELEASE-REVIEW.md`:

- `pnpm nx run-many -t test typecheck build -p ui --skip-nx-cache`
- `pnpm nx run-many -t test typecheck -p ui-react17-tests ui-react18-tests --skip-nx-cache`
- `pnpm nx build landing --skip-nx-cache`
- `pnpm nx run landing:docs-check`
- `pnpm nx run landing:docs-e2e` (the target from prompt 16)
- the size checks
- `pnpm pack` contents review

End `RELEASE-REVIEW.md` with a **verdict**: "Ready for 1.0.0", or "Not ready", with the blocking
list. Give the verdict honestly. A "Not ready" with a precise list is a better outcome than a false
"Ready".

## Definition of done

- `RELEASE-REVIEW.md` is complete.
- Every non-blocking finding is fixed.
- All the verification passes.
- The verdict is stated.
- STANDARDS §8 is met.
- Commit as `chore(ui): release readiness review and fixes`.
