# Alert

The `Alert` component is used to display important messages, feedback, or notifications to the user. It supports multiple variants, styles, and interactive features like dismissal and actions.

## Features

- **Semantic Variants**: Standard states like `success`, `error`, `warning`, `info`, and `neutral`.
- **Styling Options**: Choose from `filled`, `outlined`, `subtle` (default), or `left-accent`.
- **Automatic Icons**: Shows relevant icons based on the variant by default.
- **Dismissible**: Built-in support for closing alerts with a callback.
- **Title & Description**: Clean layout for multi-line messages with headers.
- **Action Support**: Slot for buttons or links on the right side of the alert.
- **Responsive**: Adapts to container width or can be set to `fullWidth`.

## Installation

```bash
import { Alert } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Alert } from '@luxis-ui/react';

const App = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <Alert variant="info">This is an informative message.</Alert>
    <Alert variant="success">Your operation was successful!</Alert>
    <Alert variant="warning">Please review your profile settings.</Alert>
    <Alert variant="error">An error occurred while saving.</Alert>
  </div>
);
```

### Alert Styles

```tsx
<Alert alertStyle="subtle" title="Subtle" description="Soft background color." />
<Alert alertStyle="filled" title="Filled" description="Solid background color." />
<Alert alertStyle="outlined" title="Outlined" description="Border only." />
<Alert alertStyle="left-accent" title="Left Accent" description="Subtle with a colored left border." />
```

### With Actions

```tsx
<Alert
  variant="info"
  title="New Update"
  action={<Button size="sm">Update</Button>}
>
  A new system update is available for installation.
</Alert>
```

### Dismissible

```tsx
<Alert 
  variant="neutral" 
  dismissible 
  onClose={() => console.log('Alert closed')}
>
  You can close this alert by clicking the icon on the right.
</Alert>
```

## API Reference

### Alert Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | - | Secondary header for the alert. |
| `description` | `string` | - | Message body (alternative to children). |
| `variant` | `'success'\|'error'\|'warning'\|'info'\|'neutral'` | `'info'` | Semantic color variant. |
| `alertStyle` | `'filled'\|'outlined'\|'subtle'\|'left-accent'` | `'subtle'` | Visual styling mode. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of the component. |
| `icon` | `ReactNode \| false` | - | Custom icon or `false` to hide. |
| `dismissible` | `boolean` | `false` | Shows a close button. |
| `onClose` | `() => void` | - | Callback when dismissed. |
| `action` | `ReactNode` | - | Element displayed on the right. |
| `fullWidth` | `boolean` | `false` | Takes 100% of container width. |
| `role` | `string` | `'alert'` | ARIA role for accessibility. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.alert` | Base alert container. |
| `.alert--[variant]` | Variant color modifier. |
| `.alert--[style]` | Style mode modifier. |
| `.alert-icon` | Container for the leading icon. |
| `.alert-content` | Wrapper for title and message. |
| `.alert-title` | Header text styling. |
| `.alert-message` | Body text styling. |
| `.alert-close` | Close button element. |
