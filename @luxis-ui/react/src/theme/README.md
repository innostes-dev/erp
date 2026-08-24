# VTX UI Theme System

A comprehensive, customizable theme system built with CSS variables and React Context.

## Features

- 🎨 **Complete Design Token System** - Colors, spacing, typography, shadows, and more
- 🌗 **Light & Dark Mode** - Built-in theme switching with `data-theme` attribute
- 🔧 **Fully Customizable** - Override any token via CSS variables or ThemeProvider
- 📦 **Zero Runtime Overhead** - CSS variables are native browser features
- 🎯 **Type-Safe** - Full TypeScript support for all tokens
- ♿ **Accessible** - WCAG compliant color contrasts

## Quick Start

### 1. Install and Import Base Theme

```tsx
// In your main entry point (App.tsx or index.tsx)
import { ThemeProvider } from '@luxis-ui/react';
import '@luxis-ui/react/theme/base.css'; // Import base CSS variables

function App() {
  return (
    <ThemeProvider initialMode="light">
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. Use Theme-Aware Components

All VTX UI components automatically use the theme:

```tsx
import { Button, Input, Badge } from '@luxis-ui/react';

function MyComponent() {
  return (
    <>
      <Button variant="primary">Styled with theme</Button>
      <Input label="Email" />
      <Badge variant="success">Active</Badge>
    </>
  );
}
```

### 3. Access Theme in Your Code

```tsx
import { useThemeContext } from '@luxis-ui/react';

function ThemeToggle() {
  const { theme, setMode } = useThemeContext();

  return (
    <button onClick={() => setMode(theme.mode === 'light' ? 'dark' : 'light')}>
      Toggle Theme (Current: {theme.mode})
    </button>
  );
}
```

## Customization

### Method 1: Override CSS Variables

Create a custom CSS file:

```css
/* custom-theme.css */
:root {
  /* Brand colors */
  --lxs-color-primary-500: #7c3aed; /* Purple */
  --lxs-color-primary-600: #6d28d9;
  --lxs-color-primary-700: #5b21b6;

  /* Custom spacing */
  --lxs-spacing-4: 1.25rem;

  /* Custom typography */
  --lxs-font-family-sans: 'Inter', sans-serif;
  --lxs-font-size-base: 1.125rem;

  /* Custom border radius */
  --lxs-radius-md: 0.5rem;
}

/* Dark mode overrides */
[data-theme='dark'] {
  --lxs-color-primary-500: #a78bfa;
}
```

Import in your app:

```tsx
import './custom-theme.css';
```

### Method 2: Use Custom Tokens with ThemeProvider

VTX UI provides intelligent color palette generation. You can pass either:
- **Single hex color** - Automatically generates all shades (50-900)
- **Partial palette** - Define specific shades, others will be inherited

#### Option 1: Auto-Generate Full Palette from Single Color

```tsx
import { ThemeProvider, createCustomTokens } from '@luxis-ui/react';

const customTokens = createCustomTokens({
  colors: {
    primary: '#7c3aed',    // Auto-generates shades 50-900
    secondary: '#10b981',  // Auto-generates shades 50-900
  },
});

function App() {
  return (
    <ThemeProvider initialMode="light" customTokens={customTokens}>
      <YourApp />
    </ThemeProvider>
  );
}
```

#### Option 2: Mix Both Approaches

```tsx
import { ThemeProvider, createCustomTokens } from '@luxis-ui/react';

