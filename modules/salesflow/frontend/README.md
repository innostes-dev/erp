# Innostes SalesFlow (Frontend)

The frontend client package (`@innostes/salesflow`) for the **SalesFlow CRM & Revenue Pipeline Suite** in the Innostes Business Operating System.

---

## 1. Overview

`@innostes/salesflow` is a lightweight, decoupled UI package rendered by the turnkey web application (`apps/web-app`). It provides:
- A standardized **Module Manifest** (`salesflowManifest`) declaring routes, labels, icons, and sub-features.
- The root **SalesFlowPage** component with tabs for sub-features (`overview`, `leads`, `deals`, `pipeline`, `contacts`).
- Pre-integrated action headers, empty states, and dialog controls utilizing the `@innostes/ui` component library.

---

## 2. Directory Structure

```
modules/salesflow/frontend/
├── src/
│   ├── index.ts          # Package entry point exporting manifest and page
│   ├── manifest.ts       # ModuleManifest metadata loaded by web-app
│   └── SalesFlowPage.tsx # Primary revenue dashboard and sub-feature tabs
├── package.json
└── README.md
```

---

## 3. Module Manifest

```typescript
import { salesflowManifest } from '@innostes/salesflow';

// Loaded dynamically in apps/web-app:
// {
//   id: 'salesflow',
//   name: 'SalesFlow',
//   version: '0.1.0',
//   href: '/salesflow',
//   subFeatures: [...]
// }
```

---

## 4. License

Open-source software licensed under the **[MIT License](../../../LICENSE)**.
