# 07 – Deployment view and operations (arc42 §7, plus runbooks)

## Role

You are the site reliability lead. Document how the system is built, deployed, configured and
operated. The deployment view explains it. The runbooks tell an operator exactly what to do. Only
document what the repo supports. Gaps become risks.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md` (items owned by 07), `docker-compose.yml`,
`apps/api-server/Dockerfile` and `serve.js`, every `project.json` target, `.github/workflows/ci.yml`,
`kernel/core/config/*`, `apps/web-app` build config, `setup.mdx` (its production checklist), and
`guides/releasing.mdx`.

## Pages

1. **Deployment view** (C4 deployment diagrams):
   - the local development topology (the Nx serve targets, ports)
   - the Docker Compose topology (containers, networks, volumes, health checks, ports)
   - the reference production topology. **Only** if one is defined in the repo. Otherwise write
     "recommended topology", clearly marked as guidance and not a tested deployment: a reverse proxy
     with TLS, API replicas, managed Postgres, SMTP, static web-app hosting. List its assumptions.
   - the mapping from building blocks to infrastructure
2. **Build and release pipeline**: what CI runs, the artefacts produced (Docker image, web-app
   static build, packages), and how a release is cut. Link `releasing.mdx`; don't duplicate it.
3. **Configuration reference (generated)**:
   - a script reads the settings classes and emits every setting: environment variable, type,
     default, description, required-in-production flag, and whether it's secret
   - add a stale check
   - add descriptions to settings that lack them in code
   - flag insecure defaults (for example `JWT_SECRET_KEY` in compose) with a production warning
4. **Security hardening for production**: move the "production checklist" from `setup.mdx` here
   and complete it from the code. Cover secrets, `APP_DEBUG`, CORS origins, TLS termination,
   database credentials, SMTP credentials, setup-token handling, and running migrations.
5. **Observability**: health endpoints (what `/health` checks, its response, and what it means for
   load balancers), logging (format, levels, where they go, and which settings change them),
   metrics and tracing (state plainly what exists).
6. **Runbooks** (`content/dev-docs/operations/`, how-to, A3). Each has a purpose, prerequisites,
   numbered steps with exact commands, verification, and rollback. Every step is **executed** locally
   with Docker Compose, and recorded in `PROGRESS.md`:
   - first deployment and first-run setup
   - upgrading to a new version (migrations included)
   - rolling back a release
   - backing up and restoring Postgres
   - rotating `JWT_SECRET_KEY` and other secrets (and its effect on sessions)
   - resetting setup in non-production
   - diagnosing start-up failures (module load or migration errors)
   - adding a new plug-in to a deployment

## Definition of done

- The deployment view and generated configuration reference exist (with a stale check).
- The runbooks were executed.
- The pages pass A and D.
- The gates pass.
- Commit as `docs(arch): deployment view, configuration reference and runbooks`.
- STANDARDS §7 is met.
