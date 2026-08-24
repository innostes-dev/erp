# Box

The `Box` component is the fundamental layout primitive of Luxis UI. It allows you to build complex layouts by wrapping any HTML element with utility-driven props for spacing, positioning, and styling.

## Features

- **Polymorphic**: Use the `as` prop to render as any HTML tag (e.g., `section`, `nav`, `main`).
- **Utility Props**: High-level props for common CSS properties like `m` (margin), `p` (padding), `w` (width), and `h` (height).
- **Responsive & Flexible**: Integrated support for flexbox and grid properties via props.
- **Theme Awareness**: Props like `bg` and `borderColor` automatically resolve theme tokens (e.g., `primary.500`).
- **Shorthand Syntax**: Optimized for speed with shorthands like `mx` (horizontal margin) and `py` (vertical padding).
- **Style Overrides**: Directly pass `opacity`, `zIndex`, and custom `style` objects.

## Installation

```bash
import { Box } from '@luxis-ui/react';
```

## Usage

### Basic Layout

```tsx
import { Box } from '@luxis-ui/react';

const App = () => (
  <Box bg="neutral.50" p={20} borderRadius={8} border={1} shadow="sm">
    <Box as="h2" mb={10} color="primary.600">Box Component</Box>
    <Box color="neutral.700">
      This is a container built using the Box primitive.
    </Box>
  </Box>
);
```

### Flexbox Container

```tsx
<Box display="flex" justifyContent="space-between" alignItems="center" gap={16}>
  <Box>Left Content</Box>
  <Box flexGrow={1} textAlign="center">Center Content</Box>
  <Box>Right Content</Box>
</Box>
```

### Spacing Shorthands

| Prop | CSS Equivalent |
| :--- | :--- |
| `m` / `p` | `margin` / `padding` (all sides) |
| `mt` / `pt` | `margin-top` / `padding-top` |
| `mx` / `px` | `margin-left` & `margin-right` / `padding-left` & `padding-right` |
| `my` / `py` | `margin-top` & `margin-bottom` / `padding-top` & `padding-bottom` |

## API Reference

### Box Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `as` | `BoxAs` | `'div'` | The HTML tag to render. |
| `display` | `BoxDisplay` | - | CSS display property. |
| `position` | `BoxPosition`| - | CSS position property. |
| `bg` | `string` | - | Background color (raw or token). |
| `color` | `string` | - | Text color (raw or token). |
| `w` / `h` | `string \| number` | - | Width / Height (number defaults to `px`). |
| `m` / `p` | `string \| number` | - | Margin / Padding (all sides). |
| `mx` / `my` | `string \| number` | - | Horizontal / Vertical margin. |
| `px` / `py` | `string \| number` | - | Horizontal / Vertical padding. |
| `border` | `string \| number` | - | Border shorthand (thickness or full string). |
| `borderRadius`| `string \| number` | - | Corner radius. |
| `shadow` | `'none'\|'sm'\|'md'\|'lg'\|'xl'` | - | Box shadow preset. |
| `gap` | `string \| number` | - | Gap between flex/grid items. |
| `zIndex` | `number` | - | Stack order. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-box` | Base box class. |
| `.lxs-box--display-[value]` | Display mode modifier. |
| `.lxs-box--position-[value]` | Position mode modifier. |
| `.lxs-box--shadow-[value]` | Shadow depth modifier. |
| `.lxs-box--flex-dir-[value]` | Flex direction modifier. |
