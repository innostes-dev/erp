# Link

The `Link` component is a flexible navigation wrapper that supports native hyperlinks, external redirects, and internal routing libraries like React Router and Next.js.

## Features

- **Polymorphic**: Easily switch the underlying component to `next/link` or `Link` from `react-router-dom` using the `component` prop.
- **Variant Support**: Styles automatically scale to match any typography level (e.g., `h1` through `caption`).
- **External Helper**: Set `external` to automatically add `target="_blank"` and `rel="noopener noreferrer"`.
- **Integrated Icons**: Built-in slots for `leftIcon` and `rightIcon`.
- **Dynamic Theming**: Choose from `primary`, `secondary`, `neutral`, or `inherit` colors with custom `hoverColor` options.
- **Disabled State**: Safely disables interaction while maintaining accessibility standards.
- **Download Support**: Direct access to the `download` attribute for file serving.

## Installation

```bash
import { Link } from '@luxis-ui/react';
```

## Usage

### Basic Native Link

```tsx
import { Link } from '@luxis-ui/react';

const App = () => (
  <Link href="https://google.com" external>
    Visit Google
  </Link>
);
```

### With Next.js Routing

```tsx
import NextLink from 'next/link';

<Link component={NextLink} href="/dashboard" color="primary">
  Go to Dashboard
</Link>
```

### With Icons and Variants

```tsx
<Link 
  href="/docs" 
  variant="body2" 
  leftIcon={<DocumentIcon />}
  noUnderline
>
  Documentation
</Link>
```

## API Reference

### Link Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `href` | `string` | - | Destination URL. |
| `component` | `ElementType` | - | Custom component for routing (e.g. `NextLink`). |
| `variant` | `TypographyVariant` | `'body1'` | Text size and weight style. |
| `color` | `'primary'\|'secondary'\|'neutral'\|'inherit'` | `'inherit'` | The initial text color. |
| `hoverColor`| `string \| preset` | - | Color applied on mouse hover. |
| `leftIcon` | `ReactNode` | - | Leading icon. |
| `rightIcon` | `ReactNode` | - | Trailing icon. |
| `external` | `boolean` | `false` | Sets target="_blank" and secure rel tags. |
| `noUnderline`| `boolean` | `true` | Removes the default text decoration. |
| `disabled` | `boolean` | `false` | Disables clicks and dims text. |
| `download` | `boolean \| string` | `false` | Sets the download attribute. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-link` | Main link element. |
| `.lxs-link--[variant]` | Typography sizing modifier. |
| `.lxs-link--[color]` | Color theme modifier. |
| `.lxs-link--no-underline`| Applied when `noUnderline` is true. |
| `.lxs-link__icon-left`| Wrapper for the leading icon. |
| `.lxs-link__content` | Wrapper for the text children. |
