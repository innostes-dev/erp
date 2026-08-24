# Badge

The `Badge` component is a small visual indicator used to highlight status, counts, categories, or snippets of information. It is highly customizable with variants, shapes, and interactive removal support.

## Features

- **Semantic Colors**: Built-in support for `primary`, `secondary`, `success`, `warning`, `error`, `info`, and `neutral`.
- **Flexible Shapes**: Default rounded rect, `pill` (completely rounded), or `rounded` (large radius) shapes.
- **Visual Modes**: Choose between `solid` (default), `outline`, and `lightMode` (soft tint).
- **Status Dots**: Optional indicator dot for status messaging.
- **Icon Support**: Add icons before the label text.
- **Character Limit**: Built-in `maxLength` truncation with ellipses.
- **Removable**: Integrated delete button for tags or filtering use cases.
- **Accessibility**: Semantic `<span>` root with keyboard-accessible removal buttons.

## Installation

```bash
import { Badge } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Badge } from '@luxis-ui/react';

const App = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <Badge variant="primary">New</Badge>
    <Badge variant="success">Active</Badge>
    <Badge variant="error" pill>Hot</Badge>
    <Badge variant="neutral" rounded>Draft</Badge>
  </div>
);
```

### Visual Modes

```tsx
<Badge variant="info">Solid (Default)</Badge>
<Badge variant="info" outline>Outline</Badge>
<Badge variant="info" lightMode={true}>Light Mode</Badge>
```

### With Icons and Dots

```tsx
<Badge variant="success" dot>Online</Badge>
<Badge variant="info" icon={<i className="fas fa-clock" />}>Timed</Badge>
```

### Removable Tags

```tsx
<Badge 
  variant="primary" 
  onRemove={() => console.log('Tag removed')}
>
  User Category
</Badge>
```

## API Reference

### Badge Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `children` | `ReactNode` | **Required** | Content of the badge. |
| `variant` | `'neutral'\|'primary'\|'secondary'\|'success'\|'warning'\|'error'\|'info'` | `'neutral'` | Color variant. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of the badge. |
| `pill` | `boolean` | `false` | Completely rounded ends. |
| `rounded` | `boolean` | `false` | Larger border radius. |
| `dot` | `boolean` | `false` | Shows a leading status dot. |
| `outline` | `boolean` | `false` | Border-only style. |
| `lightMode` | `boolean` | `true` | Uses soft background tint. |
| `maxLength` | `number` | - | Truncates text if longer than value. |
| `icon` | `ReactNode` | - | Icon placed before text. |
| `onRemove` | `(e) => void` | - | If provided, shows a close button. |
| `darkText` | `boolean` | - | Overrides contrast color logic. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-badge` | Main badge container. |
| `.lxs-badge--[variant]` | Variant color modifier. |
| `.lxs-badge--pill` | Modifier for pill shape. |
| `.lxs-badge--with-dot` | Layout for dot indicator. |
| `.lxs-badge-dot` | The dot element itself. |
| `.lxs-badge-content` | Wrapper for text/children. |
| `.lxs-badge-remove` | The close button element. |
