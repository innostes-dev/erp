# Divider

The `Divider` component is a thin line used to separate content in lists, layouts, and groups. It supports custom text, vertical orientations, and various inset styles.

## Features

- **Orientation**: Supports `horizontal` (default) and `vertical` layouts.
- **Children Support**: Add text or icons in the middle of the divider (e.g., "OR").
- **Text Alignment**: Position labels at the `left`, `center`, or `right`.
- **Styling Variants**: `fullWidth`, `inset`, and `middle` for different layout densities.
- **Flex Optimization**: The `flexItem` prop ensures consistent sizing inside flex containers.
- **Theme Awareness**: Responds to `light` mode for softer visual separators.
- **Accessible**: Renders as a semantic `<hr>` or a `role="separator"` depending on context.

## Installation

```bash
import { Divider } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Divider } from '@luxis-ui/react';

const App = () => (
  <div>
    <p>Section One</p>
    <Divider />
    <p>Section Two</p>
  </div>
);
```

### With Text (Horizontal)

```tsx
<Divider textAlign="left">Primary Information</Divider>
<p>Content...</p>
<Divider>OR</Divider>
<p>More Content...</p>
```

### Vertical Divider

Useful for headers or side-by-side components.

```tsx
<div style={{ display: 'flex', height: '24px' }}>
  <span>Edit</span>
  <Divider orientation="vertical" flexItem variant="middle" />
  <span>Delete</span>
</div>
```

### Variants

```tsx
<Divider variant="fullWidth" /> {/* Default */}
<Divider variant="inset" />     {/* Left-indented */}
<Divider variant="middle" />    {/* Indented on both sides */}
```

## API Reference

### Divider Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `children` | `ReactNode` | - | Label text or element shown in the middle. |
| `orientation` | `'horizontal' \| 'vertical'`| `'horizontal'` | Line direction. |
| `textAlign` | `'left'\|'center'\|'right'` | `'center'` | Alignment for children. |
| `variant` | `'fullWidth'\|'inset'\|'middle'` | `'fullWidth'` | Horizontal spacing style. |
| `light` | `boolean` | `false` | Uses a more subtle color tone. |
| `flexItem` | `boolean` | `false` | Adjusts height/alignment for flex layouts. |
| `component` | `ElementType` | `'hr'\|'div'` | The root element to render. |

**Note**: Accepts all standard HTML attributes for the chosen component.

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-divider` | Main divider class. |
| `.lxs-divider-wrapper` | Container for text/children inside the divider. |
