# ErrorPage

A highly configurable, reusable widget to display different types of error states such as 404 (Not Found), 500 (Server Error), or custom application errors.

## Import

```tsx
import { ErrorPage } from '@luxis-ui/react';
```

## Basic Usage

The widget automatically supplies default headings, descriptions, suggestions, and icons based on standard `statusCode` inputs (`404`, `500`, `401`, `403`, `503`, and `search`).

```tsx
<ErrorPage
  statusCode={404}
  actions={[
    { label: 'Go Home', href: '/' }
  ]}
/>
```

## Themes

The `theme` prop controls the overall layout and visual flair of the widget. Available themes are:
- `minimal` (default)
- `modern`
- `professional`
- `playful`
- `technical`
- `elegant`
- `card`
- `embedded`
- `full-page`
- `split`
- `illustrated`

```tsx
<ErrorPage
  theme="technical"
  statusCode={500}
  actions={[
    { label: 'Retry', onClick: handleRetry }
  ]}
/>
```

## Visual Variants

Use the `variant` prop to map the widget’s accents to semantic theme colors (e.g. `primary`, `error`, `warning`, `info`, `success`, `neutral`).

```tsx
<ErrorPage
  variant="warning"
  title="Action Required"
  description="You must verify your email to proceed."
/>
```

## Layout Props

- `centered` (boolean, default: `true`): Aligns content to the center or left.
- `fullHeight` (boolean, default: `false`): Ensures the container takes up `min-height: 100vh`.

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `statusCode` | `string \| number` | `'404'` | The error status code (e.g., 404, 500) |
| `title` | `string` | - | Primary error heading (falls back to default if statusCode matches) |
| `description` | `string` | - | Detailed error message or description |
| `suggestion` | `string` | - | Helpful suggestion text below description |
| `additionalInfo` | `React.ReactNode` | - | Formatted block of extra technical context at the bottom |
| `icon` | `React.ReactNode` | - | Optional icon rendered inside the component |
| `illustration` | `React.ReactNode` | - | Optional larger illustration (image or SVG) |
| `showIllustration`| `boolean` | `true` | Toggle display of the illustration or icon |
| `actions` | `ErrorAction[]` | - | Array of actions (buttons/links) to display |
| `theme` | `ErrorPageTheme` | `'minimal'` | Visual layout style |
| `variant` | `ErrorPageVariant` | `'error'` | Semantic color variant |
| `centered` | `boolean` | `true` | Centers text and alignment |
| `fullHeight` | `boolean` | `false` | Stretches layout to 100vh |
| `mode` | `ErrorPageMode` | `'light'` | Light / dark surface mode |
| `appearance` | `ErrorPageAppearance` | - | Advanced per-element typography controls |

## Action Configuration

The `actions` array accepts objects of type `ErrorAction`. If `href` is supplied, the action renders as an SEO-friendly `<Link>` component. You can also pass icon names (`home`, `back`, `refresh`) directly to the `icon` prop.

```tsx
interface ErrorAction {
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  icon?: "home" | "back" | "refresh" | React.ReactNode;
  variant?: ButtonProps["variant"];
  props?: ButtonProps;
}
```
