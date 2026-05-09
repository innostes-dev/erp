# 01 - Frontend Architecture

The frontend of a module is built using React and lives in the `feature-ui` library. 

## The `feature-ui` Library
When you generate a `feature-ui` library, you are creating a sandbox for your module's visual components. 

```bash
npx nx g @nx/react:lib feature-ui --directory=libs/modules/inventory
```

### Strict Boundaries
- **No Backend Code**: You must not import from `api-logic` or `data-access`. All data fetching must be done over HTTP (using standard `fetch` or a client like React Query).
- **No Local Theming**: Do not define custom CSS variables for colors. You must use the unified design tokens provided by `@innostes/core/design-system` and the `@luxis-ui/react` component library.

## How it Connects to the Shell
Your module is not a standalone app; it runs inside the `os-shell` (Next.js App Router). 

1. **Manifest**: Your library exports a `manifest.ts` file. The Shell uses this to build the sidebar navigation dynamically.
2. **Routes**: You map the URLs defined in your manifest to physical Next.js page components inside the `apps/os-shell/src/app/(suite)/[appId]` directory.
