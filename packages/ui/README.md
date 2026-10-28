# @innostes/ui

Accessible, high-performance React component library for enterprise admin interfaces, built on [Base UI](https://base-ui.com) and styled with [Tailwind CSS](https://tailwindcss.com) design tokens.

[![npm version](https://img.shields.io/npm/v/@innostes/ui.svg?style=flat-square)](https://www.npmjs.com/package/@innostes/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-15%20KB-success.svg?style=flat-square)](https://innostes.com/ui/docs/patterns/performance)
[![CI Status](https://img.shields.io/badge/CI-passing-brightgreen.svg?style=flat-square)](https://github.com/innostes/erp/actions)

---

## Features

- **Enterprise primitives**: Built on Base UI for complete WAI-ARIA compliance, roving tabindex keyboard navigation, and robust focus trapping.
- **Dual theming & Design tokens**: Semantic OKLCH color palettes with APCA/WCAG 2.1 AA compliant contrast. Supports light and dark modes via `.dark` class or `data-theme` attribute.
- **Modular entry points**: Tree-shakable subpaths for heavy dependencies (`@innostes/ui/charts` for Recharts and `@innostes/ui/editor` for Tiptap).
- **With or without Tailwind**: Import CSS variables directly into Tailwind CSS v4 or consume the precompiled `@innostes/ui/styles.css` bundle.
- **RSC & Next.js compatible**: Interactive primitives export `"use client"` directives while pure utility functions (`cn`, `buttonVariants`) remain server-safe.
- **Multi-runtime tested**: Continuously verified across React 17, React 18, and React 19 runtimes.

---

## Installation

```sh
pnpm add @innostes/ui
```

### Peer Dependencies

| Dependency | Required Version | Status |
| :--- | :--- | :--- |
| `react` | `^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0` | Required |
| `react-dom` | `^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0` | Required |
| `tailwindcss` | `^4.0.0` | Optional (if consuming Tailwind tokens) |
| `recharts` | `^2.15.0 \|\| ^3.0.0` | Optional (only for `@innostes/ui/charts`) |
| `@tiptap/*` | `^3.0.0` | Optional (only for `@innostes/ui/editor`) |

---

## Quick Start

### 1. Configure Styles

**With Tailwind CSS v4:**

```css
/* app/globals.css */
@import 'tailwindcss';
@import '@innostes/ui/tailwind.css';
@import '@innostes/ui/dark.css'; /* Optional dark mode */
```

**Without Tailwind CSS:**

```ts
// Root entry or layout
import '@innostes/ui/styles.css';
import '@innostes/ui/dark.css'; // Optional dark mode
```

### 2. Set Up Providers

Wrap your application root with the essential feedback and interaction providers:

```tsx
import { Toaster, TooltipProvider } from '@innostes/ui';

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
```

### 3. Build Interfaces

```tsx
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  toast,
} from '@innostes/ui';

export function OrderModal() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Edit Order</Button>} />
      <DialogContent>
        <DialogTitle>Edit Purchase Order PO-2026-0881</DialogTitle>
        <p className="text-sm text-muted-foreground my-4">
          Update quantity and shipping terms for Northwind Traders Pvt Ltd.
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={() => toast.success('Order PO-2026-0881 updated')}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Entry Points

| Subpath | Purpose | Typical Bundle Footprint |
| :--- | :--- | :--- |
| `@innostes/ui` | Core action, form, overlay, layout, navigation, and data display primitives | ~15 KB raw (3.8 KB gzip) |
| `@innostes/ui/charts` | Cartesian charts, Donut charts, and responsive data visualisations | Peer-dep on Recharts (~0.3 KB raw shim) |
| `@innostes/ui/editor` | Enterprise WYSIWYG rich text editor with toolbar | Peer-dep on Tiptap (~0.1 KB raw shim) |
| `@innostes/ui/tailwind.css` | Design token declarations and source file paths for Tailwind CSS v4 | — |
| `@innostes/ui/theme.css` | Raw CSS variables (light theme) | — |
| `@innostes/ui/dark.css` | Raw CSS variables (dark theme) | — |
| `@innostes/ui/styles.css` | Precompiled, self-contained CSS bundle for standalone applications | ~96 KB raw (15 KB gzip) |
| `@innostes/ui/api.json` | Complete machine-readable TSDoc property schemas | Metadata |

---

## Browser & Runtime Support Matrix

| Environment | Supported Versions | Notes |
| :--- | :--- | :--- |
| **Chromium** (Chrome, Edge, Brave, Opera) | Latest 2 major versions (>= 120) | Fully tested |
| **Firefox** | Latest 2 major versions (>= 120) | Fully tested |
| **Safari** | Latest 2 major versions (macOS/iOS >= 17) | Fully tested |
| **Node.js** | `>= 20.0.0` (LTS 20, 22) | SSR / SSG execution in Next.js & Vite |
| **React** | `17.x`, `18.x`, `19.x` | Verified in dedicated CI test suites |

---

## Documentation

Full interactive documentation, live sandboxes, token visualisers, and design patterns are available at:

👉 **[https://innostes.com/ui/docs](https://innostes.com/ui/docs)**

- [Getting Started & Installation](https://innostes.com/ui/docs/foundations/overview)
- [Design Tokens & Theming](https://innostes.com/ui/docs/foundations/design-tokens)
- [Component Index](https://innostes.com/ui/docs/foundations/component-index)
- [Enterprise Patterns & Dashboards](https://innostes.com/ui/docs/patterns/dashboards)
- [Accessibility & APCA Contrast](https://innostes.com/ui/docs/foundations/accessibility)

---

## Versioning & Governance

`@innostes/ui` adheres strictly to [Semantic Versioning 2.0.0](https://semver.org/). Breaking changes are strictly isolated to major releases accompanied by detailed migration guides in our [Changelog](https://innostes.com/ui/docs/resources/changelog).

- **Vulnerability Reporting**: See [SECURITY.md](./SECURITY.md) or contact `security@innostes.com`.
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

[MIT](./LICENSE) © 2026 Northwind Traders Pvt Ltd & Innostes Technologies Pvt Ltd.
