# Installation

This guide walks from a fresh clone to a running platform. Complete [01-prerequisites.md](01-prerequisites.md) before continuing.

## Table of Contents

- [1. Clone the Repository](#1-clone-the-repository)
- [2. Install Dependencies](#2-install-dependencies)
- [3. Configure Environment Variables](#3-configure-environment-variables)
- [4. Start the Development Servers](#4-start-the-development-servers)
- [5. Verify the Installation](#5-verify-the-installation)

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/mono.git
cd mono
```

Confirm the workspace is intact:

```bash
ls
# apps  docs  libs  node_modules  nx.json  package.json
# pnpm-lock.yaml  pnpm-workspace.yaml  tsconfig.base.json
```

> **Note:** If you see `node_modules` already present (e.g. after a CI cache restore), skip step 2 and go directly to step 3.

---

## 2. Install Dependencies

```bash
pnpm install
```

pnpm reads `pnpm-workspace.yaml` to discover every package inside `apps/` and `libs/`, then creates symlinks under `node_modules/@mono/*` so that path aliases like `@mono/kernel/auth` resolve without a build step.

Expected output (abbreviated):

```
Packages: +842
Progress: resolved 842, reused 840, downloaded 2, added 842, done
```

> **Note:** Do not run `npm install` or `yarn install`. Both will create a competing lockfile and break the workspace symlinks that Nx depends on.

---

## 3. Configure Environment Variables

The repository ships `.env.example` with every variable the platform uses. Copy it to `.env` (which is git-ignored) and edit the values for your local environment:

```bash
cp .env.example .env
```

Open `.env` in your editor and review each variable:

```dotenv
# ── API Gateway ────────────────────────────────────────────────────────────────

# The origin the NestJS CORS policy will accept requests from.
# Must match the exact URL your browser uses to reach the Next.js shell.
# Change this if you run the shell on a non-standard port or behind a proxy.
SHELL_URL=http://localhost:3000

# Full PostgreSQL connection string.
# Format: postgresql://<user>:<password>@<host>:<port>/<database>
# The default works with both the local install and Docker options described
# in 01-prerequisites.md.
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mono

# ── Shell (Next.js) ────────────────────────────────────────────────────────────

# The URL the *browser* uses to call the API.
# This must be publicly reachable from the user's machine.
# The Next.js rewrite in next.config.ts proxies /api/* to this URL,
# so in practice the browser only ever talks to localhost:3000.
NEXT_PUBLIC_API_URL=http://localhost:3001

# The URL Next.js *server-side* code uses to call the API
# (RSC data fetching, getServerSession, etc.).
# In Docker or Kubernetes this might differ from NEXT_PUBLIC_API_URL
# because server-to-server calls can use an internal DNS name.
API_URL=http://localhost:3001
```

### Variable reference

| Variable | Used by | Default | Required |
|---|---|---|---|
| `SHELL_URL` | `apps/api-gateway` — CORS `origin` | `http://localhost:3000` | Yes |
| `DATABASE_URL` | `apps/api-gateway` — Drizzle connection | `postgresql://postgres:postgres@localhost:5432/mono` | Only if using DB |
| `NEXT_PUBLIC_API_URL` | `apps/shell` — browser fetch | `http://localhost:3001` | Yes |
| `API_URL` | `apps/shell` — server-side fetch (RSC) | `http://localhost:3001` | Yes |

> **Note:** `PORT=3001` is **not** in `.env`. It is injected directly in `apps/api-gateway/project.json` under the `dev` target's `env` block so it cannot accidentally be overridden by an `.env` file. If you need to run the gateway on a different port, change the `project.json` `env.PORT` value and update `NEXT_PUBLIC_API_URL` / `API_URL` in `.env` to match.

> **Note:** `NODE_ENV=development` is set automatically by Nx when running the `dev` target. You do not need to add it to `.env`.

---

## 4. Start the Development Servers

```bash
npm run dev
```

This runs the following Nx command under the hood:

```bash
nx run-many -t dev --projects=shell,api-gateway --parallel
```

Both servers start in parallel. The terminal multiplexes their output with project name prefixes.

### Expected output — API Gateway

```
[api-gateway] Bootstrap  API Docs available at http://localhost:3001/api/docs
[api-gateway] Bootstrap  API Gateway running on http://localhost:3001/api
[api-gateway] Bootstrap  Accepting requests from http://localhost:3000
```

### Expected output — Shell

```
[shell]   ▲ Next.js 15.x.x
[shell]   - Local:        http://localhost:3000
[shell]   - Network:      http://192.168.x.x:3000
[shell]   ✓ Starting...
[shell]   ✓ Ready in 2.3s
```

If either server fails to start, see [03-running-locally.md](03-running-locally.md#port-conflict-fix) for the port-conflict fix.

---

## 5. Verify the Installation

### Check the API health endpoint

```bash
curl -s http://localhost:3001/api/health | jq .
```

Expected response:

```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-05-06T12:00:00.000Z"
  },
  "success": true,
  "message": "OK"
}
```

### Open the browser

```
http://localhost:3000
```

You should be redirected to the login page at `http://localhost:3000/login`. Sign in with:

- **Email:** `admin@mono.dev`
- **Password:** `admin123`

After login you will be redirected to the workspace dashboard at `http://localhost:3000`.

### Check the Swagger UI

```
http://localhost:3001/api/docs
```

The interactive API reference loads. Click **Authorize**, paste any token you received from a login response, and try calling `GET /api/auth/me`.

### Check the in-app API docs page

```
http://localhost:3000/developer/api
```

This page inside the shell mirrors the Swagger spec and serves as a developer portal for the platform API.
