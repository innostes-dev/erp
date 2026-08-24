# Image

The `Image` component is an intelligent wrapper for local and remote images. it handles loading states, provides fallback mechanisms, and integrates seamlessly with modern frameworks like Next.js.

## Features

- **Progressive Loading**: Hidden by default and fades in once fully loaded to prevent layout shift and "blank" states.
- **Fallback Support**: Display a custom placeholder or default image while the main source is loading or if it fails.
- **Polymorphic**: Use the `component` prop to swap the internal tag for `next/image` or other custom image components.
- **Priority Loading**: Support for `priority` and `fetchPriority` props to optimize LCP (Largest Contentful Paint).
- **Theme Integrated**: Inherits border radiuses and shadows from the design system's image presets.
- **SEO Ready**: Standard `alt` text support and semantic HTML.

## Installation

```bash
import { Image } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Image } from '@luxis-ui/react';

const App = () => (
  <Image 
    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff" 
    alt="Red Nike Shoe"
    fallback="/images/placeholder.png"
  />
);
```

### With Next.js Image

```tsx
import NextImage from 'next/image';

<Image 
  component={NextImage}
  src="/product.jpg" 
  alt="Dashboard Preview"
  imageProps={{ width: 800, height: 600, quality: 90 }}
  priority
/>
```

### Styled Wrapper

```tsx
<Image 
  src="/banner.webp" 
  alt="Promotion"
  className="rounded-lg shadow-md"
  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
/>
```

## API Reference

### Image Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | **Required** | The URL of the image. |
| `alt` | `string` | **Required** | Alternative text for accessibility. |
| `fallback` | `string` | - | Image shown during loading or on error. |
| `component` | `ElementType` | `'img'` | Custom image component (e.g. `next/image`). |
| `priority` | `boolean` | `false` | If true, uses `eager` loading. |
| `fetchPriority`| `'high'\|'low'\|'auto'`| `'auto'` | Browser hint for resource priority. |
| `imageProps` | `object` | `{}` | Props passed directly to the `Component`. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-image-wrapper` | The relative container for the image. |
| `.lxs-image-main` | The primary image element. |
| `.lxs-image-main--loaded`| Applied when loading is complete. |
| `.lxs-image-placeholder`| The fallback image element. |
