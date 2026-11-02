# Innostes Business OS: Shared Packages

The `packages/` directory contains shared component libraries, design systems, and workspace tooling for the **Innostes Business Operating System (Business OS)**.

---

## 1. Packages Overview

| Package | Directory | Target | Purpose |
| :--- | :--- | :--- | :--- |
| **`@innostes/ui`** | `packages/ui` | React 17/18/19 | Enterprise design system built on Base UI and Tailwind CSS v4 design tokens. |
| **`@innostes/eslint-config`** | `packages/eslint-config` | Monorepo Tooling | Shared ESLint and TypeScript code style configurations. |

---

## 2. Architectural Boundaries

- Packages in `packages/` are standalone, reusable libraries.
- `@innostes/ui` has zero knowledge of ERP modules, databases, or API routes. It must never import from `kernel/`, `modules/`, `plugins/`, or `apps/`.
- Boundary violations are continuously checked and prevented via `pnpm run arch-check`.

---

## 3. License

Open-source software licensed under the **[MIT License](../LICENSE)**.
