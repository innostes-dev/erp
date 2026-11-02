# Contributing to Innostes Business OS

Thank you for your interest in contributing to **Innostes**! Innostes is an open-source, modular **Business Operating System (Business OS)** engineered to unify workforce, revenue, financials, inventory, and developer telemetry on a hardened enterprise foundation.

We welcome contributions from developers, designers, technical writers, and systems architects around the globe.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, constructive, and professional in all communications across GitHub issues, pull requests, and discussions.

---

## Architectural Principles & Invariants

Before writing code, please review the core architectural rules governing the Innostes monorepo:

1. **Decoupled Two-Engine Architecture**:
   - The presentation layer (`apps/web-app`, `@innostes/ui`) and the backend domain engine (`apps/api-server`, `kernel/backend`, `modules/*`) are strictly decoupled.
   - The backend exposes strict OpenAPI 3.1 contracts and can run completely headlessly.
2. **Hardened Kernel Isolation**:
   - The platform kernel (`kernel/`) provides authentication, session rotation, multi-tenancy, RBAC, and cryptographic audit logging.
   - The kernel never imports business modules (`modules/*`) or developer plugins (`plugins/*`).
3. **Independent Business Modules**:
   - Domain modules (`modules/peopleops`, `modules/salesflow`, etc.) must remain completely independent of one another.
   - Modules may import from `kernel`, but never from sibling modules or the execution engine (`apps/api-server`).
4. **Dynamic Discovery**:
   - Backend modules register via Python entry points (`innostes.modules` in `pyproject.toml`).
   - Frontend modules register via lightweight client manifests loaded dynamically in `apps/web-app`.
5. **Data Sovereignty**:
   - All mutations pass through PostgreSQL with automatic tenant scoping and immutable audit trails.

---

## Development Environment Setup

### Prerequisites

- **Node.js**: `>= 22.0.0`
- **pnpm**: `>= 10.0.0`
- **Python**: `>= 3.12`
- **PostgreSQL**: `>= 16.0` (or Docker)
- **Docker & Docker Compose** (optional, recommended for database services)

### 1. Clone the Repository

```bash
git clone https://github.com/innostes-dev/erp.git
cd erp
```

### 2. Install Monorepo Dependencies

```bash
# Install frontend packages and tools
pnpm install

# Create Python virtual environment and install backend packages
pnpm nx run api-server:install
```

### 3. Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Ensure your database connection settings in `.env` match your local PostgreSQL server:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp_dev
PORT=8001
JWT_SECRET_KEY=insecure-dev-secret-key-change-in-production
```

If using Docker for PostgreSQL:

```bash
docker compose up -d db
```

### 4. Run Database Migrations

```bash
pnpm nx run kernel-backend:migrate
```

### 5. Launch the Development Environment

```bash
# Launch API server (port 8001) and Web App (port 4200) concurrently
pnpm dev

# Or launch the public landing site & documentation platform (port 3000)
pnpm nx dev landing
```

---

## Local Service Ports

| Service | Port | Description |
| :--- | :--- | :--- |
| **API Server** | `http://localhost:8001` | FastAPI execution engine |
| **Swagger UI** | `http://localhost:8001/docs` | Interactive OpenAPI documentation |
| **ReDoc** | `http://localhost:8001/redoc` | OpenAPI reference manual |
| **Web App** | `http://localhost:4200` | React 19 Turnkey Business OS UI |
| **Landing & Docs** | `http://localhost:3000` | Unified documentation & landing website |
| **PostgreSQL** | `localhost:5432` | Relational database storage |

---

## Automated Quality Gates

Before submitting a Pull Request, all automated quality gates must pass:

```bash
# 1. Architecture boundaries and import contracts (Python + TypeScript)
pnpm run arch-check

# 2. Monorepo linting, testing, and builds
pnpm nx run-many -t lint test build

# 3. Documentation quality gates (links, demos, arc42 coverage, prose)
pnpm nx run landing:docs-check
```

---

## Coding Standards

### Python (Backend)
- Code must follow **PEP 8** style guidelines and pass `ruff` / `flake8`.
- Use **Google-style docstrings** on every module, public class, and public function.
- All endpoints must include explicit `summary`, `operation_id`, `responses`, and OpenAPI documentation following our standard conventions.
- Never write raw HTTP status numbers; use `status.HTTP_*` constants from `fastapi` or `http.HTTPStatus`.

### TypeScript & React (Frontend)
- Use functional components with explicit TypeScript interfaces.
- Component styling must use `@innostes/ui` primitives or Tailwind CSS design tokens.
- Follow WAI-ARIA standards for accessibility and ensure keyboard navigability.
- No direct cross-module imports between frontend packages.

---

## Git Workflow & Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(module): description` — A new feature or capability
- `fix(kernel): description` — A bug fix
- `docs(readme): description` — Documentation additions or improvements
- `refactor(api): description` — Code refactoring without behavior change
- `test(ui): description` — Adding or updating test cases
- `chore(deps): description` — Build scripts, dependency updates, or tool configurations

### Submitting a Pull Request

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes adhering to architecture and doc conventions.
3. Verify that all quality gates pass locally (`pnpm run arch-check`).
4. Commit your changes with descriptive conventional commit messages.
5. Push to your fork and submit a Pull Request to `main`.
6. Maintainers will review your PR and provide constructive feedback.

---

## Reporting Issues & Security

- **Bug Reports & Feature Requests**: Use [GitHub Issues](https://github.com/innostes-dev/erp/issues).
- **Security Vulnerabilities**: Do **not** post security vulnerabilities publicly. Email us directly at `security@innostes.com` (see [SECURITY.md](./SECURITY.md)).

Thank you for helping build the future of open-source enterprise operations!
