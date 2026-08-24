# FormControl

The `FormControl` component is a high-level wrapper used to group form elements with their labels, helper text, and validation messages. It ensures consistent spacing and layout for all user inputs.

## Features

- **Unified Messaging**: Manages `helperText`, `error`, and `success` messages in a structured way.
- **Label Management**: Automated `htmlFor` association and optional "Required" asterisk indicators.
- **Positioning**: Support for labels positioned `top` (default) or `left` (horizontal form style).
- **Responsive Sizing**: Configurable `spacing` and `fullWidth` behavior.
- **Accessible State**: Automatically wires up `aria-describedby` links for screen readers when messages are present.
- **Extensible**: Designed to wrap any input component (`Input`, `Select`, `Switch`, `DataGrid`, etc.).

## Installation

```bash
import { FormControl } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { FormControl, Input } from '@luxis-ui/react';

const App = () => (
  <FormControl label="Email Address" helperText="We will never share your email.">
    <Input placeholder="name@company.com" type="email" />
  </FormControl>
);
```

### With Validation Error

```tsx
<FormControl 
  label="Password" 
  error="Password must be at least 8 characters."
  required
>
  <Input type="password" />
</FormControl>
```

### Horizontal Layout

```tsx
<FormControl label="Search" labelPosition="left">
  <Input placeholder="Type query..." />
</FormControl>
```

## API Reference

### FormControl Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `children` | `ReactNode` | **Required** | The input component to be wrapped. |
| `label` | `string` | - | Descriptive text for the field. |
| `labelPosition`| `'top' \| 'left'` | `'top'` | Relative position of the label. |
| `required` | `boolean` | `false` | Shows asterisk and adds aria-required. |
| `disabled` | `boolean` | `false` | Dimms the label and children. |
| `helperText` | `string` | - | Instructional text shown below the field. |
| `error` | `string` | - | Displays error message and red styling. |
| `success` | `string` | - | Displays success message and green styling. |
| `spacing` | `'none'\|'sm'\|'md'\|'lg'`| `'md'` | Margin below the form control. |
| `fullWidth` | `boolean` | `true` | Container spans 100% width. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-form-control` | Root wrapper component. |
| `.lxs-form-control__inner` | Flex container for label and field. |
| `.lxs-form-control__label` | Styled label element. |
| `.lxs-form-control__field` | Wrapper for the actual input child. |
| `.lxs-form-control__messages` | Container for secondary messages. |
| `.lxs-form-control__error` | Styled error message paragraph. |
| `.lxs-form-control__helper` | Styled helper text paragraph. |
