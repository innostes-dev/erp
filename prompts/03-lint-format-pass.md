# Prompt 3 — Lint / format pass

## Context
None of the files changed in this phase (roughly 48 modified/new files, see `git status`) have
been run through ESLint/Prettier explicitly. Editor auto-format may have hit some of them
incidentally, but that's not a substitute for a real check.

**Precondition:** prompts 1 and 2 should already be green, so lint fixes don't get masked by
unrelated build/test failures.

## Task
1. Find the lint setup: check root `package.json` scripts, `eslint.config.*`/`.eslintrc*`, and any
   `@nx/eslint` plugin targets (`pnpm nx show project ui --web` or check `packages/ui/project.json`
   for a `lint` target).
2. Run lint across the whole workspace via Nx, not raw `eslint`:
   `pnpm nx run-many -t lint --output-style=static` (adjust the target name if the workspace uses
   a different one — check first, don't guess, per the project's own Nx guidance).
3. Run Prettier (or whatever formatter is configured) across just the changed files from
   `git status --short` — do not reformat the entire repo, only touch files already in this
   session's diff, to avoid unrelated churn in the final commit.
4. Fix every lint error. For lint *warnings*, use judgment: fix anything that's a real issue
   (unused imports, missing deps in hooks, accessibility lint rules), but don't fight the linter
   into submission with disable comments unless the rule is genuinely a false positive for that
   line — and if you do suppress one, leave a one-line comment saying why.
5. Re-run lint to confirm zero errors remain.

## Definition of done
- [ ] `pnpm nx run-many -t lint` (or the workspace's actual lint target) passes for every project
      with zero errors.
- [ ] Formatter has been run on every file touched in this phase, and output is unchanged on a
      second run (idempotent).
- [ ] Any lint-disable comments added are justified inline.
- [ ] `pnpm nx run-many -t build typecheck` (from prompt 2) still passes after these edits —
      re-verify, don't assume formatting-only changes are always safe.
- [ ] Nothing is committed.