const customTokens = createCustomTokens({
  colors: {
    primary: '#7c3aed',  // Auto-generated full palette
    secondary: {         // Custom specific shades
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
  },
  borderRadius: {
    md: '0.5rem',
    lg: '1rem',
  },
});

function App() {
  return (
    <ThemeProvider initialMode="light" customTokens={customTokens}>
      <YourApp />
    </ThemeProvider>
  );
}
```

> **Note:** The `createCustomTokens` helper provides better TypeScript inference.
```

### Method 3: Inline Styles with CSS Variables

```tsx
function CustomComponent() {
  return (
    <div
      style={{
        padding: 'var(--lxs-spacing-4)',
        backgroundColor: 'var(--lxs-color-primary-50)',
        borderRadius: 'var(--lxs-radius-md)',
        color: 'var(--lxs-color-neutral-900)',
      }}
    >
      Styled with theme variables
    </div>
  );
}
```

## Available CSS Variables

### Colors

```css
/* Primary */
--lxs-color-primary-[50|100|200|300|400|500|600|700|800|900]

/* Neutral */
--lxs-color-neutral-[50|100|200|300|400|500|600|700|800|900]

/* Semantic */
--lxs-color-success-[50|500|600|700]
--lxs-color-warning-[50|500|600|700]
--lxs-color-error-[50|500|600|700]
--lxs-color-info-[50|500|600|700]
```

### Spacing

```css
--lxs-spacing-[0|1|2|3|4|5|6|8|10|12|16|20|24]
/* Values: 0, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px */
```

### Typography

```css
/* Font Families */
--lxs-font-family-sans
--lxs-font-family-mono

/* Font Sizes */
--lxs-font-size-[xs|sm|base|lg|xl|2xl|3xl|4xl]
/* Values: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px */

/* Font Weights */
--lxs-font-weight-[normal|medium|semibold|bold]
/* Values: 400, 500, 600, 700 */

/* Line Heights */
--lxs-line-height-[tight|normal|relaxed]
/* Values: 1.25, 1.5, 1.75 */
```

### Border Radius

```css
--lxs-radius-[none|sm|base|md|lg|xl|2xl|full]
/* Values: 0, 2px, 4px, 6px, 8px, 12px, 16px, 9999px */
```

### Shadows

```css
--lxs-shadow-[sm|base|md|lg|xl|none]
```

### Transitions

```css
--lxs-transition-[fast|base|slow]
/* Values: 150ms, 200ms, 300ms */
```

### Z-Index

```css
--lxs-z-[dropdown|sticky|modal|tooltip|notification]
/* Values: 1000, 1100, 1200, 1300, 1400 */
```

## Examples

### Creating a Themed Card

```tsx
function Card({ children }) {
  return (
    <div
      style={{
        padding: 'var(--lxs-spacing-6)',
        backgroundColor: 'var(--lxs-color-neutral-50)',
        borderRadius: 'var(--lxs-radius-lg)',
        boxShadow: 'var(--lxs-shadow-md)',
        border: '1px solid var(--lxs-color-neutral-200)',
      }}
    >
      {children}
    </div>
  );
}
```

### Custom Component with Theme Hook

```tsx
import { useThemeContext } from '@luxis-ui/react';

function BrandedHeader() {
  const { theme } = useThemeContext();
  const primaryColor = theme.tokens.colors.primary[600];

  return (
    <header style={{ backgroundColor: primaryColor, color: 'white' }}>
      <h1>My App</h1>
    </header>
  );
}
```

### Responsive Theme

```css
/* responsive-theme.css */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* Auto dark mode if no theme is set */
    --lxs-color-neutral-900: #fafafa;
    /* ... other dark mode variables */
  }
}

@media (max-width: 768px) {
  :root {
    /* Adjust spacing on mobile */
    --lxs-spacing-4: 0.875rem;
    --lxs-font-size-base: 0.9375rem;
  }
}
```

## Best Practices

1. **Always provide fallback values**

   ```css
   color: var(--lxs-color-primary-500, #3b82f6);
   ```

2. **Import base.css once** at your app entry point

3. **Use semantic color names** instead of specific shades
   - ✅ `--lxs-color-error-600`
   - ❌ `--lxs-color-red-600`

4. **Test both themes** - Ensure your UI works in light and dark modes

5. **Leverage TypeScript** - Use provided types for type-safe token access

6. **Keep overrides minimal** - Only override what you need to change

7. **Use ThemeProvider at root** - Wrap your entire app once

8. **Avoid inline hex values** - Use CSS variables for consistency

## TypeScript Support

```tsx
import type { Tokens, Theme } from '@luxis-ui/react';

// Type-safe token access
const customTokens: Partial<Tokens> = {
  colors: {
    primary: {
      500: '#7c3aed',
      // TypeScript ensures all required shades are provided
    },
  },
};

// Type-safe theme hook
const { theme, setMode } = useThemeContext();
theme.mode; // 'light' | 'dark'
theme.tokens.colors.primary[500]; // string
```

## Migration from Other Libraries

### From Material-UI

```tsx
// Before (Material-UI)
import { ThemeProvider, createTheme } from '@mui/material';
const theme = createTheme({ palette: { primary: { main: '#1976d2' } } });

// After (VTX UI)
import { ThemeProvider } from '@luxis-ui/react';
const customTokens = { colors: { primary: { 500: '#1976d2' } } };
<ThemeProvider customTokens={customTokens}>
```

### From Chakra UI

```tsx
// Before (Chakra UI)
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
const theme = extendTheme({ colors: { brand: { 500: '#1a202c' } } });

// After (VTX UI)
import { ThemeProvider } from '@luxis-ui/react';
const customTokens = { colors: { primary: { 500: '#1a202c' } } };
<ThemeProvider customTokens={customTokens}>
```

## Troubleshooting

**Issue: CSS variables not working**

- Ensure `base.css` is imported
- Check browser DevTools to see if `:root` has CSS variables
- Verify ThemeProvider wraps your components

**Issue: Dark mode not applying**

- Check `data-theme` attribute on `<html>` element
- Use browser DevTools to verify attribute changes on theme toggle

**Issue: Custom tokens not reflecting**

- Verify customTokens prop is passed correctly
- Check if custom tokens are merged with default tokens
- Ensure component is inside ThemeProvider

## File Structure

```
src/theme/
├── base.css                    # Base CSS variables (import this!)
├── ThemeProvider.tsx           # React context provider
├── tokens.ts                   # TypeScript token definitions
├── cssVariables.ts             # CSS variable generation utilities
├── index.ts                    # Public exports
└── theme.config.example.ts     # Configuration examples
```

## License

MIT
