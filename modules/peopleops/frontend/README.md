# Innostes PeopleOps (Frontend)

The frontend client package (`@innostes/peopleops`) for the **PeopleOps Workforce & HRMS Suite** in the Innostes Business Operating System.

---

## 1. Overview

`@innostes/peopleops` is a lightweight, decoupled UI package rendered by the turnkey web application (`apps/web-app`). It provides:
- A standardized **Module Manifest** (`peopleopsManifest`) declaring routes, labels, icons, and sub-features.
- The root **PeopleOpsPage** component with tabs for sub-features (`overview`, `employees`, `leave`, `payroll`, `attendance`).
- Pre-integrated action headers, empty states, and dialog controls utilizing the `@innostes/ui` component library.

---

## 2. Directory Structure

```
modules/peopleops/frontend/
├── src/
│   ├── index.ts          # Package entry point exporting manifest and page
│   ├── manifest.ts       # ModuleManifest metadata loaded by web-app
│   └── PeopleOpsPage.tsx # Primary workforce dashboard and sub-feature tabs
├── package.json
└── README.md
```

---

## 3. Module Manifest

```typescript
import { peopleopsManifest } from '@innostes/peopleops';

// Loaded dynamically in apps/web-app:
// {
//   id: 'peopleops',
//   name: 'PeopleOps',
//   version: '0.1.0',
//   href: '/peopleops',
//   subFeatures: [...]
// }
```

---

## 4. License

Open-source software licensed under the **[MIT License](../../../LICENSE)**.
