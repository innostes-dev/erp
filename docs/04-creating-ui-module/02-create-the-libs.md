# Step 2 — Create the Library Folder Structure

This step creates the four sub-libraries for the Payments module without relying on any Nx generator. Everything is plain files.

---

## 1. Create the directory tree

Run this from the monorepo root:

```bash
mkdir -p libs/modules/payments/feature/src/lib
mkdir -p libs/modules/payments/ui/src/lib
mkdir -p libs/modules/payments/data-access/src/lib
mkdir -p libs/modules/payments/utils/src/lib
```

Or as a single command:

```bash
mkdir -p libs/modules/payments/{feature,ui,data-access,utils}/src/lib
```

After this command the tree looks like:

```
libs/modules/payments/
├── feature/
│   └── src/
│       └── lib/
├── ui/
│   └── src/
│       └── lib/
├── data-access/
│   └── src/
│       └── lib/
└── utils/
    └── src/
        └── lib/
```

---

## 2. Create `project.json` for each sub-library

Nx discovers libraries by scanning for `project.json` files. Each file tells Nx the project name, where the source lives, and what tags apply (used for lint boundary rules).

### `libs/modules/payments/feature/project.json`

```json
{
  "name": "modules-payments-feature",
  "$schema": "../../../../node_modules/nx/schemas/project.json",
  "sourceRoot": "libs/modules/payments/feature/src",
  "projectType": "library",
  "tags": ["type:feature", "scope:payments", "platform:web"]
}
```

### `libs/modules/payments/ui/project.json`

```json
{
  "name": "modules-payments-ui",
  "$schema": "../../../../node_modules/nx/schemas/project.json",
  "sourceRoot": "libs/modules/payments/ui/src",
  "projectType": "library",
  "tags": ["type:ui", "scope:payments", "platform:web"]
}
```

### `libs/modules/payments/data-access/project.json`

```json
{
  "name": "modules-payments-data-access",
  "$schema": "../../../../node_modules/nx/schemas/project.json",
  "sourceRoot": "libs/modules/payments/data-access/src",
  "projectType": "library",
  "tags": ["type:data-access", "scope:payments", "platform:web"]
}
```

### `libs/modules/payments/utils/project.json`

```json
{
  "name": "modules-payments-utils",
  "$schema": "../../../../node_modules/nx/schemas/project.json",
  "sourceRoot": "libs/modules/payments/utils/src",
  "projectType": "library",
  "tags": ["type:util", "scope:payments", "platform:web"]
}
```

**Tag conventions used across the repo:**

| Tag | Meaning |
|---|---|
| `type:feature` | Page-level components — may import all other types |
| `type:ui` | Dumb presentational components — may not import `type:feature` or `type:data-access` |
| `type:data-access` | API calls and hooks — may not import `type:feature` or `type:ui` |
| `type:util` | Pure functions — may not import any other `type:*` |
| `scope:payments` | Owned by this module; cross-scope imports are restricted |
| `platform:web` | Browser-only; cannot be imported from Node-only code |

---

## 3. Create `tsconfig.json` for each sub-library

Each lib needs a `tsconfig.json` that extends the root `tsconfig.base.json` and a `tsconfig.lib.json` that narrows it to the actual source files.

### `libs/modules/payments/feature/tsconfig.json`

```json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "files": [],
  "include": [],
  "references": [{ "path": "./tsconfig.lib.json" }]
}
```

### `libs/modules/payments/feature/tsconfig.lib.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../../dist/out-tsc",
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

The other three sub-libraries use the identical pair of files — only the `extends` depth changes if you nest deeper. For `ui`, `data-access`, and `utils` the `tsconfig.json` and `tsconfig.lib.json` are word-for-word identical to the ones above because they sit at the same directory depth (`libs/modules/payments/<sub-lib>/`).

Create them now:

