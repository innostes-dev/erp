# Select

The `Select` component is a comprehensive dropdown selection control. It supports single-choice picking with integrated labels, validation states, and advanced grouping functionality.

## Features

- **Standard HTML Select**: Built on top of the native `<select>` element for maximum device compatibility and accessibility.
- **Grouped Options**: Automatically organizes choices into categories using the `grouped` prop.
- **Dynamic Property Mapping**: Custom data objects can be mapped to labels, values, and disabled states using key strings or functions.
- **Validation Integrated**: Built-in support for `error` and `success` messages with full theme integration.
- **Loading State**: Swaps the dropdown arrow for a spinner when `loading` is true.
- **Size Options**: Available in `sm`, `md`, and `lg` variants.
- **Full Width**: easily toggle `fullWidth` for responsive form layouts.

## Installation

```bash
import { Select } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Select } from '@luxis-ui/react';

const options = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
];

const App = () => (
  <Select 
    label="Country" 
    options={options} 
    placeholder="Select a country" 
  />
);
```

### Grouped Options

```tsx
const categories = [
  { value: 'react', label: 'React', group: 'Frontend' },
  { value: 'node', label: 'Node.js', group: 'Backend' },
  { value: 'figma', label: 'Figma', group: 'Design' },
];

<Select 
  label="Skill" 
  options={categories} 
  grouped 
/>
```

### With Validation States

```tsx
<Select 
  label="Account Type"
  options={accounts}
  error="Please select an account type"
  required
/>
```

## API Reference

### Select Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options` | `Option[]` | **Required** | Array of select options. |
| `label` | `string` | - | Header text. |
| `placeholder` | `string` | - | First disabled item text. |
| `grouped` | `boolean` | `false` | Enables `optgroup` rendering. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of the input box. |
| `loading` | `boolean` | `false` | Shows spinner in arrow slot. |
| `error` | `string` | - | Error message and red theme. |
| `success` | `string` | - | Success message and green theme. |
| `onSelectChange`| `(val, opt) => void` | - | Fired on change with full option. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-select-wrapper` | Outermost container. |
| `.lxs-select-container` | Styled box around the native select. |
| `.lxs-select` | The actual native `<select>` element. |
| `.lxs-select-icon` | Wrapper for arrow/spinner. |
| `.lxs-select-helper` | Secondary description text. |
