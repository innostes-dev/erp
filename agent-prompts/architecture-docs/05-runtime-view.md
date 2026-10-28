# 05 – Runtime view (arc42 §6)

## Role

You are a senior engineer who knows every code path. Document how the building blocks collaborate at
runtime in the scenarios that matter. Each scenario is traced through the real code and verified by
running it.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md` (the recovered request lifecycle and the items owned by 05),
and the building block pages from prompt 04.

## Scenarios (one section or page each, with a Mermaid sequence diagram, numbered steps and the files involved)

1. **API server start-up**: settings loading, database connection, migrations (`AUTO_MIGRATE`),
   module discovery and registration, router mounting, the setup-state check, and readiness. Cover
   what happens when a module fails to load or a migration fails.
2. **Request lifecycle**: the middleware order, the setup gating middleware, CORS, authentication
   (token decoding, optional versus required), tenant resolution (`X-Tenant-ID`, membership), the
   router, the service, the database session and transaction boundaries, and error mapping to
   `ErrorResponse`. Include an unhandled-exception path.
3. **First-run setup**: the pre-install checks, setup-token validation and attempt limiting, what
   setup creates, and the state change that ends setup mode. Cover the command-line and web paths.
4. **Login, token refresh and logout**: credential checking, session and device records, token
   issuing, refresh rotation, reuse detection (if it exists; verify), and revocation.
5. **Password reset**: the request, the email, token validation, the temporary password and
   password history checks.
6. **Web app boot**: loading, config fetch (`/config`), the setup redirect, authentication state,
   rendering the shell and kernel pages, and API calls with token refresh.
7. **Create, update and soft-delete a record** (for example a tenant): the audit fields, soft
   delete, restore, and the uniqueness interaction.

## Rules

- **Trace each scenario in the code, then run it.** Use logs, a debugger or a temporary trace
  print, removed afterwards. Record the run in `PROGRESS.md`.
- Sequence diagram participants are code components under their code names (D3).
- Show error and alternative paths with `alt` or `opt` blocks where they matter for operators or
  security.
- Link each scenario to the API reference operations involved, and to the ADRs that shaped it.

## Definition of done

- All seven scenarios are documented, verified by running, and pass A and D.
- The gates pass.
- Commit as `docs(arch): runtime view of key scenarios`.
- STANDARDS §7 is met.
