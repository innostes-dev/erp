# Prerequisites

Before you clone the repository, make sure every tool listed below is installed at the correct version. Version mismatches are the single most common cause of "works on my machine" failures in a monorepo.

## Table of Contents

- [Node.js 20+](#nodejs-20)
- [pnpm 9+](#pnpm-9)
- [PostgreSQL 15+](#postgresql-15)
- [Git 2.40+](#git-240)
- [Recommended VS Code Extensions](#recommended-vs-code-extensions)

---

## Node.js 20+

Mono requires Node.js 20 (LTS) or later. Next.js 15 uses the Node.js `fetch` built-in and relies on runtime features that are absent in Node 18.

### Check your current version

```bash
node --version
# Expected: v20.x.x or higher
```

### Install via nvm (recommended)

`nvm` lets you switch Node versions per project, which is important when working across multiple repositories.

1. Install nvm:

   ```bash
   # macOS / Linux
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```

   Then restart your shell or run:

   ```bash
   source ~/.bashrc   # or ~/.zshrc on macOS
   ```

2. Install and activate Node 20:

   ```bash
   nvm install 20
   nvm use 20
   nvm alias default 20   # makes v20 the default for new terminal windows
   ```

3. Verify:

   ```bash
   node --version   # v20.x.x
   npm --version    # 10.x.x
   ```

> **Note:** An `.nvmrc` file at the repository root pins the project to the correct Node version. Running `nvm use` (no arguments) inside the repo directory will automatically switch to the pinned version.

### Alternative: install via Homebrew (macOS)

```bash
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
node --version
```

---

## pnpm 9+

Mono uses pnpm workspaces for dependency hoisting and linking between packages. npm and yarn are not supported because `pnpm-workspace.yaml` and `pnpm-lock.yaml` are the source of truth for the dependency graph.

### Check your current version

```bash
pnpm --version
# Expected: 9.x.x or higher
```

### Install pnpm

The fastest way is through the Node.js Corepack tool (included since Node 16):

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

Alternatively, install globally via npm:

```bash
npm install -g pnpm@latest
pnpm --version
```

> **Note:** Do not run `npm install` or `yarn install` inside this repository. Doing so creates a `package-lock.json` or `yarn.lock` that conflicts with `pnpm-lock.yaml` and breaks workspace symlinks.

---

## PostgreSQL 15+

PostgreSQL is **optional** for local development. The API gateway ships with a `StaticUserRepository` that serves two hardcoded users from memory, so you can log in and explore the UI without a running database. PostgreSQL is only required if you want to run migrations, seed scripts, or test data persistence.

### Check if PostgreSQL is already installed

```bash
psql --version
# Expected: psql (PostgreSQL) 15.x or higher
```

### Option A: Local install

**macOS (Homebrew):**

```bash
brew install postgresql@15
brew services start postgresql@15
# Add psql to PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
psql --version
```

**Ubuntu / Debian:**

```bash
sudo apt update
sudo apt install -y postgresql-15 postgresql-client-15
sudo systemctl enable postgresql
sudo systemctl start postgresql
psql --version
```

After installation, create the database and user that match the default `DATABASE_URL`:

```bash
psql -U postgres -c "CREATE DATABASE mono;"
# The default DATABASE_URL uses postgres:postgres so no extra user is needed
# if your local postgres is already configured with the postgres superuser.
```

### Option B: Docker (no local install required)

If you have Docker installed, this is the fastest path to a working database:

```bash
docker run -d \
  --name mono-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mono \
  -p 5432:5432 \
  postgres:15-alpine
```

Verify the container is running:

```bash
docker ps --filter name=mono-postgres
# STATUS should show "Up"
```

To stop and remove it later:

```bash
docker stop mono-postgres && docker rm mono-postgres
```

> **Note:** The `DATABASE_URL` in `.env` defaults to `postgresql://postgres:postgres@localhost:5432/mono`, which matches both the local install setup above and the Docker command above. No changes to `.env` are needed.

---

## Git 2.40+

Nx uses Git to detect the affected project graph when running `nx affected` commands. Git 2.40 introduced performance improvements that Nx 22 takes advantage of.

### Check your current version

```bash
git --version
# Expected: git version 2.40.x or higher
```

### Upgrade Git

**macOS:**

```bash
brew install git
# Restart terminal, then:
git --version
```

**Ubuntu / Debian:**

```bash
sudo add-apt-repository ppa:git-core/ppa
sudo apt update
sudo apt install -y git
git --version
```

Configure your identity if you have not already done so (required for committing):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## Recommended VS Code Extensions

The repository ships with a `.vscode/extensions.json` file so VS Code automatically prompts you to install these when you open the project. You can also install them manually via the Extensions sidebar (`Cmd+Shift+X` / `Ctrl+Shift+X`).

| Extension | ID | Why it matters |
|---|---|---|
| ESLint | `dbaeumer.vscode-eslint` | Shows lint errors inline as you type; uses the workspace `eslint.config.mjs` |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Autocomplete for Tailwind class names, warns about invalid classes |
| Prettier | `esbenp.prettier-vscode` | Formats on save using `prettier.config.mjs` |
| Nx Console | `nrwl.angular-console` | GUI for Nx generators and task runner; runs `nx graph` in the sidebar |
| TypeScript (built-in) | `vscode.typescript-language-features` | Ensure workspace TypeScript (from `node_modules`) is used, not VS Code's bundled copy |
| Drizzle ORM | `drizzle.drizzle-vscode` | Schema previews and query type hints for Drizzle ORM files |
| Error Lens | `usernamehw.errorlens` | Shows TypeScript and ESLint errors inline on the same line, not just on hover |
| GitLens | `eamodio.gitlens` | Annotates every line with the last commit; useful for tracing why a line exists |

### Enable workspace TypeScript

After opening the repo, VS Code may ask which TypeScript version to use. Always choose **"Use Workspace Version"** so that the strict settings in `tsconfig.base.json` (including `noUncheckedIndexedAccess`, `noImplicitOverride`) are active in the editor.

1. Open any `.ts` or `.tsx` file.
2. Open the Command Palette (`Cmd+Shift+P`).
3. Run **"TypeScript: Select TypeScript Version"**.
4. Choose **"Use Workspace Version"**.
