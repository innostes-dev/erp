# 04 - The Kernel (API Gateway)

The Kernel (`apps/api-gateway`) is a NestJS application. It acts as the central hub for the entire system.

## Module Catalog (`module-catalog.ts`)
Instead of hardcoding every feature into the main app module, the Kernel uses a plugin architecture via `apps/api-gateway/src/app/module-catalog.ts`.

### How it works:
1. Each business module (e.g., HRMS) exports a **Manifest** (metadata about the module) and **Services** (backend logic).
2. The `module-catalog.ts` file imports these and aggregates them into central arrays (`MODULE_MANIFESTS`, `MODULE_SERVICES`).
3. The NestJS `AppModule` dynamically loops through these arrays to inject routes, GraphQL resolvers, and services.

## The Registry API
The frontend Shell needs to know what modules the current user has access to. The Kernel exposes the `/api/registry/modules` endpoint.

This endpoint:
1. Reads `MODULE_MANIFESTS`.
2. Filters out modules based on user permissions or tenant subscriptions.
3. Returns a JSON array to the Shell containing the module `id`, `name`, and `sidebarGroups`.

This is what allows the OS Shell to dynamically build the App Launcher grid and the side navigation menus without requiring frontend redeployments when backend permissions change.
