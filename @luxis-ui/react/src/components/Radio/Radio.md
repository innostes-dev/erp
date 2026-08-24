# Radio & RadioGroup

The `Radio` component allow users to select a single option from a set. The `RadioGroup` manages multiple related radio buttons, providing shared state and layout control.

## Features

- **RadioGroup Management**: Unified `onChange` and `name` handling for multiple options.
- **Directional Layout**: Display options either `vertical` (stacked) or `horizontal` (inline).
- **Multiple Sizes**: Available in `sm`, `md`, and `lg` variants.
- **Custom Icons**: CSS-based "dot" styling with support for custom variants (`success`, `error`, `warning`, etc.).
- **Helper Text**: Detailed descriptions for the entire group or individual buttons.
- **Controlled & Uncontrolled**: Support for both `value` (controlled) and `defaultValue` (uncontrolled) modes.
- **Accessible**: Automatic `radiogroup` role and shared `name` attribute linking.

## Installation

```bash
import { Radio, RadioGroup } from '@luxis-ui/react';
```

## Usage

### Simple Radio Group

```tsx
import { RadioGroup } from '@luxis-ui/react';

const options = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const App = () => (
  <RadioGroup 
    name="size-picker" 
    label="Select Size" 
    options={options} 
    defaultValue="medium"
  />
);
```

### Horizontal Layout with Variants

```tsx
<RadioGroup 
  name="notification-status"
  label="Notifications"
  orientation="horizontal"
  variant="success"
  options={[
    { value: 'on', label: 'Enabled' },
    { value: 'off', label: 'Disabled' }
  ]}
/>
```

### Individual Radio Usage

```tsx
<Radio 
  label="I accept the terms" 
  variant="primary" 
  error 
  helperText="You must accept to continue" 
/>
```

## API Reference

### RadioGroup Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Required** | The HTML `name` attribute for group. |
| `options` | `RadioOption[]`| **Required** | List of option objects. |
| `value` | `string` | - | Currently selected radio value. |
| `onChange` | `(val) => void` | - | Fired when selection changes. |
| `orientation` | `'vertical' \| 'horizontal'`| `'vertical'`| Layout of the group. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of the radios. |
| `variant` | `string` | `'primary'` | Theme color variant. |
| `error` | `boolean` | `false` | Apply error colors to group. |

### Radio Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `checked` | `boolean` | - | Whether it is selected. |
| `label` | `ReactNode` | - | Text/element shown next to circle. |
| `disabled` | `boolean` | `false` | Prevents interaction. |
| `helperText` | `ReactNode` | - | Secondary text below the radio. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-radio-group` | Wrapper for multiple radios. |
| `.lxs-radio` | The individual radio container. |
| `.lxs-radio-input` | The hidden native `<input type="radio">`. |
| `.lxs-radio-circle` | The custom styled SVG/CSS circle. |
| `.lxs-radio-dot` | The center dot when checked. |
