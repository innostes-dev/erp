# Card

The `Card` component is a flexible container used for grouping related content and actions. It supports various visual variants, headers, footers, and interactive states.

## Features

- **Styling Variants**: `elevated` (subtle shadow), `outlined` (border only), and `filled` (background tint).
- **Structural Slots**: Dedicated `header` and `footer` sections.
- **Dividers**: Optional separators between header, body, and footer sections.
- **Interaction**: Integrated `hoverable` and `clickable` states with visual feedback.
- **Padding Control**: Easily toggle padding using `noPadding` or set a specific `padding` value.
- **Responsive**: Scales based on the `size` prop (`sm`, `md`, `lg`).

## Installation

```bash
import { Card } from '@luxis-ui/react';
```

## Usage

### Basic Usage

```tsx
import { Card } from '@luxis-ui/react';

const App = () => (
  <Card>
    <h3>Project Title</h3>
    <p>Detailed description of the project goes here.</p>
  </Card>
);
```

### Full-Featured Card

```tsx
<Card
  header={<strong>User Profile</strong>}
  footer={<Button size="sm">Edit Profile</Button>}
  variant="outlined"
  divider
>
  <div style={{ display: 'flex', gap: '16px' }}>
    <Avatar src="/user.jpg" />
    <p>John Doe - Product Designer</p>
  </div>
</Card>
```

### Interactive & Custom Padding

```tsx
<Card 
  hoverable 
  clickable 
  noPadding 
  onClick={() => console.log('Card clicked')}
>
  <img src="/banner.jpg" alt="Banner" style={{ width: '100%' }} />
  <div style={{ padding: '16px' }}>
    <h4>Clickable Card</h4>
    <p>This card has no padding, allowing the image to bleed to edges.</p>
  </div>
</Card>
```

## API Reference

### Card Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `children` | `ReactNode` | **Required** | Main body content of the card. |
| `header` | `ReactNode` | - | Content shown at the top. |
| `footer` | `ReactNode` | - | Content shown at the bottom. |
| `variant` | `'elevated'\|'outlined'\|'filled'` | `'elevated'` | Visual mode (shadow, border, or background). |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of internal spacing and font. |
| `noPadding` | `boolean` | `false` | Sets internal padding to 0. |
| `padding` | `string` | - | Custom CSS padding value (e.g. `'20px'`). |
| `divider` | `boolean` | `false` | Show borders between sections. |
| `hoverable` | `boolean` | `false` | Apply lift effect on hover. |
| `clickable` | `boolean` | `false` | Adds pointer cursor and focus states. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-card` | Main card container. |
| `.lxs-card--[variant]` | Variant style modifier. |
| `.lxs-card--hoverable` | Applied when `hoverable` is true. |
| `.lxs-card--no-padding` | Removes padding from the card body. |
| `.lxs-card-header` | Wrapper for the header slot. |
| `.lxs-card-content` | Wrapper for the main children. |
| `.lxs-card-footer` | Wrapper for the footer slot. |
| `.lxs-card-header--divider`| Bottom border for header. |
| `.lxs-card-footer--divider`| Top border for footer. |
