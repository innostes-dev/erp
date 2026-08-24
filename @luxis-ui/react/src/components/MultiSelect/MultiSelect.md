# MultiSelect

The `MultiSelect` component is a professional dropdown for picking multiple options. It features integrated chip tags, searchable filtering, and advanced group support, making it ideal for tagging systems or complex filters.

## Features

- **Chip Display**: Selected items are rendered as removable `Chip` tags inside the input area.
- **Max Chips**: Use `maxChipsDisplay` to automatically collapse long lists into a "+N more" indicator.
- **Searchable**: Optional built-in search field to filter long option lists.
- **Selection Styles**: Switch between `checkbox` (default) or `checkmark` visual feedback.
- **Select All / Clear All**: Built-in actions for rapid bulk selection.
- **Grouped Options**: Organize items into functional categories with `grouped` support.
- **Polymorphic Options**: Map custom data objects using `getOptionLabel` and `getOptionValue`.
- **Form Integrated**: Automatically manages a hidden `<select multiple>` for native form compatibility.
- **Loading State**: Built-in spinner for asynchronous data fetching.

## Installation

```bash
import { MultiSelect } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { MultiSelect } from '@luxis-ui/react';

const technologies = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
];

const App = () => (
  <MultiSelect 
    label="Frameworks" 
    options={technologies} 
    placeholder="Select multiple..."
  />
);
```

### Searchable & Select All

```tsx
<MultiSelect 
  label="Users" 
  options={userList} 
  searchable 
  showSelectAll 
  selectionStyle="checkmark"
/>
```

### Collapsed Chips

```tsx
<MultiSelect 
  label="Large Selection" 
  options={data} 
  maxChipsDisplay={3} 
  chipColor="info"
/>
```

## API Reference

### MultiSelect Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options` | `Option[]` | **Required** | Array of items to select from. |
| `value` | `any[]` | - | Controlled selection values. |
| `onChange` | `(values, options) => void`| - | Fired on selection change. |
| `placeholder` | `string` | `'Select...'` | Text shown when empty. |
| `searchable` | `boolean` | `false` | Shows search input in dropdown. |
| `showSelectAll`| `boolean` | `false` | Shows bulk action buttons. |
| `maxChipsDisplay`| `number` | - | Limit of chips before "+N" shows. |
| `grouped` | `boolean` | `false` | Enables category rendering. |
| `selectionStyle`| `'checkbox'\|'checkmark'` | `'checkbox'` | Visual pick indicator style. |
| `chipColor` | `string` | `'primary'` | Theme color for the tags. |
| `loading` | `boolean` | `false` | Shows a spinner icon. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-multiselect-container` | Main input area box. |
| `.lxs-multiselect-dropdown` | The results overlay. |
| `.lxs-multiselect-option` | Individual result row. |
| `.lxs-multiselect-chips` | Container for the selected tags. |
| `.lxs-multiselect-search` | Wrapper for the filter input. |
| `.lxs-multiselect-actions` | Bulk button container. |
