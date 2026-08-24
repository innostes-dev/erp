# Button

The `Button` component is a primary interactive element used for triggers, actions, and navigation. It supports multiple variants, sizes, loading states, and icon configurations.

## Features

- **Multiple Variants**: Choose from `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, and `warning`.
- **Flexible Sizes**: Supports standard sizes like `sm`, `md`, and `lg`.
- **Loading States**: Built-in loading indicator with customizable loading text.
- **Icon Support**: Easily add icons to the left or right of the text.
- **Icon Only Mode**: Circular or square buttons for icon-only actions.
- **Link Rendering**: Can automatically render as an `<a>` tag while maintaining button styling.
- **Semantic & Accessible**: Uses appropriate ARIA attributes for states like `busy` and `disabled`.

## Installation

```bash
import { Button } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Button } from '@luxis-ui/react';

const App = () => (
  <div style={{ display: 'flex', gap: '10px' }}>
    <Button variant="primary">Primary Action</Button>
    <Button variant="secondary">Secondary Action</Button>
    <Button variant="outline">Outline Button</Button>
  </div>
);
```

### Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

### Loading State

The `loading` prop replaces the button content with a spinner. You can also provide `loadingText` to show text alongside the spinner.

```tsx
<Button loading>Saving</Button>
<Button loading loadingText="Processing...">Click Me</Button>
```

### Icons

Use `leftIcon` or `rightIcon` to add visual context to your buttons.

```tsx
<Button leftIcon={<i className="fas fa-save" />}>Save Changes</Button>
<Button rightIcon={<i className="fas fa-arrow-right" />}>Next Step</Button>
<Button iconOnly><i className="fas fa-plus" /></Button>
```

### Shapes

```tsx
<Button shape="default">Standard</Button>
<Button shape="pill">Pill Shape</Button>
<Button shape="square">Square</Button>
```

### As a Link

Use the `asLink` and `href` props to render the button as an anchor tag.

```tsx
<Button asLink href="https://github.com" target="_blank" variant="outline">
  View on GitHub
</Button>
```

## API Reference

### Button Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' \| 'success' \| 'warning'` | `'primary'` | Visual style variant. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the button. |
| `shape` | `'default' \| 'pill' \| 'square'` | `'default'` | Shape of the button corners. |
| `fullWidth` | `boolean` | `false` | If true, takes 100% of the container width. |
| `loading` | `boolean` | `false` | Displays a loading spinner and disables interaction. |
| `loadingText` | `string` | - | Text to show during loading state. |
| `leftIcon` | `ReactNode` | - | Icon placed before the label. |
| `rightIcon` | `ReactNode` | - | Icon placed after the label. |
| `iconOnly` | `boolean` | `false` | Removes padding for icon-only usage. |
| `asLink` | `boolean` | `false` | Renders the component as an `<a>` tag. |
| `href` | `string` | - | URL for link rendering (requires `asLink`). |
| `target` | `string` | - | Target attribute for links. |
| `rel` | `string` | - | Rel attribute for links. |
| `textColor` | `string` | - | Custom CSS color for text. |
| `darkText` | `boolean` | - | Explicitly toggles dark/light text color contrast. |

**Note**: `Button` also accepts all standard HTML button attributes (like `onClick`, `type`, `disabled`, etc.) or anchor attributes when `asLink` is true.

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-button` | Base class for the button. |
| `.lxs-button--[variant]` | Variant-specific styling. |
| `.lxs-button--[size]` | Size-specific dimensions. |
| `.lxs-button--loading` | Applied during loading state. |
| `.lxs-button__spinner` | Wrapper for the loading spinner. |
| `.lxs-button__content` | Wrapper for the button text. |
