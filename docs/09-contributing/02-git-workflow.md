# Git Workflow

This project uses a trunk-based development workflow with short-lived feature branches. All work flows through pull requests — direct commits to `main` are not permitted.

---

## Branch naming

Use one of these prefixes followed by a short, hyphenated description:

| Prefix | When to use |
|---|---|
| `feat/` | A new feature or capability |
| `fix/` | A bug fix |
| `docs/` | Documentation only |
| `refactor/` | Code change with no behavior change |
| `chore/` | Dependency updates, config changes, tooling |

### Examples

```
feat/billing-module
feat/user-role-management
fix/login-redirect-loop
fix/session-cookie-expiry
docs/event-bus-guide
refactor/auth-provider-cleanup
chore/upgrade-nx-22
```

Keep branch names lowercase and use hyphens, not underscores or spaces.

---

## Commit message format

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<optional scope>): <short description>

<optional body>

<optional footer>
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation change |
| `refactor` | Refactor with no behavior change |
| `chore` | Tooling, dependencies, config |
| `test` | Adding or updating tests |
| `perf` | Performance improvement |

### Examples

```
feat(billing): add invoice PDF download endpoint

fix(auth): prevent token refresh loop on 401 during refresh

docs(kernel): add event bus usage guide

refactor(shell): extract navigation items to constant

chore: upgrade lucide-react to 0.400.0

feat(kernel/state): add theme toggle to kernel store

BREAKING CHANGE: useKernelStore now requires ThemeProvider as ancestor
```

### Rules

- Keep the first line under 72 characters.
- Use the imperative mood: "add", "fix", "remove" — not "added", "fixes", "removed".
- If the commit introduces a breaking change, add `BREAKING CHANGE:` in the footer with a description.
- Reference GitHub issues in the footer when applicable: `Closes #42`.

---

## Pull request process

### Before opening a PR

1. Run the TypeScript check across the entire monorepo:
   ```bash
   pnpm nx run-many --target=typecheck --all
   ```

2. Confirm the dev servers start without errors:
   ```bash
   pnpm nx run-many --target=dev --projects=shell,api-gateway
   ```

3. If you changed a kernel lib, check that all packages that import it still compile.

4. Pull the latest `main` and rebase your branch:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

### PR description checklist

Every PR must include:

- [ ] What changed and why (not just what — link to the issue or spec if one exists)
- [ ] Steps to test the change manually
- [ ] Any migration steps for existing environments (e.g., new env var, schema change)
- [ ] Screenshot or screen recording for any UI change

### Review requirements

- At least one approval from a project maintainer is required.
- CI must pass (TypeScript, lint, build).
- All review comments must be resolved before merging.

### Merging

Use **squash and merge**. The squashed commit message should follow the Conventional Commits format. Delete the branch after merging.

---

## What never to commit

The following must never appear in a commit, regardless of the branch:

| What | Why |
|---|---|
| `.env` files | Contains secrets and local overrides |
| `.env.local` | Same |
| `node_modules/` | Derived artifact — always reconstructable |
| `dist/` | Build output |
| `.next/` | Next.js build cache |
| `*.pem`, `*.key`, `*.p12` | Private keys |
| Hardcoded passwords, tokens, or API keys anywhere in source | Obvious |

If you accidentally commit a secret, rotate it immediately. Deleting it from history is not sufficient — it must be considered compromised.

`.gitignore` already covers the items above, but the responsibility is yours. `git add -p` (patch mode) lets you review exactly what you are staging.

---

## Before every commit

Run these checks locally. They take seconds and prevent CI failures.

### TypeScript

```bash
pnpm nx run-many --target=typecheck --all
```

A zero-error output means every package compiles. Fix all errors before committing.

### Lint

```bash
pnpm nx run-many --target=lint --all
```

This enforces module boundary rules via Nx ESLint tags. A boundary violation here means you are importing across modules — restructure the code instead of suppressing the rule.

### Dev server smoke test

```bash
pnpm nx run-many --target=dev --projects=shell,api-gateway
```

Open the app in the browser, log in, and confirm your changed area works. A PR without a manual smoke test will be asked to add one.
