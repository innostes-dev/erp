# 04 – Building block view (arc42 §5): containers, components, plug-in contract

## Role

You are the lead architect for the platform's structure. Document how the system decomposes, level
by level, exactly as the code is built, and the contract that every plug-in must follow.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md` (the recovered architecture and the items owned by 04), the
existing `overview.mdx`, `kernel.mdx` and `plugins.mdx`, `project-structure.mdx`, and the code of
`apps/api-server/app/engine/*`, `kernel/backend/kernel/core/module/*`, `apps/web-app/src` and
`kernel/frontend/src`.

## Pages

1. **Container view** (C4 level 2): the web app (browser SPA), the API server, the Postgres database,
   the SMTP server (external), and the docs site if relevant to operators. Responsibilities,
   technology and the protocols between them. Each container links to its app page in
   `dev-docs/apps/`.
2. **Backend engine components** (C4 level 3 for api-server): the server factory, lifespan,
   middleware stack (in its real order), module loader and registry, the health and config
   endpoints, and error mapping. Each component names its file.
3. **UI engine components** (C4 level 3 for web-app): app bootstrap, routing, authentication and the
   session, the app shell, and how kernel frontend pages are rendered today. Mark the planned page
   and menu registry clearly as planned (D7, A6).
4. **Kernel** (level 3): its backend packages (`core/*`, `auth`, `setup`, `tenancy`, `user`) and its
   frontend parts, with each one's responsibility and its allowed dependencies. Show the layering
   inside a feature (router → service → model, schemas), and link to the fitness-function contracts
   that enforce it.
5. **The plug-in contract** (reference page):
   - exactly what a backend plug-in must provide: the `BaseModule` subclass, its attributes
     (`openapi_tags`, router, migrations path), registration and discovery, and the lifecycle hooks
   - what a frontend plug-in must provide
   - the package layout, naming and versioning
   - what the engines guarantee to a plug-in, and what a plug-in must never do (the dependency
     rules, each linked to its fitness function)
   - This replaces the scattered contract text in `plugins.mdx`. Keep how-to steps in the existing
     `building-a-feature.mdx` guide, linked from here.
6. **Module catalogue** (generated):
   - a script reads the module registry (backend) and the workspace packages (frontend), and
     generates a table per plug-in: name, description, tags, routes count, tables, migrations
     path and frontend package
   - a stale check is added to the gates from prompt 02
   - Only real modules appear.

## Rules

- Every element in a diagram exists in code, under its code name (D3).
- Every rule is linked to its enforcement (A5, F4).
- Remove the facts these pages now own from `kernel.mdx`, `plugins.mdx` and `overview.mdx` (A8),
  and keep redirects.

## Definition of done

- The building block pages and the generated catalogue exist, and pass A, D and F.
- The gates pass.
- Commit as `docs(arch): building block view and plug-in contract`.
- STANDARDS §7 is met.
