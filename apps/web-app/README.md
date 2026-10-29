# @innostes/web-app

The UI engine for the innostes ERP platform.

## Overview

`web-app` is a single-page application built with React 19 and Vite 8. It functions as a lightweight UI engine providing:
- App shell layout (collapsible sidebar, navigation header, app switcher).
- First-run setup gate (`<SetupGate>`) and authentication gate (`<AuthGate>`).
- Dynamic manifest catalog loading from `@innostes/hrms`, `@innostes/crm`, and `@innostes/api-logger`.
- Dynamic client-side routing via `AppRouter`.

## Commands

```bash
pnpm nx serve web-app        # Dev server on http://localhost:4200
pnpm nx build web-app        # Production build into apps/web-app/dist
pnpm nx preview web-app      # Serve production build on http://localhost:4300
pnpm nx typecheck web-app    # Type-check TypeScript sources
```

## Documentation

Full developer documentation is available at [web-app Developer Guide](apps/landing/content/dev-docs/apps/web-app.mdx).
