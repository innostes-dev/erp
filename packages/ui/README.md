# @innostes/ui

> Design System component library for the Innostes ERP platform, built with **React**, **TypeScript**, **Tailwind CSS v4**, and **Base UI**.

Designed to be consumed internally within the monorepo workspace or published as a standalone NPM package.

---

## 🏗️ Architecture & Structure

The package is structured around two main concepts: **Components** (atomic primitives) and **Widgets** (composite UI blocks).

```
packages/ui/
├── src/
│   ├── components/       # Atomic design system components (Button, Input, Card, etc.)
│   │   └── button/       # Button component (built with Base UI + Tailwind)
│   ├── widgets/          # Higher-level composite UI widgets (Data tables, Forms, Cards)
│   ├── lib/              # Internal utilities (cn class merge helper)
│   ├── styles/           # Global styles and Tailwind design tokens
│   │   └── globals.css   # Main CSS entry point
│   └── index.ts          # Main package export barrel
├── dist/                 # Compiled ESM, CJS, declaration files (.d.ts), & styles.css
├── tsup.config.ts        # Library bundler config
├── tsconfig.json         # TypeScript config
└── package.json          # NPM package config & export maps
```

---

## 📦 Export Subpaths

| Import Path | Description |
| :--- | :--- |
| `@innostes/ui` | Main entry point exporting all components & widgets |
| `@innostes/ui/components` | Atomic component primitives only |
| `@innostes/ui/widgets` | Composite widgets only |
| `@innostes/ui/styles.css` | Built CSS stylesheet containing Tailwind design tokens |

---

## 🚀 Usage

### 1. In standard React / Next.js / Vite project:

Import the compiled CSS stylesheet in your app entry point (`main.tsx` or `_app.tsx`):
```tsx
import "@innostes/ui/styles.css";
```

Import and use components:
```tsx
import { Button } from "@innostes/ui";
import { Send } from "lucide-react";

export function Example() {
  return (
    <div className="flex gap-4 p-4">
      <Button variant="primary">Primary Action</Button>
      <Button variant="secondary" rightIcon={<Send className="w-4 h-4" />}>
        Send Email
      </Button>
      <Button variant="outline" isLoading>
        Saving...
      </Button>
    </div>
  );
}
```

---

## 🛠️ Development & Build Commands

```bash
# Build package (bundle ESM, CJS, TypeScript types, and Tailwind CSS)
pnpm --filter @innostes/ui run build

# Run build in watch mode
pnpm --filter @innostes/ui run dev

# Check TypeScript types
pnpm --filter @innostes/ui run check-types
```

---

## 🚢 Publishing to NPM

1. Bump `version` in `packages/ui/package.json`.
2. Build the package:
   ```bash
   pnpm --filter @innostes/ui run build
   ```
3. Publish to NPM registry:
   ```bash
   npm publish --access public
   ```
