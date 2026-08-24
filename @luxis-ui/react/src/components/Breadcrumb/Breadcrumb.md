# Breadcrumb

The `Breadcrumb` component provides a secondary navigation aid that shows the user's current location relative to the site hierarchy. It supports icons, custom separators, and smart collapsing for long paths.

## Features

- **Standard & Manual Items**: Pass an array of `items` with labels, icons, and URLs.
- **Auto-Collapsing**: Use `maxItems` to automatically hide middle items with an ellipsis (`…`) when the list is too long.
- **Framework Agnostic**: Easily switch the internal Link component to work with `next/link`, `react-router-dom`, or native anchors.
- **Mobile Optimized**: Automatically switches to a compact `First / … / Last` view on mobile devices for better readability.
- **Custom Separators**: Replace the default chevron with any text or icon.
- **Typography Scale**: Automatically scales text based on the `size` prop (`sm`, `md`, `lg`).
- **Accessible**: Built using the `<nav>` element with appropriate `aria-label` and `aria-current="page"` attributes.

## Installation

```bash
import { Breadcrumb } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Breadcrumb } from '@luxis-ui/react';

const items = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Electronics', active: true },
];

const App = () => <Breadcrumb items={items} />;
```

### With Max Items (Collapsing)

```tsx
<Breadcrumb 
  items={manyItems} 
  maxItems={4} 
  separator="|"
/>
```

### Custom Link Component (e.g., Next.js)

```tsx
import Link from 'next/link';

<Breadcrumb 
  linkComponent={Link} 
  items={[
    { label: 'Home', linkProps: { href: '/' } },
    { label: 'Settings', active: true },
  ]}
/>
```

### With Icons

```tsx
<Breadcrumb 
  items={[
    { label: 'Home', href: '/', icon: <i className="fas fa-home" /> },
    { label: 'User', href: '/user', icon: <i className="fas fa-user" /> },
    { label: 'Profile', active: true },
  ]}
/>
```

## API Reference

### Breadcrumb Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `BreadcrumbItem[]` | **Required** | List of navigation points. |
| `separator` | `ReactNode` | `<ChevronRightIcon />` | Element placed between items. |
| `linkComponent` | `ElementType` | - | Custom component for item links. |
| `maxItems` | `number` | - | Limit before collapsing items. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of text and spacing. |
| `linkColor` | `'primary'\|'secondary'\|'neutral'\|'inherit'` | `'inherit'` | Color theme for link items. |
| `ariaLabel` | `string` | `'Breadcrumb'` | Accessible label for the `<nav>` tag. |

### BreadcrumbItem Object

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | - | Display text. |
| `href` | `string` | - | Target URL for native anchors. |
| `icon` | `ReactNode` | - | Leading icon. |
| `active` | `boolean` | `false` | Marks item as the current page. |
| `disabled` | `boolean` | `false` | Disables navigation for this item. |
| `linkProps`| `Record<string, any>`| - | Props forwarded to `linkComponent`. |
| `ariaLabel` | `string` | - | Accessible name for the item. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-breadcrumb` | Root nav container. |
| `.lxs-breadcrumb-list` | The `<ol>` element. |
| `.lxs-breadcrumb-item` | The `<li>` wrapper. |
| `.lxs-breadcrumb-item--active`| Modifier for the active page. |
| `.lxs-breadcrumb-item-link` | The clickable link component. |
| `.lxs-breadcrumb-separator` | Wrapper for separator icons. |
