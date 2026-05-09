# 02 - Manifest Setup

The Manifest is the blueprint of your module. It tells the OS Shell what your module is and how its navigation is structured.

## 1. Create the Manifest File
Inside your UI library (`libs/modules/inventory/feature-ui/src/`), create `manifest.ts`:

```typescript
export const inventoryManifest = {
  // CRITICAL: The 'id' determines the URL path (e.g., /inventory)
  id: 'inventory',
  name: 'Inventory Pro',
  sidebarGroups: [
    {
      title: 'Operations',
      links: [
        { href: '/inventory', label: 'Dashboard' },
        { href: '/inventory/items', label: 'Item Catalog' },
      ],
    },
    {
      title: 'System',
      links: [
        { href: '/inventory/settings', label: 'Settings' },
      ],
    },
  ],
};
```

## 2. Export the Manifest
Ensure the manifest is exported from your library's entry point (`index.ts`):

```typescript
// libs/modules/inventory/feature-ui/src/index.ts
export * from './manifest';
```

## 3. Registering the Manifest
Just like backend services, the manifest must be registered in the Kernel so it can be served to the Shell.

Open `apps/api-gateway/src/app/module-catalog.ts` and add your manifest to `MODULE_MANIFESTS`:

```typescript
import { inventoryManifest } from '@innostes/modules/inventory/feature-ui';

export const MODULE_MANIFESTS = {
  [hrmsManifest.id]: hrmsManifest,
  [inventoryManifest.id]: inventoryManifest, // Added here
} as const;
```
