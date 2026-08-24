# CheckboxGroup

The `CheckboxGroup` component provides a convenient way to manage a collection of related checkboxes. It handles shared state, layout orientation, and group-level validation.

## Features

- **Centralized Value Management**: Tracks an array of selected values automatically.
- **Layout Flexibility**: Switch between `horizontal` and `vertical` (default) arrangements.
- **Group Labels**: Built-in support for section headers and helper instructions.
- **Unified Validation**: Apply `error` states to the entire group at once.
- **Prop Delegation**: Automatically forwards `size`, `variant`, and `disabled` states to all child checkboxes.
- **Controlled & Uncontrolled**: Supports `value` and `defaultValue` patterns.

## Installation

```bash
import { CheckboxGroup } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { CheckboxGroup } from '@luxis-ui/react';

const options = [
  { value: 'email', label: 'Email Notifications' },
  { value: 'sms', label: 'SMS Alerts' },
  { value: 'push', label: 'Push Notifications', disabled: true },
];

const App = () => (
  <CheckboxGroup
    label="Notification Preferences"
    options={options}
    defaultValue={['email']}
    onChange={(vals) => console.log('Selected:', vals)}
  />
);
```

### Horizontal Layout

```tsx
<CheckboxGroup
  label="Hobbies"
  orientation="horizontal"
  options={[
    { value: 'reading', label: 'Reading' },
    { value: 'coding', label: 'Coding' },
    { value: 'gaming', label: 'Gaming' },
  ]}
/>
```

### With Validation

```tsx
<CheckboxGroup
  label="Required Selections"
  options={options}
  error={true}
  helperText="Please select at least one method."
/>
```

## API Reference

### CheckboxGroup Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options` | `CheckboxOption[]` | **Required** | Array of objects defining checkboxes. |
| `label` | `ReactNode` | - | Header for the collection. |
| `value` | `string[]` | - | Controlled array of selected values. |
| `defaultValue` | `string[]` | `[]` | Initial selection for uncontrolled mode. |
| `onChange` | `(values: string[]) => void` | - | Callback fired with new array of values. |
| `orientation` | `'horizontal' \| 'vertical'`| `'vertical'` | Arrangement of the checkboxes. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scaled size of all child checkboxes. |
| `error` | `boolean` | `false` | Applies error styling to the group context. |
| `helperText` | `ReactNode` | - | Message shown below the group. |
| `disabled` | `boolean` | `false` | Disables all checkboxes in the group. |

### CheckboxOption Object

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | **Required** | Data value returned in results. |
| `label` | `ReactNode` | **Required** | Visible label for the checkbox. |
| `disabled` | `boolean` | `false` | Disables only this specific option. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-checkbox-group` | Root group container. |
| `.lxs-checkbox-group--horizontal`| Flex layout for horizontal view. |
| `.lxs-checkbox-group-label` | Group header text. |
| `.lxs-checkbox-group-options` | Container for the checkbox list. |
| `.lxs-checkbox-group-helper-text`| Messaging below the group. |
