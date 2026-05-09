# Feature Comparison Report: Main vs. Master

This report outlines the features, infrastructure, and logic present in the `master` branch that are currently missing or less mature in the `main` branch.

## 1. Technical Infrastructure (Kernel & Shared)
The `master` branch contains a robust "Kernel" layer that provides essential services to all modules.

| Feature | Description in Master | Status in Main |
| :--- | :--- | :--- |
| **Authentication** | Full `AuthProvider` with `useAuth` hook, JWT handling, and login/logout logic. | Missing frontend integration; only basic DB schema exists. |
| **Global State** | Centralized `KernelStore` using Zustand for theme, sidebar state, and locale. | Missing centralized kernel state. |
| **Event Bus** | `mitt`-based event bus for decoupled cross-module communication. | Missing. |
| **App Router** | Wrapper for Next.js router with imperative `navigate()` support outside components. | Missing. |
| **Telemetry** | Abstraction for tracking events, identifying users, and capturing errors. | Missing. |
| **Shared Hooks** | Collection of utility hooks: `useDebounce`, `useLocalStorage`, `useMediaQuery`, etc. | Missing. |
| **HTTP Client** | Axios-based client with built-in auth interceptors and telemetry. | Missing. |

## 2. UI Logic & Shell Features
The shell application in `master` (`apps/shell`) is more feature-complete than the one in `main` (`apps/os-shell`).

| Feature | Description in Master | Status in Main |
| :--- | :--- | :--- |
| **Dynamic Sidebar** | Collapsible sidebar (`ShellNav`) integrated with global state and module registry. | Basic implementation. |
| **Auth Flow UI** | Complete Login and Forgot Password pages and forms. | Placeholder auth page only. |
| **Component Library** | Dedicated `libs/ui` with Button, Badge, Spinner, and ErrorBoundary components. | Very limited UI components. |
| **Icon System** | Centralized icon library (`libs/ui/icons`) for consistent branding. | Missing. |
| **Design Tokens** | Comprehensive design tokens in `libs/ui/tokens`. | Limited tokens in `libs/core/design-system`. |

## 3. API Gateway & Backend Logic
The `api-gateway` in `master` is production-ready with standardized patterns.

| Feature | Description in Master | Status in Main |
| :--- | :--- | :--- |
| **API Documentation** | Automatic Swagger/OpenAPI documentation setup at `/api/docs`. | Missing. |
| **Backend Auth** | JWT Guards, CurrentUser decorators, and full `AuthModule`. | Missing auth logic/guards. |
| **Request/Response** | Global Interceptors for response wrapping and filters for error handling. | Missing standardized envelopes. |
| **Health Checks** | Dedicated health probes for monitoring. | Missing. |

## 4. Tooling & Documentation
`master` follows better monorepo practices and provides more developer guidance.

| Feature | Description in Master | Status in Main |
| :--- | :--- | :--- |
| **NX Generators** | Standard NX Generators for scaffolding modules and services. | Uses a custom `.mjs` script. |
| **Extensive Docs** | Detailed guides on Architecture, API-first workflow, and styling. | Documentation is sparse. |
| **Checklists** | Step-by-step checklists for adding new UI or Backend modules. | Missing. |

## 5. Domain Modules
| Module | Description in Master | Status in Main |
| :--- | :--- | :--- |
| **Analytics** | Full module with Dashboard, Metric Cards, and API integration. | Missing. |
| **HRMS** | Not present in master (old version might have had it elsewhere). | Present in main (new focus). |

## Summary Recommendation
While `main` has the latest `HRMS` module logic, it is missing the entire supporting ecosystem found in `master`. Migrating the **Kernel Infrastructure** (Auth, State, Event Bus) and **API Gateway patterns** (Swagger, Interceptors) should be the priority to bring `main` up to the same level of maturity.
