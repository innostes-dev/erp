# Prompt 12 — Final verification sweep + commit

## Context
This is the last step in the chain. By the time this prompt runs, prompts 1-9 and 11 should all
be complete (prompt 10, CI migration, is independent and may or may not be done — note its status
either way, since it can't be locally verified). This prompt does a full clean-slate
re-verification and then performs the actual commit — the only prompt in this chain allowed to
commit anything.

**Precondition:** prompts 1, 2, 3, 9, and 11 report done. If any of them don't, STOP and say
which ones are outstanding instead of committing partial/unverified work.

## Task
1. `git status --short` — review every changed/untracked file. Confirm nothing unexpected is
   there (no stray `.env`, no accidental `node_modules` entry, no editor temp files). If anything
   looks like it shouldn't be committed, flag it before proceeding, don't silently exclude or
   include it.
2. Full clean re-verification, in order, stopping immediately if any step fails:
   - `pnpm nx reset`
   - `pnpm nx run-many -t build typecheck lint test --output-style=static`
   - `pnpm exec publint packages/ui` (or whatever the correct invocation turned out to be in
     prompt 9)
   - `pnpm exec attw --pack packages/ui`
   - the `size-limit` check from prompt 9
3. If everything above is clean, stage files **by name**, not `git add -A`/`-u` blindly — group
   logically (e.g. `packages/ui/...`, `apps/landing/...`, `tests/...`, root config/CI files,
   `PENDING.md` and `prompts/`) so the diff is reviewable, and consider whether this should be one
   commit or several logical commits (e.g. "feat: add app-shell widgets and charts to
   @innostes/ui", "docs: document new widgets, charts, and sidebar customization",
   "chore: npm packaging readiness for @innostes/ui" — use judgment, but don't produce one giant
   undifferentiated commit if the work has clear seams).
4. Write commit message(s) that describe why, not just what (per this repo's commit conventions —
   check `git log` for recent message style and match it).
5. Do NOT push. Confirm with the user before pushing, per standard practice — this prompt's scope
   ends at a local commit.
6. After committing, run `git status --short` again to confirm a clean working tree (or only the
   expected remainder, e.g. if CI migration from prompt 10 is intentionally still pending and will
   be a separate commit later).
7. Update `PENDING.md` one last time to reflect the new reality: either delete it (if truly
   nothing is pending) or trim it down to only genuinely still-open items (e.g. CI migration if
   prompt 10 wasn't run, or pushing to remote).

## Definition of done
- [ ] All of: build, typecheck, lint, test, publint, attw, size-limit — green in one clean pass
      from `pnpm nx reset`.
- [ ] `git status --short` reviewed line by line before staging anything.
- [ ] Commit(s) created locally with messages matching this repo's existing style and ending with
      the required `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` line.
- [ ] Nothing pushed to any remote.
- [ ] `PENDING.md` updated to reflect true remaining state (or removed if empty).
