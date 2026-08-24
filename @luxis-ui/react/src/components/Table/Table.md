# Table

The `Table` component is a flexible, semantic foundation for displaying tabular data. It provides a clean design system for rows, headers, and cells with advanced features like sticky positioning and striped variants.

## Features

- **Semantic HTML**: Renders a standard `<table>` structure for maximum accessibility and SEO.
- **Visual Variants**: Choose between `simple`, `striped`, or `bordered` presets.
- **Sticky Elements**: Integrated support for `stickyHeader`, `stickyFooter`, and pinning the `first` or `last` columns.
- **Interactive**: Built-in `hoverable` state for better row tracking.
- **Loading State**: Displays a dimming effect and `aria-busy` indicator while data is being fetched.
- **Polymorphic**: Use the `as` prop to render as a `div` or other elements if necessary (though `table` is default).
- **Size Options**: Available in `sm`, `md`, and `lg` spacings.

## Installation

```bash
import { Table, TableHead, TableBody, TableRow, TableCell } from '@luxis-ui/react';
```

## Usage

### Basic Striped Table

```tsx
import { Table, TableHead, TableBody, TableRow, TableCell } from '@luxis-ui/react';

const App = () => (
  <Table variant="striped" hoverable>
    <TableHead>
      <TableRow>
        <TableCell as="th">Product</TableCell>
        <TableCell as="th">Status</TableCell>
        <TableCell as="th">Price</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>Widget Pro</TableCell>
        <TableCell>Active</TableCell>
        <TableCell>$29.99</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);
```

### Sticky Header & Fixed Column

```tsx
<Table stickyHeader stickyFirstColumn height={400}>
  <TableHead>...</TableHead>
  <TableBody>...</TableBody>
</Table>
```

## API Reference

### Table Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'simple'\|'striped'\|'bordered'` | `'simple'` | Visual style preset. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Padding and font scale. |
| `stickyHeader`| `boolean` | `false` | Keeps header visible during scroll. |
| `stickyFirstColumn`| `boolean` | `false` | Pins the first column horizontally. |
| `hoverable` | `boolean` | `true` | Highlights row on mouse over. |
| `loading` | `boolean` | `false` | Shows a loading overlay. |

### TableCell Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `as` | `'td' \| 'th'` | `'td'` | Renders as data or header cell. |
| `align` | `'left'\|'center'\|'right'` | `'left'` | Text alignment. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-table` | Main table element. |
| `.lxs-table--zebra` | Striped row styling. |
| `.lxs-table--sticky-header`| Applied when header is fixed. |
| `.lxs-table-row` | Table row container. |
| `.lxs-table-cell` | Individual data/header cell. |
