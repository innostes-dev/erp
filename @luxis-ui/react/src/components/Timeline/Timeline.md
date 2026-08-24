# Timeline

The `Timeline` component is a visual representation of a sequential process or list of events. It supports both horizontal and vertical orientations with multiple visual styles for steps.

## Features

- **Directional Flexibility**: Display steps in either `horizontal` (default) or `vertical` layouts.
- **Multiple Variants**: Choose from `default` (dots), `circle` (outline), `numbered`, or `simple` (content-only).
- **Progress Tracking**: Automatic state management based on the `currentStep` index (Active, Completed, Pending).
- **Checkmarks**: Automatic checkmark rendering for completed steps via `showCheckmarks`.
- **Custom Icons**: Replace standard dots with your own `icon` nodes for each step.
- **Theme Colors**: Color scheme support for active/completed segments (`primary`, `success`, `warning`, etc.).
- **Clickable Steps**: Each step can have an optional `onClick` handler.
- **Size Options**: Available in `sm`, `md`, and `lg`.

## Installation

```bash
import { Timeline } from '@luxis-ui/react';
```

## Usage

### Simple Horizontal Progress

```tsx
import { Timeline } from '@luxis-ui/react';

const steps = ['Cart', 'Shipping', 'Payment', 'Confirmation'];

const App = () => (
  <Timeline 
    steps={steps} 
    currentStep={1} 
    color="primary" 
  />
);
```

### Detailed Vertical Timeline

```tsx
const steps = [
  { label: 'Order Placed', description: 'Oct 12, 10:30 AM' },
  { label: 'Processing', description: 'Oct 12, 11:00 AM' },
  { label: 'Shipped', description: 'Oct 13, 09:15 AM' },
];

<Timeline 
  steps={steps} 
  currentStep={1} 
  orientation="vertical" 
  variant="circle"
/>
```

### Numbered Steps

```tsx
<Timeline 
  variant="numbered" 
  steps={['Draft', 'Review', 'Published']} 
  currentStep={0} 
/>
```

## API Reference

### Timeline Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `steps` | `Step[] \| string[]` | **Required** | Data for each timeline point. |
| `currentStep` | `number` | **Required** | Index of the active step (0-based). |
| `orientation` | `'horizontal'\|'vertical'`| `'horizontal'`| Layout direction. |
| `variant` | `'default'\|'circle'\|'numbered'\|'simple'`| `'default'`| Step indicator style. |
| `color` | `string` | `'success'` | Active/Completed theme color. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of the indicators. |
| `showCheckmarks`| `boolean` | `true` | Show icons on completed steps. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.timeline` | Main container. |
| `.timeline-step` | Individual step wrapper. |
| `.timeline-connector` | The line between steps. |
| `.timeline-step-indicator`| The dot/circle wrapper. |
| `.timeline-step-content` | Text area for label/description. |
| `.timeline-connector--filled`| Styles for completed segments. |
