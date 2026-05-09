# 06 - Module Boundaries

In a Monorepo, it is dangerously easy to import code from anywhere. This leads to spaghetti code. We enforce strict **Module Boundaries** using ESLint.

## The Three Tiers

Every module (`hrms`, `crm`, etc.) is divided into three libraries. The direction of dependency must strictly flow downwards:

1. **`feature-ui`**: The highest level. React components.
   - *Can import:* Global design system, generic UI libs.
   - *Cannot import:* `api-logic`, `data-access`. (UI shouldn't talk directly to DB schemas or backend services).

2. **`api-logic`**: The middle tier. NestJS backend logic.
   - *Can import:* `data-access`.
   - *Cannot import:* `feature-ui`. (Backend doesn't need to know about React).

3. **`data-access`**: The lowest level. Drizzle schemas.
   - *Can import:* Nothing but third-party DB utilities.

## Cross-Module Communication
Modules should be isolated. `hrms/api-logic` should NOT directly import `crm/data-access`.
If HRMS needs data from CRM, it must request it via the API Gateway or a centralized Message Broker, keeping domains decoupled.

If you violate these rules, the Nx ESLint plugin will throw a linting error and fail your CI build.
