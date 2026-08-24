# Checkbox

The `Checkbox` component allows users to select one or more items from a set, or toggle a binary boolean state. It features support for custom labels, indeterminate states, and multiple validation levels.

## Features

- **Indeterminate State**: Specialized state used when a parent manages multiple children with mixed states.
- **Custom Variants**: Supports `primary`, `secondary`, `success`, `error`, `warning`, and `info`.
- **Flexible Sizes**: Choose from `sm`, `md`, or `lg`.
- **Validation Support**: Integrated `error` state and `helperText` slot.
- **Accessible**: Built with a native hidden input for standard form submission and screen reader compatibility.
- **Customizable**: CSS variables available for fine-tuned sizing and color control.

## Installation

```bash
import { Checkbox } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Checkbox } from '@luxis-ui/react';

const App = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <Checkbox label="Remember me" defaultChecked />
    <Checkbox label="Accept terms" required />
    <Checkbox label="Disabled option" disabled />
  </div>
);
```

### Indeterminate State

```tsx
<Checkbox 
  label="Select All" 
  indeterminate={true} 
  onChange={(e) => console.log('Toggled', e.target.checked)} 
/>
```

### Validation and Help Text

```tsx
<Checkbox 
  label="I agree to the privacy policy" 
  error={true}
  helperText="You must agree to continue."
/>
```

### Variants and Sizes

```tsx
<Checkbox label="Small Primary" size="sm" variant="primary" />
<Checkbox label="Large Success" size="lg" variant="success" />
```

## API Reference

### Checkbox Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `ReactNode` | - | Label displayed next to the box. |
| `checked` | `boolean` | - | Controlled checked state. |
| `defaultChecked` | `boolean` | - | Uncontrolled initial state. |
| `indeterminate` | `boolean` | `false` | Displays the minus icon instead of check. |
| `variant` | `'primary'\|'secondary'\|'success'\|'error'\|'warning'\|'info'` | `'primary'` | Brand color highlight. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of the checkbox box. |
| `error` | `boolean` | `false` | Applies red error styling. |
| `helperText` | `ReactNode` | - | Message shown below the checkbox. |
| `disabled` | `boolean` | `false` | Prevents user interaction. |
| `onChange` | `(event) => void` | - | Callback when state changes. |

**Note**: `Checkbox` accepts all standard attributes for HTML input elements (e.g. `name`, `value`, `required`).

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-checkbox` | Main container wrapper. |
| `.lxs-checkbox-label` | The target area for clicks (box + text). |
| `.lxs-checkbox-box` | The visual box element. |
| `.lxs-checkbox-input` | The hidden native input. |
| `.lxs-checkbox-icon--check` | The checkmark SVG. |
| `.lxs-checkbox-icon--indeterminate`| The dash SVG. |
| `.lxs-checkbox-helper-text` | Sled message below the field. |
