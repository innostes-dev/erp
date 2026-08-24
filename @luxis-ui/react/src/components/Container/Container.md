# Container

The `Container` component is a responsive layout wrapper used to center and constrain content within a maximum width. It follows industry-standard breakpoints and provides consistent gutters.

## Features

- **Polymorphic**: Render as any structural element (e.g., `section`, `main`, `footer`) using the `as` prop.
- **Responsive Widths**: Integrated support for standard breakpoints (`sm`, `md`, `lg`, `xl`, `xxl`).
- **Flexible Modes**: Use `maxWidth="responsive"` for stepping widths (Bootstrap-style) or `fluid` for 100% width.
- **Custom Gutters**: Adjustable horizontal padding (`none`, `sm`, `md`, `lg`) that respects responsive screens.
- **Centering**: Built-in `centered` prop to manage `margin: auto` logic.

## Breakpoints (max-width)

| Size | Width |
| :--- | :--- |
| `xs` | 100% |
| `sm` | 540px |
| `md` | 720px |
| `lg` | 960px |
| `xl` | 1140px |
| `xxl`| 1320px |

## Installation

```bash
import { Container } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Container } from '@luxis-ui/react';

const App = () => (
  <Container>
    <h1>Welcome to Luxis UI</h1>
    <p>This content is constrained and centered.</p>
  </Container>
);
```

### Fluid Layout

Use `fluid` for full-width sections that still require side gutters.

```tsx
<Container fluid as="section" bg="neutral.100" py={40}>
  <h2>Full Width Section</h2>
</Container>
```

### Specific Breakpoint

```tsx
<Container maxWidth="lg" gutter="lg">
  <p>This container will only grow to 960px and has larger side padding.</p>
</Container>
```

## API Reference

### Container Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `as` | `ContainerAs` | `'div'` | The HTML tag to render. |
| `maxWidth` | `ContainerMaxWidth`| `'responsive'` | The fixed max-width or adaptive mode. |
| `fluid` | `boolean` | `false` | Spans 100% width (overrides `maxWidth`). |
| `gutter` | `'none'\|'sm'\|'md'\|'lg'` | `'md'` | Internal horizontal padding. |
| `centered` | `boolean` | `true` | Centers the container via margin safely. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-container` | Base container styles. |
| `.lxs-container--centered` | Applied when `centered` is true. |
| `.lxs-container--fluid` | 100% width styling. |
| `.lxs-container--[maxWidth]`| Max-width breakpoint modifier. |
| `.lxs-container--gutter-[val]`| Gutter scaling modifier. |
