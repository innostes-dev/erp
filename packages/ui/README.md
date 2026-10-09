# @innostes/ui

> Design System component library for the Innostes ERP platform, built with **React**, **TypeScript**, **Tailwind CSS v4**, and **Base UI**.

Designed to be consumed internally within the monorepo workspace or published as a standalone NPM package.

---

## 🏗️ Architecture & Theme Integration

`@innostes/ui` uses a **dual-mode flexible theme system** designed to adapt seamlessly to any consuming website's Tailwind configuration and theme.

```
packages/ui/
├── src/
│   ├── components/       # Atomic design system components (Button, Input, Card, etc.)
│   ├── widgets/          # Higher-level composite UI widgets
│   ├── lib/              # Internal utilities (cn class merge helper)
│   ├── styles/           # Global styles & Tailwind design tokens
│   │   ├── theme.css     # Pure Tailwind v4 @theme token mappings
│   │   ├── variables.css # Default CSS custom properties (:root & .dark)
│   │   └── globals.css   # Main compiled CSS entry point
│   └── index.ts          # Main package export barrel
├── preset.js             # Tailwind v3 / JS config preset helper
├── dist/                 # Compiled ESM, CJS, declaration files (.d.ts), & styles.css
└── package.json          # NPM package config & export maps
```

---

## 📦 Export Subpaths

| Import Path | Description |
| :--- | :--- |
| `@innostes/ui` | Main entry point exporting all components & widgets |
| `@innostes/ui/components` | Atomic component primitives only |
| `@innostes/ui/widgets` | Composite widgets only |
| `@innostes/ui/theme.css` | Pure `@theme` token definitions for Tailwind v4 host apps |
| `@innostes/ui/variables.css` | Baseline `:root` and `.dark` CSS custom properties |
| `@innostes/ui/styles.css` | Pre-compiled CSS stylesheet (includes default variables & utilities) |
| `@innostes/ui/preset` | Tailwind preset for projects using `tailwind.config.js` |

---

## 🎨 Website Theme Integration Strategies

### Option A: Tailwind CSS v4 Host Website (Recommended)

In your host website's main CSS file (`index.css` or `globals.css`), import the design system theme:

```css
@import "tailwindcss";
@import "@innostes/ui/theme.css";

/* Website custom theme overrides */
:root {
  --primary: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

### Option B: Runtime CSS Custom Property Overrides

Any host website can customize components globally or locally by defining CSS variables on `:root`, `.dark`, or on a parent container:

```css
/* Custom website brand theme */
:root {
  --primary: 142.1 76.2% 36.3%; /* Emerald Green */
  --primary-foreground: 355.7 100% 97.3%;
  --radius: 0.75rem;
}
```

Or scoped to a specific card or section:

```tsx
<div style={{ '--primary': '262.1 83.3% 57.8%' }}>
  <Button variant="primary">Deep Purple Button</Button>
</div>
```

### Option C: Tailwind v3 (`tailwind.config.js`) Host Website

In your host website's `tailwind.config.js`:

```js
module.exports = {
  presets: [require("@innostes/ui/preset")],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@innostes/ui/dist/**/*.js",
  ],
};
```

### Option D: Standalone Pre-built CSS Import

For websites without Tailwind CSS compilation:

```tsx
import "@innostes/ui/styles.css";
```

---

## 🚀 Usage Example

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
