# DataGrid

The `DataGrid` is a high-performance, feature-rich component for displaying large datasets with complex interactions. It supports sorting, filtering, pagination, selection, and more.

## Features

- **High Performance**: Optimized for large datasets with built-in virtualization support.
- **Sorting**: Multi-column sorting (Shift+Click) with customizable sort logic.
- **Filtering**: advanced column-specific filters with multiple operators (contains, equals, gt, lt, etc.).
- **Interactive Columns**: Supports resizing, reordering (Drag & Drop), and pinning (Left/Right).
- **Selection**: Supports `single`, `multiple`, and `checkbox` selection modes.
- **State Management**: Fully controlled or uncontrolled state for sorting, filters, and pagination.
- **Responsive Layout**: Density presets (`compact`, `standard`, `comfortable`) and sticky headers.
- **Rich Cells**: Custom cell and header renderers for complex UI inside the grid.
- **Group & Aggregate**: Support for row grouping and footer aggregations (sum, avg, count).
- **Exporting**: One-click CSV export and clipboard copying.

## Installation

```bash
import { DataGrid } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { DataGrid, ColDef } from '@luxis-ui/react';

const columns: ColDef[] = [
  { key: 'id', header: 'ID', width: 70, sortable: true },
  { key: 'name', header: 'Full Name', flex: 1, sortable: true, filterable: true },
  { key: 'role', header: 'Role', width: 150 },
  { key: 'status', header: 'Status', type: 'boolean', width: 100 },
];

const rows = [
  { id: 1, name: 'John Doe', role: 'Admin', status: true },
  { id: 2, name: 'Jane Smith', role: 'User', status: false },
];

const App = () => (
  <DataGrid
    rows={rows}
    columns={columns}
    height={400}
    pagination
    sorting
  />
);
```

### Advanced Filtering and Selection

```tsx
<DataGrid
  rows={users}
  columns={columns}
  selection="checkbox"
  showColumnFilters
  filtering
  onSelectionChange={(ids) => console.log('Selected:', ids)}
/>
```

### Custom Rendering

```tsx
const columns = [
  {
    key: 'status',
    header: 'Progress',
    cellRenderer: ({ value }) => (
      <ProgressBar value={value} />
    )
  }
];
```

## API Reference

### DataGrid Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `rows` | `T[]` | **Required** | The data source to display. |
| `columns` | `ColDef[]` | **Required** | Configuration for data columns. |
| `sorting` | `boolean` | `false` | Enables sorting globally. |
| `multiSort` | `boolean`| `false` | Allows sorting by multiple columns. |
| `filtering` | `boolean` | `false` | Enables filtering features. |
| `selection` | `SelectionMode` | `false` | Selection mode: `single`, `multiple`, `checkbox`. |
| `pagination`| `boolean` | `false` | Enables bottom pagination bar. |
| `loading` | `boolean` | `false` | Shows an overlay loader. |
| `density` | `GridDensity` | `'standard'`| Spacing density: `compact`, `standard`, `comfortable`. |
| `columnResize`| `boolean`| `false` | Allows users to drag column edges. |
| `columnReorder`| `boolean`| `false` | Allows dragging columns to new positions. |
| `virtualized`| `boolean`| `false` | Uses windowing for performance on large lists. |
| `showToolbar`| `boolean`| `false` | Displays top toolbar with search/export. |
| `exportCsv` | `boolean`| `false` | Enables CSV download button in toolbar. |

### ColDef (Column Definition)

| Key | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | Unique identifier for the column. |
| `header` | `ReactNode` | Text or node shown in the header. |
| `accessor` | `key \| (row) => val` | Custom data retrieval logic. |
| `width` | `number` | Fixed pixel width. |
| `flex` | `number` | Expansion ratio for remaining space. |
| `sortable`| `boolean` | If false, disables sorting for this column. |
| `pinned` | `'left'\|'right'` | Fixed column position during scroll. |
| `type` | `'string'\|'number'\|'date'\|'boolean'` | influences filter operators and default formatting. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-datagrid` | Root grid component. |
| `.lxs-datagrid__header` | The header container. |
| `.lxs-datagrid__row` | Individual row container. |
| `.lxs-datagrid__cell` | Cell element within a row. |
| `.lxs-datagrid__toolbar`| Header toolbar (search, export). |
| `.lxs-datagrid__footer` | Footer bar (pagination, stats). |
