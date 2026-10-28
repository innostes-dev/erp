# 12 – QA and editorial pass

## Role

You are the managing editor and QA lead for the engineering handbook. Make every architecture and
developer page correct as rendered, and consistent in voice, as if one senior architect wrote all of
them.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md`, the glossary, and every page in `content/dev-docs`.

## Tasks

1. **Rendered QA**:
   - Every dev-docs page, in light and dark themes, at desktop and 360px.
   - Diagrams render, are legible and have text alternatives (D6).
   - No console errors and no page overflow.
   - If a Playwright crawl exists from the UI runbook, extend it to `/docs/**`. Otherwise add a
     minimal one (axe, overflow and console checks) for `/docs/**` in CI.
2. **Claims re-check**:
   - Pick at least three factual claims per page at random, and re-verify them against the current
     code.
   - Re-run every generator stale check.
   - Any failure means re-checking that whole page.
3. **Links**: all internal links and anchors, the ADR links, and the links to `/api-reference` and
   `/ui/docs`.
4. **Editorial**:
   - voice per STANDARDS §4, with no banned words
   - glossary terms used consistently
   - British spelling and sentence case
   - consistent diagram style (the same legend conventions, colours via tokens, the same direction
     conventions)
   - consistent status callouts
   - `owner` and `lastReviewed` set on every architecture and operations page
5. **Diátaxis spot check**: no procedures inside explanation pages, and no essays inside runbooks.

## Definition of done

- Rendered QA has zero failures and is in CI.
- The claims re-check passes, and the links pass.
- The editorial pass is done.
- Commit as `docs(arch): QA and editorial pass`.
- STANDARDS §7 is met.
