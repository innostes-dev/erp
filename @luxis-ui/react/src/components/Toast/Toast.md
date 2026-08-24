# Toast

The `Toast` component provides brief, non-interruptive notifications about the status of an action. It supports automatic dismissal, progress bars, and multiple semantic variants.

## Features

- **Automatic Dismissal**: Configurable `autoClose` duration in milliseconds.
- **Visual Progress**: Dynamic progress bar indicating remaining time before expiration.
- **Interactive Pause**: Automatically pauses the timer when the user hovers over the toast.
- **Semantic Variants**: Presets for `success`, `error`, `warning`, `info`, and `primary`.
- **Integrated Actions**: Add buttons directly to the toast for quick responses (e.g., "Undo").
- **Title & Description**: Built-in layout for hierarchical content.
- **Accessible**: Managed `role="alert"` and `aria-live="polite"` attributes.
- **Icons**: Automatic variant-based icons with support for custom overrides.

## Installation

```bash
import { Toast } from '@luxis-ui/react';
```

## Usage

### Basic Success Message

```tsx
import { Toast } from '@luxis-ui/react';

const App = () => (
  <Toast variant="success" onDismiss={() => console.log('Closed')}>
    Profile updated successfully!
  </Toast>
);
```

### With Title and Information

```tsx
<Toast 
  variant="info" 
  title="New Update Available" 
  description="Version 2.0 is now live with 50+ new features."
  autoClose={7000}
/>
```

### Actionable Warning

```tsx
<Toast 
  variant="warning"
  action={{ label: 'Restore', onClick: () => restoreItem() }}
>
  Message deleted.
</Toast>
```

## API Reference

### Toast Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `string` | `'default'` | Theme variant (success, error, etc). |
| `title` | `string` | - | Bold header text. |
| `description` | `string` | - | Secondary message text. |
| `autoClose` | `number \| false` | `5000` | Duration before closing (ms). |
| `progressBar` | `boolean` | `true` | Show/hide the timer bar. |
| `pauseOnHover` | `boolean` | `true` | Pauses timer on mouse enter. |
| `onDismiss` | `() => void` | **Required** | Callback to handle removal. |
| `action` | `ToastAction` | - | Optional button config `{label, onClick}`. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-toast` | Main notification box. |
| `.lxs-toast__wrapper` | Internal padding container. |
| `.lxs-toast__icon` | Variant icon wrapper. |
| `.lxs-toast__content` | Text area for title/body. |
| `.lxs-toast__progress` | The animated duration bar. |
| `.lxs-toast__close` | The manual "X" button. |
