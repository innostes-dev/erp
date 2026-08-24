# Avatar

The `Avatar` component is used to represent a user or an entity through images, initials, or fallback icons. It supports various sizes, shapes, and status decorations.

## Features

- **Smart Fallbacks**: Automatically shows initials or a default user icon if the image fails or isn't provided.
- **Initials Extraction**: Logic to extract up to 2 initials from the `alt` text or `fallback` prop.
- **Multiple Shapes**: Supports `circular` (default), `rounded`, and `square` configurations.
- **Size Scale**: Available in `sm`, `md`, and `lg`.
- **Status Indicators**: Attach status dots (e.g., online/offline) with customizable positioning.
- **Optimized Loading**: Supports `priority` prop for high-priority LCP images.
- **Error Handling**: Graceful fallback to UI when `src` fails to load.

## Installation

```bash
import { Avatar } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Avatar } from '@luxis-ui/react';

const App = () => (
  <div style={{ display: 'flex', gap: '10px' }}>
    <Avatar src="https://example.com/user.jpg" alt="John Doe" />
    <Avatar src="broken-link" alt="Jane Smith" /> {/* Shows 'JS' fallback */}
    <Avatar fallback="K" /> {/* Shows 'K' */}
    <Avatar /> {/* Shows default User icon */}
  </div>
);
```

### Shapes and Sizes

```tsx
<Avatar size="sm" shape="circular" />
<Avatar size="md" shape="rounded" />
<Avatar size="lg" shape="square" />
```

### Status Indicators

You can place any element (usually a status dot) on the corner of the avatar.

```tsx
const OnlineBadge = <span className="status-dot green" />;

<Avatar 
  src="/profile.png" 
  statusIndicator={OnlineBadge} 
  statusPosition="bottom-right" 
/>
```

## API Reference

### Avatar Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | - | Image source URL. |
| `alt` | `string` | `''` | Alt text (used for initials extraction). |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Dimensions and font scale. |
| `shape` | `'circular'\|'rounded'\|'square'` | `'circular'` | Corner radius style. |
| `fallback` | `string` | `'?'` | Custom text to show if no image. |
| `statusIndicator`| `ReactNode` | - | Element to overlay on the avatar. |
| `statusPosition` | `'top-left'\|'top-right'\|'bottom-left'\|'bottom-right'` | `'bottom-right'` | Position of the status indicator. |
| `priority` | `boolean` | `false` | Sets `loading="eager"` for the image. |
| `onImageError` | `(e) => void` | - | Callback when image fails. |
| `onImageLoad` | `(e) => void` | - | Callback when image loads. |
| `imgProps` | `ImgHTMLAttributes` | - | Additional props for the `<img>` tag. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-avatar` | Outer wrapper for the avatar. |
| `.lxs-avatar--[size]` | Size variety modifier. |
| `.lxs-avatar--[shape]` | Shape variety modifier. |
| `.lxs-avatar-inner` | Content container (img or span). |
| `.lxs-avatar-image` | The `<img>` element. |
| `.lxs-avatar-fallback` | The span containing initials or icon. |
| `.lxs-avatar-status` | Wrapper for the status indicator overlay. |
