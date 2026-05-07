# Running Locally

This guide covers the day-to-day development workflow after the initial installation described in [02-installation.md](02-installation.md).

## Table of Contents

- [Starting the Dev Servers](#starting-the-dev-servers)
- [What the Console Output Means](#what-the-console-output-means)
- [Application URLs](#application-urls)
- [Default Credentials](#default-credentials)
- [Port Conflict Fix](#port-conflict-fix)
- [Running Individual Projects](#running-individual-projects)
- [Database Commands (Optional)](#database-commands-optional)
- [Nx Task Shortcuts](#nx-task-shortcuts)

---

## Starting the Dev Servers

From the repository root, run:

```bash
npm run dev
```

This is a thin wrapper for:

```bash
nx run-many -t dev --projects=shell,api-gateway --parallel
```

Nx starts both applications in parallel. The `--parallel` flag means neither waits for the other to finish compilation before starting. Both servers use watch mode and reload on file changes.

> **Note:** Always start from the repository root, not from inside `apps/shell` or `apps/api-gateway`. Running `next dev` or `ts-node` directly inside a sub-directory skips the `envFile` injection and `tsconfig-paths` registration that the Nx targets configure.

---

## What the Console Output Means

### API Gateway (NestJS)

```
[api-gateway] Bootstrap  API Docs available at http://localhost:3001/api/docs
[api-gateway] Bootstrap  API Gateway running on http://localhost:3001/api
[api-gateway] Bootstrap  Accepting requests from http://localhost:3000
```

- **"API Docs available"** — Swagger UI is mounted. This line only appears when `NODE_ENV !== 'production'`.
- **"API Gateway running"** — NestJS is bound and accepting connections.
- **"Accepting requests from"** — the CORS `origin` is set to `SHELL_URL`. Any request from a different origin will be rejected with a CORS error.

### Shell (Next.js)

```
[shell]   ▲ Next.js 15.x.x
[shell]   - Local:        http://localhost:3000
[shell]   - Network:      http://192.168.x.x:3000
[shell]   ✓ Starting...
[shell]   ✓ Ready in 2.3s
```

- **"Starting…"** — Next.js is compiling routes.
- **"Ready"** — the dev server is accepting connections and the first route compilation is complete. Subsequent routes compile on first request (lazy compilation).

A healthy startup produces both sets of lines within about 10 seconds on a warm machine. If the shell shows errors before "Ready", check the TypeScript diagnostics in the terminal — the most common cause is a missing `.env` variable or a path alias that did not resolve.

---

## Application URLs

| URL | What it is |
|---|---|
| `http://localhost:3000` | Next.js shell — workspace dashboard (requires login) |
| `http://localhost:3000/login` | Login page |
| `http://localhost:3000/(modules)/analytics` | Analytics module entry point |
| `http://localhost:3000/developer/api` | In-app API documentation page |
| `http://localhost:3001/api` | NestJS API Gateway root (returns 404 — no route at `/api` without a path) |
| `http://localhost:3001/api/health` | Health check — returns `{ data: { status: "ok" }, success: true }` |
| `http://localhost:3001/api/docs` | Swagger UI — interactive API reference |
| `http://localhost:3001/api/auth/login` | Login endpoint (POST) |
| `http://localhost:3001/api/auth/me` | Current user endpoint (GET, requires Bearer token) |

> **Note:** The browser never calls `localhost:3001` directly. The Next.js dev server proxies every `/api/*` request to `http://localhost:3001/api/*` via the `rewrites()` config in `apps/shell/next.config.ts`. This means CORS is only relevant for server-side fetches and external callers like Swagger UI or `curl`.

---

## Default Credentials

The platform ships with two hardcoded users in `StaticUserRepository`. No database setup is required to use them.

| Email | Password | Roles | Permissions |
|---|---|---|---|
| `admin@mono.dev` | `admin123` | `admin`, `user` | `read`, `write`, `admin` |
| `user@mono.dev` | `user123` | `user` | `read` |

These credentials are stored as bcrypt hashes in `apps/api-gateway/src/modules/auth/repositories/static-user.repository.ts`. To add more static users, append entries to the `STATIC_USERS` array in that file and generate a new hash with:

```bash
node -e "const b = require('bcryptjs'); b.hash('yourpassword', 10).then(console.log)"
```

---

## Port Conflict Fix

If ports 3000 or 3001 are already in use (e.g. from a previous crashed session), the server will fail to bind and print an `EADDRINUSE` error. Kill the conflicting processes with a single command:

```bash
lsof -ti:3000,3001 | xargs kill -9
```

Breaking this down:
- `lsof -ti:3000,3001` — list the PIDs of all processes listening on ports 3000 and 3001 (`-t` means terse output: PIDs only)
- `xargs kill -9` — send SIGKILL to each PID

Then restart:

```bash
npm run dev
```

If the conflict comes back every time you restart, find out which process owns the port:

```bash
lsof -i :3000
lsof -i :3001
```

The `COMMAND` column will tell you what is running.

---

## Running Individual Projects

To run only the shell or only the gateway (useful when iterating on one side without restarting the other):

```bash
# Shell only
nx run shell:dev

# API Gateway only
nx run api-gateway:dev
```

You can also use Nx Console in VS Code: open the **Nx** sidebar, expand the project, and click the `dev` target.

---

## Database Commands (Optional)

These commands are only needed if you are working with the PostgreSQL database. All require `DATABASE_URL` to be set in `.env` and the database to be running.

### Generate a migration

Run this after you change a Drizzle schema file (e.g. `apps/api-gateway/src/database/schema/*.schema.ts`):

```bash
npm run db:generate
```

This calls `drizzle-kit generate --config=apps/api-gateway/drizzle.config.ts` and writes a new SQL migration file into the `drizzle/migrations/` directory.

### Apply migrations

```bash
npm run db:migrate
```

This calls `drizzle-kit migrate` and applies all pending migrations to the database pointed to by `DATABASE_URL`. Run this once after `db:generate`, and again on every other developer's machine after they pull your schema changes.

### Seed the database

```bash
npm run db:seed
```

This runs `apps/api-gateway/src/database/seed.ts` via `ts-node` and inserts the canonical set of development records (users, sample data). Seeding is idempotent — running it multiple times will not create duplicate rows.

### Open Drizzle Studio

```bash
npm run db:studio
```

Opens the Drizzle Studio browser UI at `https://local.drizzle.studio`. This gives you a visual table browser and query editor for the connected database, similar to pgAdmin but embedded in your workflow.

---

## Nx Task Shortcuts

These additional scripts are available from the repository root:

| Command | What it does |
|---|---|
| `npm run build` | Build all projects in topological order |
| `npm run test` | Run all test suites |
| `npm run lint` | Lint all projects |
| `npm run typecheck` | Type-check all projects |
| `npm run affected:build` | Build only projects affected by uncommitted changes |
| `npm run affected:test` | Test only affected projects |
| `npm run affected:lint` | Lint only affected projects |
| `npm run affected:typecheck` | Type-check only affected projects |
| `npm run graph` | Open the Nx project dependency graph in the browser |
| `npm run g:module` | Run the custom module scaffold generator |
| `npm run g:service` | Run the custom NestJS service generator |

> **Note:** The `affected:*` commands are the fastest way to validate your changes in CI or before pushing. Nx computes which projects depend on your changed files and skips everything else, using its local computation cache to avoid redundant work.
