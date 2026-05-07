# Getting Started

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| Nx CLI | bundled via pnpm (no global install needed) |

## 1. Clone and install

```bash
git clone <repo-url>
cd mono

# The .npmrc in this folder points pnpm to the PayPal internal registry.
# You must be on the PayPal network or VPN.
pnpm install
```

## 2. Run the shell (frontend)

```bash
pnpm nx dev shell
# Opens on http://localhost:3000
```

Default mock credentials (from the auth controller):
- Email: `any@email.com`
- Password: `any-value`

The auth controller currently accepts any credentials and returns a mock user. Replace with real validation before production.

## 3. Run the API gateway (backend)

```bash
pnpm nx dev api-gateway
# Listens on http://localhost:3001
```

## 4. Run both simultaneously

```bash
# In two terminals:
pnpm nx dev shell
pnpm nx dev api-gateway

# Or with nx run-many:
pnpm nx run-many -t dev --projects=shell,api-gateway --parallel
```

## 5. Common Nx commands

```bash
# Run any target for a specific project
pnpm nx <target> <project>

# Examples
pnpm nx build shell          # production build
pnpm nx lint shell           # lint
pnpm nx typecheck shell      # type-check
pnpm nx test analytics-ui    # run tests for a lib

# Run a target across ALL projects
pnpm nx run-many -t build
pnpm nx run-many -t lint
pnpm nx run-many -t typecheck

# Only run targets for projects affected by your changes
pnpm nx affected -t build
pnpm nx affected -t test

# Visualise the project dependency graph
pnpm nx graph
```

## 6. Generate a new module (fastest path)

```bash
pnpm nx g @mono/generators:module --name=reporting
```

This creates:
- `libs/modules/reporting/feature/`
- `libs/modules/reporting/ui/`
- `libs/modules/reporting/data-access/`
- `libs/modules/reporting/utils/`
- A stub route at `apps/shell/src/app/(reporting)/reporting/page.tsx`
- Adds all four path aliases to `tsconfig.base.json`

See `docs/05-adding-a-module.md` for a full walkthrough.

## 7. Generate a new NestJS service

```bash
pnpm nx g @mono/generators:service --name=reporting
```

Creates `apps/service-reporting/` with a NestJS app scaffolded and wired.

## Environment variables

The shell reads these at runtime. Create `apps/shell/.env.local` for local overrides:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
```

The api-gateway reads:

```env
PORT=3001
JWT_SECRET=change-me
```
