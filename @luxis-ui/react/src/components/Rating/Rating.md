# Rating

The `Rating` component is a versatile star-based scoring system. It supports pure display of numeric values and interactive user input with half-star precision.

## Features

- **Precision Support**: Optional `allowHalf` prop enables 0.5 increment selection and display.
- **Interactive Mode**: Toggle `selectable` to convert static stars into a functional user input.
- **Dynamic Sizing**: Available in `sm`, `md`, `lg`, and `xl` sizes.
- **Custom Icons**: Replace standard stars with your own `filledIcon`, `halfIcon`, or `emptyIcon`.
- **Value Label**: integrated `showValue` with customizable `valueFormat` for displaying scores (e.g., "4.5 / 5.0").
- **Theme Colors**: Standard palette mapping for star colors (e.g., `warning` yellow, `primary` blue).
- **Accessible & Keyboard Ready**: Built on top of a hidden native `<input type="range">`, ensuring full keyboard and screen reader compatibility.

## Installation

```bash
import { Rating } from '@luxis-ui/react';
```

## Usage

### Read-Only Display

```tsx
import { Rating } from '@luxis-ui/react';

const App = () => (
  <Rating 
    value={4.5} 
    allowHalf 
    showValue 
    color="warning" 
  />
);
```

### Interactive Input

```tsx
const [val, setVal] = useState(3);

<Rating 
  value={val} 
  selectable 
  onChange={(newVal) => setVal(newVal)}
  size="lg"
/>
```

### Custom Icons

```tsx
<Rating 
  value={5} 
  filledIcon={<HeartFullIcon />} 
  emptyIcon={<HeartEmptyIcon />} 
  color="error"
/>
```

## API Reference

### Rating Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `0` | Current score / filled percentage. |
| `max` | `number` | `5` | Total number of icons. |
| `size` | `'sm'\|'md'\|'lg'\|'xl'`| `'md'` | Scale of the icons. |
| `color` | `string` | `'warning'` | The fill color of icons. |
| `selectable` | `boolean` | `false` | Enables click/hover interaction. |
| `allowHalf` | `boolean` | `false` | Support for 0.5 increments. |
| `showValue` | `boolean` | `false` | Display score text next to stars. |
| `onChange` | `(val) => void` | - | Callback when user picks a score. |
| `readOnly` | `boolean` | `false` | Locks interaction if selectable. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-rating` | Root container. |
| `.lxs-rating-stars` | Wrapper for icon list. |
| `.lxs-rating-star-wrapper`| Individual star interactive area. |
| `.lxs-rating-star` | The actual icon element. |
| `.lxs-rating-value` | Numeric text display element. |
| `.lxs-rating-input` | The hidden range input for a11y. |
