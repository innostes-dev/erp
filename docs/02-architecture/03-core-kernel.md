# 03 - Core Kernel (API Gateway)

The Kernel is built with **NestJS** (`apps/api-gateway`). It acts as the central router and registry for backend operations.

## The Module Catalog
Unlike standard NestJS applications where every module is hardcoded into the `AppModule`, Innostes OS uses a dynamic registry approach.

Located at `apps/api-gateway/src/app/module-catalog.ts`, this file aggregates exports from various `libs/modules/*`:

```typescript
// 1. Manifests (UI definitions)
export const MODULE_MANIFESTS = {
  [hrmsManifest.id]: hrmsManifest,
};

// 2. Services (Backend Logic)
export const MODULE_SERVICES = [
  HrmsPublicService,
];

// 3. Bridge Handlers (Inter-module communication)
export const buildBridgeHandlers = (...) => [...];
```

The `AppModule` loops over `MODULE_SERVICES` to register providers and injects `MODULE_MANIFESTS` into the `/api/registry/modules` endpoint.

## Inter-Module Communication
Modules are isolated by design. If the Payroll module needs to know an employee's salary, it cannot query the HR database directly.

Instead, we use **Bridge Handlers**. The HR module registers a bridge handler (e.g., `getEmployeeInfo`) in the catalog. The Payroll module calls the central API Gateway to execute this handler, ensuring that database access rules and business logic remain encapsulated within the HR module.
