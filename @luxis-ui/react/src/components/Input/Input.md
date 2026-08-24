# Input

The `Input` component is a feature-rich text entry field. It supports icons, validation states, character counters, and clearable functionality, making it suitable for any form-based interface.

## Features

- **Icon Slots**: Dedicated `leftIcon` and `rightIcon` slots for contextual graphics.
- **Prefix & Suffix**: Append or prepend static text (e.g., "$", "@", ".com").
- **Clearable**: Integrated "X" button to quickly wipe the input value.
- **Validation**: Support for `error` and `success` states with automatic color shifting.
- **Character Counter**: Real-time counter when `maxLength` and `showCount` are set.
- **Responsive**: Available in `sm`, `md`, and `lg` sizes with `fullWidth` capability.
- **Accessible**: Managed `id`, `htmlFor`, and `aria-describedby` linking for screen readers.

## Installation

```bash
import { Input } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Input } from '@luxis-ui/react';

const App = () => (
  <Input 
    label="Username" 
    placeholder="Enter your username" 
    helperText="Choose a unique public name."
  />
);
```

### With Icons and Prefixes

```tsx
<Input 
  label="Price"
  prefix="$" 
  type="number" 
  rightIcon={<QuestionIcon />}
/>

<Input 
  label="Search" 
  leftIcon={<SearchIcon />} 
  clearable
  onClear={() => console.log('Cleared')}
/>
```

### Validation and Counters

```tsx
<Input 
  label="Bio" 
  maxLength={150} 
  showCount 
  error="Bio is too long"
/>
```

## API Reference

### Input Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | - | Header text above the input. |
| `value` | `string \| number`| - | Controlled value of the input. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of the input box and text. |
| `leftIcon` | `ReactNode` | - | Leading icon inside the box. |
| `rightIcon` | `ReactNode` | - | Trailing icon inside the box. |
| `prefix` | `string` | - | Static text at the start. |
| `suffix` | `string` | - | Static text at the end. |
| `clearable` | `boolean` | `false` | Shows a clear button when text exists. |
| `showCount` | `boolean` | `false` | Shows character count (requires `maxLength`). |
| `error` | `string` | - | Error message and red theme. |
| `success` | `string` | - | Success message and green theme. |
| `fullWidth` | `boolean` | `false` | Expands to fill container width. |

**Note**: `Input` accepts all standard attributes of the HTML `<input>` element.

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-input-wrapper` | The outermost component container. |
| `.lxs-input-container` | The stylized box containing input and icons. |
| `.lxs-input` | The actual native `<input>` element. |
| `.lxs-input-icon` | Wrapper for internal icons. |
| `.lxs-input-prefix` | Styled prefix text. |
| `.lxs-input-clear` | The interactive clear button. |
| `.lxs-input-counter` | The character count display element. |
