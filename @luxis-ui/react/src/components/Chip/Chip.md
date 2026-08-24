# Chip

The `Chip` component is a compact visual element used to represent tags, labels, filters, or entity attributes. It supports interactive selections, avatars, icons, and removal actions.

## Features

- **Styling Variations**: Choose from `filled`, `outlined`, or `light` (soft-tinted) variants.
- **Semantic Colors**: Built-in themes for `primary`, `success`, `error`, `warning`, `info`, and `default`.
- **Media Support**: Easily include `avatar` images or leading `icons` for context.
- **Interactive**: Integrated `onClick` feedback and `disabled` states.
- **Deletable**: Built-in support for removal using `onDelete`, complete with keyboard support (Delete/Backspace).
- **Accessibility**: Full keyboard navigation support (Enter/Space for clicks) and ARIA attributes for screen readers.

## Installation

```bash
import { Chip } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Chip } from '@luxis-ui/react';

const App = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <Chip label="React" color="primary" />
    <Chip label="Vue" variant="outlined" />
    <Chip label="Svelte" variant="light" color="success" />
  </div>
);
```

### With Avatar and Icons

```tsx
<Chip 
  label="John Doe" 
  avatar="https://randomuser.me/api/portraits/men/1.jpg" 
/>
<Chip 
  label="Settings" 
  icon={<SettingsIcon />} 
  variant="outlined" 
/>
```

### Deletable Chips

```tsx
<Chip 
  label="Dismissible Tag" 
  color="error"
  onDelete={() => console.log('Deleted!')} 
/>
```

## API Reference

### Chip Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | The text displayed in the chip. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of the chip. |
| `variant` | `'filled'\|'outlined'\|'light'` | `'filled'` | Visual style mode. |
| `color` | `'default'\|'primary'\|'success'\|'error'\|'warning'\|'info'` | `'default'` | Semantic color theme. |
| `avatar` | `string` | - | Image URL for a round avatar on the left. |
| `icon` | `ReactNode` | - | Leading icon (shown if no avatar provided). |
| `onDelete` | `(e) => void` | - | Shows a close button and handles deletion. |
| `onClick` | `(e) => void` | - | Callback when the chip body is clicked. |
| `disabled` | `boolean` | `false` | Prevents all interactions and dims the chip. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-chip` | Main chip container. |
| `.lxs-chip--[variant]` | Variant style modifier. |
| `.lxs-chip--[color]` | Color theme modifier. |
| `.lxs-chip--clickable` | Applied when `onClick` is provided. |
| `.lxs-chip__avatar` | The rounded image element. |
| `.lxs-chip__label` | Wrapper for the text label. |
| `.lxs-chip__delete` | The close/delete button element. |
