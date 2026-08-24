# Grid

The `Grid` component is a responsive 12-column layout system. It enables complex page structures that adapt gracefully across mobile, tablet, and desktop viewports.

## Features

- **12-Column System**: Modular grid based on a standard 12-unit scale.
- **Breakpoint Aware**: Five distinct breakpoints: `xs` (0px+), `sm` (600px+), `md` (960px+), `lg` (1280px+), and `xl` (1920px+).
- **Container vs Item**: Separation of concerns between the parent `container` (flex-parent) and children `item` (flex-child).
- **Responsive Spacing**: Adjustable `spacing`, `rowSpacing`, and `columnSpacing` using a theme-aware scale (0-10).
- **Auto & Boolean Sizing**: Supports `xs={true}` for fluid fill, or `xs="auto"` for content-driven width.
- **Alignment Control**: Direct props for `justifyContent`, `alignItems`, and `alignContent`.

## Installation

```bash
import { Grid } from '@luxis-ui/react';
```

## Usage

### Basic Grid

```tsx
import { Grid } from '@luxis-ui/react';

const App = () => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={8}>
      <div className="box">Main Content (8 units)</div>
    </Grid>
    <Grid item xs={12} md={4}>
      <div className="box">Sidebar (4 units)</div>
    </Grid>
  </Grid>
);
```

### Complex Responsive Layout

```tsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    <Card label="Widget 1" />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <Card label="Widget 2" />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <Card label="Widget 3" />
  </Grid>
  <Grid item xs={12} sm={6} md={3}>
    <Card label="Widget 4" />
  </Grid>
</Grid>
```

### Spacing Options

```tsx
<Grid container spacing={0}> {/* No Gaps */}
<Grid container rowSpacing={4} columnSpacing={2}> {/* Mixed Gaps */}
```

## API Reference

### Grid Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `container` | `boolean` | `false` | Enable flex container behavior. |
| `item` | `boolean` | `false` | Enable flex item behavior. |
| `spacing` | `0-10` | `0` | Uniform gap between grid items. |
| `rowSpacing`| `0-10` | - | Vertical gap between rows. |
| `columnSpacing`| `0-10` | - | Horizontal gap between columns. |
| `xs`, `sm`, `md`, `lg`, `xl` | `GridSize` | - | Width for specific breakpoint (1-12, `true`, or `'auto'`). |
| `direction` | `'row'\|'column'\|...` | `'row'` | Flex direction for container. |
| `wrap` | `'nowrap'\|'wrap'\|...`| `'wrap'`| Flex wrap behavior. |
| `justifyContent`| `string` | - | Alignment along the main axis. |
| `alignItems` | `string` | - | Alignment along the cross axis. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-grid` | Base grid class. |
| `.lxs-grid-container` | Applied to the wrapper. |
| `.lxs-grid-item` | Applied to children items. |
| `.lxs-grid-[breakpoint]-[size]`| width mapping (e.g., `.lxs-grid-md-6`). |
| `.lxs-grid-spacing-[n]` | Padding/margin logic for gaps. |
