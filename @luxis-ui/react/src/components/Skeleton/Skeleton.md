# Skeleton

The `Skeleton` component is a placeholder used to represent content during loading. It helps reduce perceived latency and layout shift by maintaining the visual structure of the page.

## Features

- **Multiple Shapes**: Supports `text`, `circular` (avatars), `rectangular` (images), and `rounded` (buttons/cards) variants.
- **Natural Animations**: Built-in `wave` and `pulse` effects to indicate active loading.
- **Motion Sensitive**: Automatically respects user performance settings (`prefers-reduced-motion`) if configured.
- **Accessible**: Integrated `aria-busy="true"` and `aria-live="polite"` attributes.
- **Custom Dimensions**: Easily set exact `width` and `height` via props.

## Installation

```bash
import { Skeleton } from '@luxis-ui/react';
```

## Usage

### Article Placeholder

```tsx
import { Skeleton } from '@luxis-ui/react';

const CardLoading = () => (
  <div style={{ padding: 20 }}>
    <Skeleton variant="rectangular" height={200} style={{ marginBottom: 12 }} />
    <Skeleton variant="text" width="80%" height={24} />
    <Skeleton variant="text" width="60%" />
  </div>
);
```

### Profile Skeleton

```tsx
<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
  <Skeleton variant="circular" width={48} height={48} />
  <div>
    <Skeleton variant="text" width={120} height={20} />
    <Skeleton variant="text" width={80} height={16} />
  </div>
</div>
```

## API Reference

### Skeleton Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'text'\|'circular'\|'rectangular'\|'rounded'` | `'text'` | The shape of the placeholder. |
| `width` | `string \| number` | - | Horizontal dimension. |
| `height` | `string \| number` | - | Vertical dimension. |
| `animation` | `'wave' \| 'pulse' \| 'none'` | `'wave'` | Visual transition effect. |
| `respectMotionPreference`| `boolean` | `true` | Disables animation if system motion is reduced. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-skeleton` | Base shimmer container. |
| `.lxs-skeleton--text` | Sizing for text lines. |
| `.lxs-skeleton--circular` | Forced 1:1 ratio with 50% radius. |
| `.lxs-skeleton--wave` | Styling for the sliding gradient animation. |
| `.lxs-skeleton--pulse` | Styling for the opacity fade animation. |