```bash
# ui
cp libs/modules/payments/feature/tsconfig.json     libs/modules/payments/ui/tsconfig.json
cp libs/modules/payments/feature/tsconfig.lib.json libs/modules/payments/ui/tsconfig.lib.json

# data-access
cp libs/modules/payments/feature/tsconfig.json     libs/modules/payments/data-access/tsconfig.json
cp libs/modules/payments/feature/tsconfig.lib.json libs/modules/payments/data-access/tsconfig.lib.json

# utils
cp libs/modules/payments/feature/tsconfig.json     libs/modules/payments/utils/tsconfig.json
cp libs/modules/payments/feature/tsconfig.lib.json libs/modules/payments/utils/tsconfig.lib.json
```

---

## 4. Create the public entry-point `src/index.ts` for each sub-library

These files are the **only** files other libraries may import from. Everything internal stays in `src/lib/`. Start each with a comment so the file is not empty (TypeScript will error on a completely empty `.ts` file if `isolatedModules` is on).

### `libs/modules/payments/feature/src/index.ts`

```typescript
export { PaymentsDashboard } from './lib/payments-dashboard';
```

You will create `payments-dashboard.tsx` in the next step. For now the file can reference it — TypeScript will only error if you actually build before the file exists.

### `libs/modules/payments/ui/src/index.ts`

```typescript
export { StatCard } from './lib/stat-card';
```

### `libs/modules/payments/data-access/src/index.ts`

```typescript
export { fetchPaymentsSummary } from './lib/payments.api';
export type { PaymentsSummary, PaymentMetric } from './lib/payments.api';
```

### `libs/modules/payments/utils/src/index.ts`

```typescript
export { formatCurrency, calcPercentChange } from './lib/payments.utils';
```

---

## 5. Add the four path aliases to `tsconfig.base.json`

Open `tsconfig.base.json` at the monorepo root. Find the `"paths"` object and append four new entries **inside** the same object — do not replace existing entries.

```jsonc
// tsconfig.base.json — "paths" section (existing entries omitted for clarity)
{
  "compilerOptions": {
    "paths": {
      // ... existing entries ...

      "@mono/modules/payments/feature":     ["libs/modules/payments/feature/src/index.ts"],
      "@mono/modules/payments/ui":          ["libs/modules/payments/ui/src/index.ts"],
      "@mono/modules/payments/data-access": ["libs/modules/payments/data-access/src/index.ts"],
      "@mono/modules/payments/utils":       ["libs/modules/payments/utils/src/index.ts"]
    }
  }
}
```

After saving, TypeScript and your editor's IntelliSense will immediately resolve `@mono/modules/payments/*` imports across the entire monorepo.

---

## 6. Verify the final folder tree

```
libs/modules/payments/
├── data-access/
│   ├── project.json
│   ├── tsconfig.json
│   ├── tsconfig.lib.json
│   └── src/
│       ├── index.ts
│       └── lib/
│           └── payments.api.ts          ← created in step 6
├── feature/
│   ├── project.json
│   ├── tsconfig.json
│   ├── tsconfig.lib.json
│   └── src/
│       ├── index.ts
│       └── lib/
│           └── payments-dashboard.tsx   ← created in step 3
├── ui/
│   ├── project.json
│   ├── tsconfig.json
│   ├── tsconfig.lib.json
│   └── src/
│       ├── index.ts
│       └── lib/
│           └── stat-card.tsx            ← created in step 3
└── utils/
    ├── project.json
    ├── tsconfig.json
    ├── tsconfig.lib.json
    └── src/
        ├── index.ts
        └── lib/
            └── payments.utils.ts        ← created in step 6
```

---

## Quick-check: confirm Nx sees the projects

```bash
pnpm nx show projects | grep payments
```

Expected output:

```
modules-payments-feature
modules-payments-ui
modules-payments-data-access
modules-payments-utils
```

If nothing appears, confirm that each `project.json` is saved and that the `$schema` path resolves (i.e. `node_modules/nx/schemas/project.json` exists four levels up from each file).

---

## Next steps

Continue with [03 — Build the feature component](./03-build-the-feature-component.md).
