# ToggleButton

The `ToggleButton` (frequently called a **Switch**) allows users to toggle a binary state on or off. It is a more visual alternative to a standard checkbox, commonly used for settings and preferences.

## Features

- **Toggle UI**: Standard "track and thumb" switch animation.
- **Multiple Sizes**: Available in `sm`, `md`, and `lg` variants.
- **Label Placement**: Flexible positioning for labels: `start`, `end` (default), `top`, or `bottom`.
- **Integrated Icons**: Built-in support for icons inside the sliding thumb, with specific `checkedIcon` support.
- **Validation Integrated**: Support for `error` states and `helperText` descriptions.
- **Controlled & Uncontrolled**: Seamless integration with `checked` or `defaultChecked`.
- **Accessible**: Renders a native `<input type="checkbox">` with `role="switch"` for screen reader accuracy.

## Installation

```bash
import { ToggleButton } from '@luxis-ui/react';
```

## Usage

### Simple Toggle

```tsx
import { ToggleButton } from '@luxis-ui/react';

const App = () => (
  <ToggleButton 
    label="Mute Notifications" 
    onChange={(e) => console.log(e.target.checked)} 
  />
);
```

### With Icons and Variants

```tsx
<ToggleButton 
  label="Dark Mode"
  variant="secondary"
  icon={<SunIcon />}
  checkedIcon={<MoonIcon />}
/>
```

### Large Label Top

```tsx
<ToggleButton 
  label="WiFi" 
  labelPlacement="top" 
  size="lg" 
  defaultChecked 
/>
```

## API Reference

### ToggleButton Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `ReactNode` | - | Descriptive text. |
| `labelPlacement`| `'start'\|'end'\|'top'\|'bottom'` | `'end'` | Alignment of the text. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of the switch. |
| `variant` | `string` | `'primary'` | Track color when active. |
| `error` | `boolean` | `false` | Red error UI state. |
| `icon` | `ReactNode` | - | Indicator inside the knob. |
| `checkedIcon` | `ReactNode` | - | Icon inside the knob when ON. |
| `checked` | `boolean` | - | Controlled ON/OFF state. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-toggle-button` | Main component container. |
| `.lxs-toggle-button-label`| Text wrapper. |
| `.lxs-toggle-button-track`| The background sliding area. |
| `.lxs-toggle-button-thumb`| The moving circular handle. |
| `.lxs-toggle-button-input`| The hidden native `<input>` element. |
| `.lxs-toggle-button-icon` | Wrapper for icon inside thumb. |
