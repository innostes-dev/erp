# Prompt 2 — Full workspace build + typecheck

## Context
The workspace has 5 projects: `apps/landing` (Next.js + Fumadocs docs site), `apps/web-app`
(React), `apps/api-server` (Python FastAPI, not part of the Nx TS build graph), `packages/ui`
(the design system), and its test harnesses `tests/ui-react17`, `tests/ui-react18`. The last
attempt to build+typecheck the whole TS/JS side of the workspace was interrupted mid-run and its
result is unknown — do not assume it passed or failed.

**Precondition:** run [01-run-test-suite.md](01-run-test-suite.md) first (or confirm it's already
done) — a broken test run often means broken source, which will also fail build/typecheck.

## Task
1. Run `pnpm nx run-many -t build typecheck --output-style=static` (every applicable project,
   `test` target intentionally excluded here — that's prompt 1's job, don't re-run it).
2. If anything fails:
   - `packages/ui` failures: fix in `packages/ui/src`. Preserve the React 17/18/19 compatibility
     rules in [00-index.md](00-index.md).
   - `apps/landing` failures: this is the Fumadocs/Next.js docs site — check for stale imports from
     `@innostes/ui` (new exports like `AppRail`, `CommandPalette`, chart components, or the
     `./charts` subpath may not be referenced correctly yet since no docs pages use them — that's
     expected and fine; just make sure nothing that DOES exist is broken).
   - `apps/web-app` failures: same category of check.
   - If `pnpm nx sync` reports TS project references are out of date, run it and re-attempt the
     build.
3. Re-run the full command again after each round of fixes until it's clean in one pass.
4. Do a final full run from a clean state to be sure nothing is order-dependent:
   `pnpm nx reset && pnpm nx run-many -t build typecheck --output-style=static`

## Definition of done
- [ ] `pnpm nx run-many -t build typecheck --output-style=static` passes for all projects, in a
      single run, starting from `pnpm nx reset`.
- [ ] No TS project-reference sync warnings remain (`pnpm nx sync --check` is clean, or sync was
      run and the build re-verified after).
- [ ] List every project that failed and what the root cause was, even if trivial.
- [ ] Nothing is committed.
