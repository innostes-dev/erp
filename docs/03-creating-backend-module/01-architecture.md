# 01 - Backend Architecture

When creating a new business module in Innostes OS, we strictly enforce a **Backend-First** development process. You must model your data and secure your APIs before building the UI.

## The Two-Library System
A backend module is not a single folder. To enforce strict separation of concerns, the backend of any module (e.g., `inventory`) is split into two distinct Nx libraries:

1. **`data-access`**: This library contains ONLY database schemas, types, and raw queries. It uses Drizzle ORM.
2. **`api-logic`**: This library contains NestJS Controllers, Services, and business logic. It imports `data-access`.

### Why this split?
- **Security**: The UI (`feature-ui`) or API Gateway should never have direct access to Drizzle schemas or raw SQL queries. By isolating `data-access`, we can prevent accidental database exposures.
- **Testability**: You can mock `data-access` easily to unit-test `api-logic` without a real database.

## Integration with the Kernel
Your module's backend does not run on its own. It is compiled into the `apps/api-gateway` (The Kernel).
The Kernel handles the global HTTP server, Authentication Guards (JWT validation), and database connection pooling. Your module simply "plugs in" its routes.
