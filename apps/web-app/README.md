# Innostes Business OS: Web App

The turnkey, responsive web application and UI engine for the **Innostes Business Operating System (Business OS)**.

`apps/web-app` is a modern single-page application built with **React 19**, **Vite 8**, **TypeScript**, and the **@innostes/ui** enterprise design system (powered by **Base UI** and **Tailwind CSS v4**). It delivers an instant, day-one administrative workspace for organizations that prefer a turnkey experience over building their own custom frontend.

---

## 1. Key Features

- **Decoupled UI Engine**: Completely separated from the FastAPI backend. Communicates strictly over standard REST / OpenAPI 3.1 contracts.
- **Dynamic Module Manifest Registry**: Dynamically discovers and mounts business modules (`@innostes/peopleops`, `@innostes/salesflow`) and developer plugins (`@innostes/tracura`). Modules register their routes, navigation icons, sub-features, and views without touching core app shell code.
- **Enterprise App Shell**:
  - Collapsible responsive sidebar with active route highlighting.
  - System-wide **App Switcher** to seamlessly jump between business suites and developer tools.
  - Header actions: global search trigger, notifications drawer, organization switcher, and user profile menu.
- **First-Run Setup Gate (`<SetupGate>`)**: Automatically inspects `GET /setup/status`. On fresh installations, it lazy-loads the `@innostes/kernel` setup wizard for initial administrator onboarding and token validation before unlocking the workspace.
- **Dual Theming & Accessibility**: Out-of-the-box light and dark themes using OKLCH color palettes, meeting APCA/WCAG 2.1 AA contrast requirements and full keyboard roving tabindex navigation.

---

## 2. Dynamic Module Registry Architecture

```
                  ┌─────────────────────────────┐
                  │        apps/web-app         │
                  │   (App Shell & Providers)   │
                  └──────────────┬──────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
 ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
 │@innostes/salesflow│ │@innostes/peopleops│ │ @innostes/tracura │
 │ (Deals & Pipeline)│ │(Team & Workforce) │ │ (API Telemetry)   │
 └───────────────────┘ └───────────────────┘ └───────────────────┘
```

Each registered module exports a standard `manifest` conforming to the platform module contract:
- `id`: Unique module identifier (e.g. `'salesflow'`, `'peopleops'`).
- `name`: Display name rendered in the App Switcher.
- `href`: Root route mounted in the application router.
- `subFeatures`: Navigation tabs or nested sub-pages.
- `component`: React component rendered for the module workspace.

---

## 3. Environment Configuration

Create or modify `apps/web-app/.env` (or configure via root `.env`):

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8001` | Base URL of the Innostes API Server |
| `VITE_APP_TITLE`| `Innostes Business OS` | Title displayed in browser tab and headers |

---

## 4. Development & Build Commands

```bash
# Start development server with live HMR (http://localhost:4200)
pnpm nx serve web-app

# Type-check TypeScript sources
pnpm nx typecheck web-app

# Compile production bundle (into apps/web-app/dist)
pnpm nx build web-app

# Preview compiled production build (http://localhost:4300)
pnpm nx preview web-app
```

---

## 5. Architectural Invariants

- **Boundary Enforcement**: Web app sources must never import internal server files or direct database models from `apps/api-server` or `kernel/backend`.
- **Design System Usage**: UI components must be imported from `@innostes/ui` or built using standard Tailwind CSS v4 design tokens.
- **Package Aliases**: Workspace modules are referenced through their npm package identifiers (`@innostes/peopleops`, `@innostes/salesflow`, `@innostes/tracura`, `@innostes/kernel`).

---

## 6. License

Open-source software licensed under the **[MIT License](../../LICENSE)**.
