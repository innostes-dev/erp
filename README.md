# Innostes Business OS (Blueprint)

Nx monorepo scaffold for a modular business operating system with multi-tenant kernel, dynamic module discovery, and a smart virtual bridge for inter-module communication.

## Folder Structure

```text
apps/
  api-gateway/                 # NestJS orchestration layer
  os-shell/                    # Next.js App Router shell UI
  marketing-site/              # Public site + developer docs (/docs)
libs/
  core/
    database/                  # Drizzle kernel + tenancy helpers
    bridge/                    # Virtual Service Bridge + @PublicApi
    design-system/             # Luxis tokens shared with Tailwind
  modules/
    hrms/
      feature-ui/              # HRMS manifest (name, color, nav)
      api-logic/               # HRMS public service endpoints
      data-access/             # HRMS tenant-scoped tables
```

## Architectural Rules

- Every query is scoped by `tenant_id` using `withTenant`.
- Modules are discovered from `module_registry` for the active tenant.
- Cross-module calls go through `ModuleBridge.invoke(...)`.
- If target module is disabled or unloaded, bridge returns `null` gracefully.
- Nx boundaries are enforced in `.eslintrc.base.json`.

## Next Steps

1. Run `npm install`.
2. Add Drizzle migrations for kernel and module tables.
3. Set `DATABASE_URL` in `.env`.
4. Start backend: `npm run dev:api`.
5. Start frontend: `npm run dev:shell`.
6. Start docs/marketing: `npm run dev:marketing`.

## Generate a New Module

Run:

`npm run generate:module -- --id finance --name Finance --theme "#0ea5e9"`

This scaffolds:

- `libs/modules/<id>/feature-ui` (manifest + UI metadata)
- `libs/modules/<id>/data-access` (tenant-scoped table scaffold)
- `libs/modules/<id>/api-logic` (`@PublicApi` service scaffold)
- `apps/os-shell/src/app/(suite)/<id>/page.tsx` (frontend module page)
- auto-registration in `apps/api-gateway/src/app/module-catalog.ts`
