# 04 - Kernel Registration

Your backend module is now written, but the system doesn't know it exists. You must register it with the API Gateway.

## Updating the Module Catalog
The `module-catalog.ts` file in the API Gateway is the central nervous system of Innostes OS backends.

1. Open `apps/api-gateway/src/app/module-catalog.ts`.
2. Import your new service and controller:
   ```typescript
   import { InventoryService, InventoryController } from '@innostes/modules/inventory/api-logic';
   ```

3. Add them to the registration arrays. The NestJS `AppModule` dynamically loops through these to instantiate them.

```typescript
export const MODULE_SERVICES = [
  HrmsPublicService,
  InventoryService, // <-- Add Service
] as const;

export const MODULE_CONTROLLERS = [
  // If your catalog structure uses a separate controllers array, add it here.
  // Otherwise, ensure the module import aggregates it.
  InventoryController, // <-- Add Controller
] as const;
```

## Bridge Handlers (Optional)
If your module needs to expose internal functions to *other* modules (without going over HTTP), register a Bridge Handler:

```typescript
export const buildBridgeHandlers = (
  hrms: HrmsPublicService, 
  inv: InventoryService // Inject it here
) => [
  {
    moduleId: 'inventory',
    isLoaded: true,
    api: {
      checkStock: (tenantId: string, sku: string) => inv.checkStock(tenantId, sku),
    },
  },
];
```
This allows the CRM module, for example, to securely verify stock before making a sale, without hard-coupling their databases.
