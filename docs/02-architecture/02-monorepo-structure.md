# 02 - Monorepo Structure

We use **Nx** to manage our codebase as a single Monorepo. This structure solves the traditional problems of multi-repo setups (version mismatch, duplicated configs, painful refactoring) while enforcing strict dependency boundaries.

## The Directory Tree

```text
testerp/
├── apps/                        # Deployable Hosts
│   ├── api-gateway/             # (Kernel) NestJS Backend Host
│   ├── os-shell/                # (Shell) Next.js Frontend Host
│   └── marketing-site/          # Public-facing Next.js site
│
└── libs/                        # Reusable Modules (90% of our code)
    ├── core/                    # Shared infrastructure
    │   └── design-system/       # Global UI tokens and themes
    │
    └── modules/                 # Business Domains
        └── hrms/                # The HRMS Domain
            ├── feature-ui/      # React Views & Manifests
            ├── api-logic/       # NestJS Controllers & Services
            └── data-access/     # Database Schemas (Drizzle ORM)
```

## Apps vs. Libs

### `apps/`
Applications are essentially empty shells. They should contain **almost zero business logic**. 
Their only job is to import code from `libs/`, wire it together, configure the environment (ports, DB connections), and serve it.

### `libs/`
Libraries are where the actual work happens. By breaking our code into libraries, we can:
- **Test in Isolation**: Run unit tests on the HRMS API without booting the whole server.
- **Cache Builds**: Nx caches the output of libraries. If you change a UI component, the database library doesn't need to be recompiled.
- **Enforce Boundaries**: Using ESLint, we prevent `feature-ui` from directly accessing `data-access`, forcing all communication through proper API channels.
