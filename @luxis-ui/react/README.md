<div align="center">

<img src="https://luxisui.com/img/logo.webp" alt="Luxis UI" width="120" style="padding:20px"/>

**A React component library built for real products — accessible, themeable, and TypeScript-native.**

[![npm version](https://img.shields.io/npm/v/@luxis-ui/react?color=0c6b58&style=flat-square)](https://www.npmjs.com/package/@luxis-ui/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18+-61dafb?style=flat-square)](https://react.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)

[Documentation](https://luxisui.com) · [Components](https://luxisui.com/docs/components) · [Storybook](https://storybook.luxisui.com) · [Changelog](./CHANGELOG.md) · [Innostes Solutions](https://innostes-solutions.com)

</div>

---

## Table of Contents

- [Why Luxis UI](#why-luxis-ui)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Framework Setup](#framework-setup)
  - [Next.js App Router](#nextjs-app-router)
  - [Next.js Pages Router](#nextjs-pages-router)
  - [Vite + React](#vite--react)
- [Theming](#theming)
  - [Custom Colors](#custom-colors)
  - [Auto Color Palette Generation](#auto-color-palette-generation)
  - [CSS Variables Override](#css-variables-override)
  - [Dark Mode](#dark-mode)
- [ThemeProvider Props](#themeprovider-props)
- [useThemeContext Hook](#usethemecontext-hook)
- [Design Tokens](#design-tokens)
- [Framework Adapters](#framework-adapters)
- [TypeScript](#typescript)
- [Migrating from Other Libraries](#migrating-from-other-libraries)
- [Contributing](#contributing)
- [License](#license)

---

## Why Luxis UI

Most component libraries make you choose between flexibility and simplicity. Luxis UI tries not to force that trade-off.

Theming is handled entirely through CSS custom properties — there's no runtime style injection, no theme object merging, and no re-renders when you switch modes. Pass one hex color and you get a full 10-shade scale automatically. Override a single token in CSS and it propagates everywhere without touching your components.

A few other things worth knowing:

- **Accessible by default.** Every component ships with proper ARIA roles, keyboard navigation, and focus management. WCAG 2.1 AA compliance isn't a checkbox — it's part of the component contract.
- **Tree-shakeable.** Everything is a named export. You only pay for what you import.
- **Framework adapters.** Register your `Link` and `Image` components once on `ThemeProvider` and every component in the tree uses them. No per-component wiring.
- **Toasts included.** A global toast container is mounted by `ThemeProvider`. No separate provider or setup needed.
- **Compound components.** Accordion, Select, Dialog, and similar components expose composable sub-component APIs so you can control structure without fighting abstractions.
- **TypeScript throughout.** Props, design tokens, hook return values — all typed and exported for use in your own code.

---

## Requirements

| Peer dependency | Version |
|----------------|---------|
| `react` | `^18.0.0` |
| `react-dom` | `^18.0.0` |

---

## Installation

```bash
npm install @luxis-ui/react
# or
yarn add @luxis-ui/react
# or
pnpm add @luxis-ui/react
```

---

## Quick Start

Wrap your app with `ThemeProvider` once at the root, then import and use components anywhere in the tree:

```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@luxis-ui/react';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

```tsx
// App.tsx
import { Button, Input, Badge } from '@luxis-ui/react';

export default function App() {
  return (
    <main>
      <Badge variant="success">Live</Badge>
      <Input label="Email address" placeholder="you@company.com" />
      <Button variant="primary">Get Started</Button>
    </main>
  );
}
```

> `ThemeProvider` should appear exactly once at your app root. Nesting multiple instances isn't supported and will cause unexpected behavior.

---

## Framework Setup

### Next.js App Router

`ThemeProvider` is a client component. In the App Router, you can't import it directly inside a Server Component, so you'll need a small client wrapper:

```tsx
// app/providers.tsx
'use client';

import { ThemeProvider } from '@luxis-ui/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider initialMode="light">{children}</ThemeProvider>;
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@luxis-ui/react';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

### Vite + React

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@luxis-ui/react';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
```

---

## Theming

There are three ways to customize the visual style of Luxis UI components, and they can be combined freely:

- **CSS variables** — Edit `--lxs-*` properties directly in a stylesheet. Good for quick brand adjustments or when you want theming fully decoupled from your JavaScript.
- **`customTokens` on `ThemeProvider`** — The recommended approach for full brand implementations. Supports auto-generated color palettes.
- **Inline `style` prop** — Useful when you need to override tokens for a single component instance without affecting anything else.

### Custom Colors

```tsx
import { ThemeProvider, createCustomTokens } from '@luxis-ui/react';

const tokens = createCustomTokens({
  colors: {
    primary:   '#6d28d9',
    secondary: '#059669',
  },
  borderRadius: {
    md: '0.5rem',
    lg: '1rem',
  },
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, sans-serif",
    },
  },
});

<ThemeProvider customTokens={tokens}>
  <App />
</ThemeProvider>
```

### Auto Color Palette Generation

You don't need to define a full color scale manually. Luxis UI can generate one from a single base color, or fill in the gaps if you only want to pin specific shades:

```tsx
// Option A — One hex value → all 10 shades generated automatically (50–900)
createCustomTokens({ colors: { primary: '#6d28d9' } });

// Option B — Pin the shades that matter most; the rest are derived from shade 500
createCustomTokens({
  colors: {
    primary: {
      500: '#6d28d9',   // base shade — used to generate anything not specified
      600: '#5b21b6',   // hover state
      700: '#4c1d95',   // active/pressed state
    },
  },
});

// Option C — Provide the full scale yourself
createCustomTokens({
  colors: {
    primary: {
      50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff',
      300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7',
      600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87',
    },
  },
});
```

### CSS Variables Override

If you'd rather not touch JavaScript at all, every token is available as a CSS custom property. Import your overrides in a global stylesheet and they'll take effect immediately:

```css
/* brand.css */
:root {
  --lxs-color-primary-500: #6d28d9;
  --lxs-color-primary-600: #5b21b6;
  --lxs-font-family-sans: 'Inter', sans-serif;
  --lxs-radius-md: 0.5rem;
}

[data-theme='dark'] {
  --lxs-color-primary-500: #a78bfa;
}
```

To scope an override to a single component instance, use the `style` prop:

```tsx
<Button style={{ '--lxs-color-primary-500': '#dc2626' } as React.CSSProperties}>
  Delete Account
</Button>
```

### Dark Mode

Use the `useThemeContext` hook to read and update the current color mode:

```tsx
import { useThemeContext } from '@luxis-ui/react';

function ThemeToggle() {
  const { theme, setMode } = useThemeContext();
  return (
    <button
      onClick={() => setMode(theme.mode === 'light' ? 'dark' : 'light')}
      aria-pressed={theme.mode === 'dark'}
      aria-label="Toggle dark mode"
    >
      {theme.mode === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
```

To persist the user's preference across page loads, store it in `localStorage` and restore it as `initialMode`:

```tsx
'use client';
import { useState, useEffect } from 'react';
import { ThemeProvider, useThemeContext } from '@luxis-ui/react';

function ThemePersister() {
  const { theme } = useThemeContext();
  useEffect(() => {
    localStorage.setItem('theme-mode', theme.mode);
  }, [theme.mode]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [initialMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme-mode') as 'light' | 'dark') ?? 'light';
  });
  return (
    <ThemeProvider initialMode={initialMode}>
      <ThemePersister />
      {children}
    </ThemeProvider>
  );
}
```

---

## ThemeProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | — | Your app subtree |
| `initialMode` | `'light' \| 'dark'` | `'light'` | Starting color scheme |
| `customTokens` | `CustomTokens` | `undefined` | Token overrides — pass hex string for auto palette generation |
| `defaultSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | Global default size for all components |
| `colorContrast` | `ColorContrastConfig` | see below | Per-variant text contrast config |
| `toastPosition` | `ToastPosition` | `'top-right'` | Global toast container position |
| `toastLimit` | `number` | `5` | Max simultaneous toasts |
| `disableToasts` | `boolean` | `false` | Disable toast container entirely |
| `linkComponent` | `React.ElementType` | `undefined` | Framework link adapter |
| `imageComponent` | `React.ElementType` | `'img'` | Framework image adapter |

**Default `colorContrast` values:**

| Variant | Default | Notes |
|---------|---------|-------|
| `primary` | `'dark'` | Assumes a dark background — renders white text |
| `secondary` | `'dark'` | Same assumption as primary |
| `outline` | `'light'` | Transparent background — uses dark text |
| `ghost` | `'light'` | Transparent background — uses dark text |
| `danger` | `'dark'` | Dark red background — renders white text |
| `success` | `'dark'` | Dark green background — renders white text |
| `warning` | `'dark'` | Dark amber background — renders white text |
| `info` | `'dark'` | Dark blue background — renders white text |

> If your brand's primary color is light or pastel, set `colorContrast={{ primary: 'light' }}` to ensure readable text contrast.

---

## useThemeContext Hook

Access the current theme state and update functions from anywhere inside a `ThemeProvider` subtree:

```tsx
import { useThemeContext } from '@luxis-ui/react';

const { theme, setMode, setDefaultSize } = useThemeContext();

theme.mode           // 'light' | 'dark'
theme.defaultSize    // 'sm' | 'md' | 'lg'
theme.tokens.colors.primary[500]  // Resolved hex string

setMode('dark');
setDefaultSize('sm');
```

> This hook throws if called outside of a `ThemeProvider`. If you're seeing that error, check that your provider is mounted above the component in the tree.

---

## Design Tokens

All `--lxs-*` variables are injected into `:root` automatically when you import the library. You can reference or override any of them in your own CSS.

```css
/* Colors */
--lxs-color-primary-[50–900]
--lxs-color-secondary-[50–900]
--lxs-color-neutral-[50–900]       /* Inverts in dark mode */
--lxs-color-[success|warning|error|info]-[50|500|600|700]
--lxs-text-[primary|secondary|tertiary|disabled]
--lxs-background-[primary|secondary|hover|active]
--lxs-border-color

/* Spacing — 4px base unit */
--lxs-spacing-[0|1|2|3|4|5|6|8|10|12|16|20|24]

/* Typography */
--lxs-font-family-[sans|mono]
--lxs-font-size-[xs|sm|base|lg|xl|2xl|3xl|4xl]
--lxs-font-weight-[normal|medium|semibold|bold]
--lxs-line-height-[tight|snug|normal|relaxed]

/* Border Radius */
--lxs-radius-[none|sm|base|md|lg|xl|2xl|full]

/* Shadows */
--lxs-shadow-[none|sm|base|md|lg|xl]

/* Transitions */
--lxs-transition-[fast|base|slow]

/* Z-Index */
--lxs-z-[dropdown|sticky|modal|tooltip|notification]
/* 1000  |  1100  | 1200 |  1300   |     1400       */
```

---

## Framework Adapters

Instead of wiring up `Link` or `Image` individually per component, register your framework's implementations once on `ThemeProvider`. Everything in the tree picks them up automatically:

```tsx
// Next.js
import Link from 'next/link';
import Image from 'next/image';

<ThemeProvider linkComponent={Link} imageComponent={Image}>
  <App />
</ThemeProvider>

// React Router
import { Link } from 'react-router-dom';

<ThemeProvider linkComponent={Link}>
  <App />
</ThemeProvider>
```

---

## TypeScript

All public types are exported from the main entry point:

```ts
import type {
  ThemeProviderProps,
  Theme,
  ThemeContextValue,
  Size,                   // 'sm' | 'md' | 'lg'
  ColorContrast,          // 'light' | 'dark'
  ColorContrastConfig,
  Tokens,
  CustomTokens,
  CustomColors,
  ColorPalette,
  ColorScale,
  ColorShade,
} from '@luxis-ui/react';
```

---

## Migrating from Other Libraries

The mental model is straightforward: where other libraries require a theme object, Luxis UI takes a `customTokens` object created with `createCustomTokens`. Color palettes are generated automatically, so you typically only need to supply your brand colors.

### From MUI (Material UI)

```tsx
// Before
import { ThemeProvider, createTheme } from '@mui/material';
const theme = createTheme({ palette: { primary: { main: '#6d28d9' } } });
<ThemeProvider theme={theme}><App /></ThemeProvider>

// After
import { ThemeProvider, createCustomTokens } from '@luxis-ui/react';
const tokens = createCustomTokens({ colors: { primary: '#6d28d9' } });
<ThemeProvider customTokens={tokens}><App /></ThemeProvider>
```

### From Chakra UI

```tsx
// Before
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
const theme = extendTheme({ colors: { brand: { 500: '#6d28d9' } } });
<ChakraProvider theme={theme}><App /></ChakraProvider>

// After
import { ThemeProvider, createCustomTokens } from '@luxis-ui/react';
const tokens = createCustomTokens({ colors: { primary: '#6d28d9' } });
<ThemeProvider customTokens={tokens}><App /></ThemeProvider>
```

---

## Contributing

Pull requests are welcome. If you're planning a larger change, opening an issue first to discuss the approach saves everyone time.

```bash
git clone https://github.com/luxis-ui/react.git
cd react
pnpm install
pnpm dev      # Storybook at http://localhost:6006
pnpm test     # Run tests
```

Please review the [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing, and report any security concerns privately through the process described in [SECURITY.md](./SECURITY.md).

---

## License

MIT — Copyright (c) 2026 [Innostes Solutions](https://innostes-solutions.com)

See [LICENSE](./LICENSE) for the full text. Free to use in personal, commercial, and open source projects.

---

<div align="center">

Built by [Innostes Solutions](https://innostes-solutions.com)

[Website](https://innostes-solutions.com) · [npm](https://www.npmjs.com/package/@luxis-ui/react) · [Documentation](https://luxisui.com) · [GitHub](https://github.com/luxis-ui/react)
</div>
