# Prompt 10 — Migrate CI from npm to pnpm

## Context
This repo is pnpm-only (explicit, repeated project requirement — see root `CLAUDE.md` and
[00-index.md](00-index.md)). The CI workflow(s) still use `npm`, which has been flagged as broken
before but never fixed.

## Task
1. Find every CI workflow file (likely `.github/workflows/*.yml`, check for others too —
   `.gitlab-ci.yml`, `azure-pipelines.yml`, etc. — but GitHub Actions is most likely given the
   repo structure).
2. For each one using `npm`:
   - Replace `npm ci`/`npm install` with a proper pnpm setup: use the `pnpm/action-setup` GitHub
     Action pinned to a specific version, set up Node with `actions/setup-node`'s cache set to
     `pnpm` (requires the pnpm action to run first so the cache step can find the lockfile), then
     `pnpm install --frozen-lockfile`.
   - Replace any `npm run <script>` with `pnpm nx <target>` or `pnpm run <script>` as appropriate
     — prefer calling through Nx (`pnpm nx run-many -t build typecheck test lint`,
     `pnpm nx affected -t ...` if the workflow is PR-triggered and wants to scope to changed
     projects) rather than raw npm scripts, consistent with this repo's Nx-first rule.
   - Make sure the pnpm version pinned in CI matches the `packageManager` field in root
     `package.json` (read it first, don't guess the version).
3. If an Nx Cloud / remote cache token is referenced anywhere, leave it untouched — this task is
   only about the package manager, not caching infrastructure.
4. Validate the YAML is well-formed (lint it or at minimum visually re-check indentation) since
   there's no way to actually execute GitHub Actions locally here.

## Definition of done
- [ ] No CI workflow file references `npm` anywhere (install or run).
- [ ] pnpm version in CI matches `packageManager` in root `package.json`.
- [ ] CI steps run tasks through `pnpm nx ...`, not raw package scripts, wherever Nx targets exist
      for that purpose.
- [ ] YAML is valid.
- [ ] Nothing is committed (this one's an exception worth flagging to the user before committing
      even after prompt 12, since a broken CI config can't be tested locally — call this out
      explicitly when reporting completion).
