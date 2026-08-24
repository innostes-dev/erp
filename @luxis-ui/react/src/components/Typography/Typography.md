# Typography

The `Typography` component is the core utility for all text in the Luxis design system. it provides consistent scaling, weighting, and coloring while maintaining semantic HTML structure.

## Features

- **Standard Variants**: predefined styles for `h1`-`h6`, `body1`-`body2`, `subtitle`, `caption`, `overline`, and `button`.
- **Dynamic Semantics**: Use the `as` prop to change the underlying tag (e.g. render a `body1` variant as an `<h1>` for SEO).
- **Advanced Truncation**: Native support for single-line `truncate` or multi-line `lineClamp`.
- **Theme Colors**: Semantic coloring (`primary`, `muted`, `error`, etc.) integrated with dark mode.
- **Gradient Text**: Built-in support for linear-gradient text effects via the `gradient` array prop.
- **Direct Overrides**: Props for `textColor`, `weight`, `size`, and `lineHeight` for ad-hoc styling.
- **Micro-utilities**: Toggle `italic`, `underline`, `strikethrough`, `breakWord`, or `noSelect`.
- **Clean Layout**: Rapidly remove margins or padding with `noMargin`/`noPadding` flags.

## Installation

```bash
import { Typography } from '@luxis-ui/react';
```

## Usage

### Headings and Body

```tsx
import { Typography } from '@luxis-ui/react';

const App = () => (
  <>
    <Typography variant="h1">Display Heading</Typography>
    <Typography variant="body1" color="muted">
      This is a standard paragraph with secondary emphasis.
    </Typography>
  </>
);
```

### Multi-line Truncation (Clamping)

```tsx
<Typography variant="body2" lineClamp={3}>
  This very long description will be cut off after three lines
  with an ellipsis appended because the lineClamp prop is set.
</Typography>
```

### Gradient Text

```tsx
<Typography 
  variant="h2" 
  weight="bold" 
  gradient={['#667eea', '#764ba2']}
>
  Premium Gradient Header
</Typography>
```

## API Reference

### Typography Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `TypographyVariant` | `'body1'` | Style preset to apply. |
| `as` | `TypographyAs` | *Inferred* | HTML element (p, h1, span, etc). |
| `color` | `SemanticColor` | `'inherit'` | Brand or status text color. |
| `textColor` | `string` | - | Raw CSS color override. |
| `weight` | `string \| number` | - | Weight (bold, 500, etc). |
| `truncate` | `boolean` | `false` | Enable single-line ellipsis. |
| `lineClamp` | `number` | - | Max lines before truncating. |
| `gradient` | `string[]` | - | Array of hex/rgb strings for gradient. |
| `align` | `'left'\|'center'\|...`| - | Text alignment. |
| `noMargin` | `boolean` | `false` | Sets margin: 0. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-typography` | Base text class. |
| `.lxs-typography--[variant]`| Sizing/weight preset mod. |
| `.lxs-typography--truncate` | Ellipsis clip rules. |
| `.lxs-typography--line-clamp`| Multi-line clamping rules. |
| `.lxs-typography--gradient` | Background-clip text rules. |
| `.lxs-typography--no-margin`| Margin removal utility. |
