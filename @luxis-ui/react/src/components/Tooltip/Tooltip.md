# Tooltip

The `Tooltip` component displays brief, informative messages when a user hovers over, focuses on, or taps an element. It is built using portals to ensure proper layering over any content.

## Features

- **Portal Rendering**: Automatically injected into `document.body` to prevent clipping by containers with `overflow: hidden`.
- **Comprehensive Placement**: supports 12 different directions including `top-start`, `right-end`, etc.
- **Smart Delays**: Configurable `delay` (on show) and `hideDelay` to prevent accidental flickering.
- **Visual Variants**: Presets for `dark`, `light`, `success`, `warning`, `error`, and `info`.
- **Dismissible**: Optional close button for manual removal.
- **Arrow Indicator**: Optional CSS arrow pointing to the trigger element.
- **Multi-modal Support**: Works with both Mouse (hover) and Keyboard (focus) triggers.
- **Controlled Visibility**: Use the `open` prop for programmatic control.

## Installation

```bash
import { Tooltip } from '@luxis-ui/react';
```

## Usage

### Simple Hover Text

```tsx
import { Tooltip } from '@luxis-ui/react';

const App = () => (
  <Tooltip content="Permanent delete" placement="top">
    <IconButton icon={<TrashIcon />} />
  </Tooltip>
);
```

### With Arrow and Warning Style

```tsx
<Tooltip 
  content="High server load detected" 
  variant="warning" 
  arrow 
  placement="right-start"
>
  <Badge>Server Busy</Badge>
</Tooltip>
```

### Controlled & Dismissible

```tsx
<Tooltip 
  content="Don't forget to save!" 
  open={true} 
  dismissible 
  maxWidth="200px"
>
  <input type="text" />
</Tooltip>
```

## API Reference

### Tooltip Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `content` | `ReactNode` | **Required** | Text or JSX to show. |
| `placement` | `Placement` | `'top'` | Direction of the popup. |
| `variant` | `'dark'\|'light'\|...` | `'dark'` | Color style preset. |
| `delay` | `number` | `200` | Delay before showing (ms). |
| `hideDelay` | `number` | `0` | Delay before hiding (ms). |
| `arrow` | `boolean` | `false` | Shows triangle indicator. |
| `disabled` | `boolean` | `false` | Prevents showing. |
| `open` | `boolean` | - | Programmatic visibility. |
| `maxWidth` | `string` | `'300px'` | Maximum balloon width. |
| `dismissible` | `boolean` | `false` | Adds an "X" button inside. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-tooltip` | Main balloon element. |
| `.lxs-tooltip-inner` | Content padding container. |
| `.lxs-tooltip-arrow` | The directional triangle. |
| `.lxs-tooltip-content`| The text wrapper. |
| `.lxs-tooltip-close` | The manual close button. |
| `.lxs-tooltip--visible`| Applied during the fade-in animation. |
