# Flex

The `Flex` component is a layout primitive that provides a convenient wrapper around CSS Flexbox properties. It simplifies creating responsive rows and columns without writing custom CSS.

## Features

- **Polymorphic**: Use the `as` prop to render as any industrial context (e.g., `nav`, `section`, `header`).
- **Shorthand Props**: Intuitive aliases for standard flex properties like `justify` (`justify-content`) and `align` (`align-items`).
- **Gap Support**: Direct `gap`, `rowGap`, and `columnGap` props with automatic `px` conversion for numbers.
- **Directional**: Easily switch between `row` and `column` layouts.
- **Stateful Utilities**: Props for `fullWidth` and `inline` flex behavior.
- **Compositional**: Built on top of the `Box` component, inheriting its core performance and styling capabilities.

## Installation

```bash
import { Flex } from '@luxis-ui/react';
```

## Usage

### Basic Row

```tsx
import { Flex } from '@luxis-ui/react';

const App = () => (
  <Flex gap={16} align="center">
    <div>Logo</div>
    <div>Navigation</div>
    <div style={{ marginLeft: 'auto' }}>Actions</div>
  </Flex>
);
```

### Centered Column

```tsx
<Flex direction="column" justify="center" align="center" gap={8} style={{ height: '200px' }}>
  <h2>Centered Title</h2>
  <p>Centered description text goes here.</p>
</Flex>
```

### Wrapping Items

```tsx
<Flex wrap="wrap" gap={12}>
  {tags.map(tag => <Chip key={tag} label={tag} />)}
</Flex>
```

## API Reference

### Flex Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `direction` | `'row'\|'column'\|'row-reverse'\|'column-reverse'` | `'row'` | The `flex-direction` property. |
| `justify` | `'start'\|'end'\|'center'\|'between'\|'around'\|'evenly'` | `'start'` | The `justify-content` property. |
| `align` | `'start'\|'end'\|'center'\|'baseline'\|'stretch'` | `'stretch'`| The `align-items` property. |
| `wrap` | `'nowrap'\|'wrap'\|'wrap-reverse'` | `'nowrap'`| The `flex-wrap` property. |
| `gap` | `number \| string` | - | Spacing between items. |
| `inline` | `boolean` | `false` | Renders as `inline-flex`. |
| `fullWidth` | `boolean` | `false` | Sets width to 100%. |
| `grow` | `number` | - | The `flex-grow` value for the container. |
| `shrink` | `number` | - | The `flex-shrink` value for the container. |
| `basis` | `string \| number` | - | The `flex-basis` value for the container. |
| `as` | `ElementType` | `'div'` | The HTML tag to render. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-flex` | The core flex container class. |
