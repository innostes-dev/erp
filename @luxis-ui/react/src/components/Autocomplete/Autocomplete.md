# Autocomplete

The `Autocomplete` component is an enhanced text input that provides a list of suggestions as the user types. It supports complex data objects, custom rendering, and server-side searching.

## Features

- **Rich Data Structures**: Works with arrays of strings or objects.
- **Custom Mapping**: Configure how labels and values are extracted via `getOptionLabel` and `getOptionValue`.
- **Validation States**: Integrated `error`, `success`, and `helperText` support.
- **Loading State**: Built-in spinner and loading messages for asynchronous data.
- **Custom Rendering**: Fully customizable option list rendering using `renderOption`.
- **Filtering Options**: Supports both client-side and server-side filtering.
- **Keyboard Navigation**: Full support for Arrow keys, Enter, and Escape.
- **Accessibility**: ARIA-compliant combobox implementation.

## Installation

```bash
import { Autocomplete } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Autocomplete } from '@luxis-ui/react';

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

const App = () => (
  <Autocomplete
    label="Choose a fruit"
    placeholder="Start typing..."
    options={options}
    onSelect={(val) => console.log('Selected:', val)}
  />
);
```

### Custom Getters

If your data doesn't use `label` and `value` keys, you can specify mapping logic.

```tsx
const users = [
  { id: 101, fullName: 'John Doe', email: 'john@example.com' },
  { id: 102, fullName: 'Jane Smith', email: 'jane@example.com' },
];

<Autocomplete
  options={users}
  getOptionLabel={(user) => user.fullName}
  getOptionValue="id"
  getOptionDescription="email"
/>
```

### Asynchronous/Filtered Search

For server-side filtering, disable the client-side filter and use `onChange` to fetch data.

```tsx
<Autocomplete
  options={asyncResults}
  loading={isSearching}
  disableClientFilter
  onChange={(query) => debouncedFetch(query)}
  showSearchIcon
/>
```

### Custom Option Rendering

```tsx
<Autocomplete
  options={products}
  renderOption={(product) => (
    <div className="custom-option">
      <img src={product.thumb} />
      <span>{product.name}</span>
      <strong>${product.price}</strong>
    </div>
  )}
/>
```

## API Reference

### Autocomplete Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options` | `any[]` | `[]` | Data array for suggestions. |
| `label` | `string` | - | Floating or static label text. |
| `placeholder` | `string` | - | Input placeholder. |
| `value` | `string` | - | Controlled input value. |
| `getOptionLabel` | `string \| (opt) => string` | `'label'` | Maps data to display text. |
| `getOptionValue` | `string \| (opt) => string` | `'value'` | Maps data to return value. |
| `getOptionDescription`| `string \| (opt) => string`| `'description'`| Secondary text for options. |
| `getOptionIcon` | `string \| (opt) => node` | `'icon'` | Leading icon for options. |
| `getOptionDisabled`| `string \| (opt) => boolean`| `'disabled'` | Prevents selection of option. |
| `loading` | `boolean` | `false` | Shows a loading spinner. |
| `loadingMessage` | `string` | `'Loading...'` | Text shown when loading. |
| `noOptionsMessage` | `string` | `'No options'` | Text shown when list is empty. |
| `onChange` | `(val: string) => void` | - | Fired when typing. |
| `onSelect` | `(val, opt) => void` | - | Fired when option clicked. |
| `onClear` | `() => void` | - | Fired when clear button clicked. |
| `showSearchIcon` | `boolean` | `false` | Shows search icon on left. |
| `clearable` | `boolean` | `false` | Shows clear button when valued. |
| `error` | `string` | - | Error message/state. |
| `success` | `string` | - | Success message/state. |
| `helperText` | `string` | - | Descriptive text below input. |
| `openOnFocus` | `boolean` | `true` | Opens list immediately on focus. |
| `minSearchLength` | `number` | `0` | Min chars before showing list. |
| `disableClientFilter`| `boolean` | `false` | Skips built-in filtering. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-autocomplete-wrapper` | Main outer container. |
| `.lxs-autocomplete-container` | Wrapper for input and icons. |
| `.lxs-autocomplete-input` | The `<input>` element. |
| `.lxs-autocomplete-dropdown` | The popup suggestions list. |
| `.lxs-autocomplete-option` | Individual list item. |
| `.lxs-autocomplete-option--highlighted`| Active keyboard navigation state. |
| `.lxs-autocomplete-option__label` | Main option text. |
| `.lxs-autocomplete-message` | Loading/Empty state container. |
