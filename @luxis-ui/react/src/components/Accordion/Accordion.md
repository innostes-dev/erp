# Accordion

The `Accordion` component allows users to toggle between hiding and showing large amounts of content in a compact space.

## Features

- **Multiple Variants**: Choose from `default`, `bordered`, `separated`, and `flush`.
- **Flexible Data Entry**: Pass items via the `items` prop or as `AccordionItem` children.
- **Selection Modes**: Toggle single item visibility or allow multiple items to be open simultaneously.
- **Custom Icons**: Supported built-in `chevron` and `plus-minus` icons, or provide custom expanded/collapsed icons.
- **Loading States**: Integrated skeleton loaders for data fetching states.
- **Accessible**: Built with semantic HTML and appropriate ARIA roles for accessibility.
- **Customizable Spacing**: Choose from `compact`, `default`, or `spacious` density.

## Installation

```bash
import { Accordion, AccordionItem } from '@luxis-ui/react';
```

## Usage

### Basic Usage (Items Prop)

Pass an array of objects to the `items` prop for a declarative approach.

```tsx
import { Accordion } from '@luxis-ui/react';

const items = [
  { id: '1', header: 'Getting Started', children: 'To get started, install the package...' },
  { id: '2', header: 'Architecture', children: 'The system uses a modular architecture...' },
];

const App = () => <Accordion items={items} />;
```

### Usage with Children

For more control over individual items, use the `AccordionItem` component as children.

```tsx
import { Accordion, AccordionItem } from '@luxis-ui/react';

const App = () => (
  <Accordion variant="bordered" allowMultiple>
    <AccordionItem id="1" header="Section 1">
      Rich content can go here, like <button>Buttons</button> or images.
    </AccordionItem>
    <AccordionItem id="2" header="Section 2">
      Second section content.
    </AccordionItem>
  </Accordion>
);
```

### Variants

```tsx
<Accordion variant="default" />    {/* Clean, minimal look */}
<Accordion variant="bordered" />   {/* Boxed items with borders */}
<Accordion variant="separated" />  {/* Card-like items with spacing */}
<Accordion variant="flush" />      {/* Removes outer borders and padding */}
```

### Icons and Chevron Position

```tsx
<Accordion 
  iconType="plus-minus" 
  chevronPosition="left" 
  showDivider={false}
>
  ...
</Accordion>
```

## API Reference

### Accordion Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `AccordionItemProps[]` | - | Array of items to render. |
| `children` | `ReactNode` | - | Manual `AccordionItem` elements. |
| `allowMultiple` | `boolean` | `false` | Allows multiple sections to be open at once. |
| `defaultOpenItems`| `string[]` | `[]` | IDs of items open by default (uncontrolled). |
| `openItems` | `string[]` | - | IDs of currently open items (controlled). |
| `onToggle` | `(ids: string[]) => void` | - | Callback when items are toggled. |
| `variant` | `'default'\|'bordered'\|'separated'\|'flush'` | `'default'` | Visual style of the accordion. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Padding and font size scale. |
| `showChevron` | `boolean` | `true` | Whether to show the toggle icon. |
| `chevronPosition`| `'left' \| 'right'` | `'right'` | Position of the icon. |
| `iconType` | `'chevron'\|'plus-minus'\|'custom'` | `'chevron'` | Built-in icon presets. |
| `expandedIcon` | `ReactNode` | - | Custom icon for open state. |
| `collapsedIcon` | `ReactNode` | - | Custom icon for closed state. |
| `showDivider` | `boolean` | `true` | Shows separators between items. |
| `collapsible` | `boolean` | `true` | If false, one item must always be open. |
| `loading` | `boolean` | `false` | Displays skeletons instead of content. |
| `disabled` | `boolean` | `false` | Disables interaction for all items. |
| `spacing` | `'compact'\|'default'\|'spacious'` | `'default'` | Vertical density. |
| `disableAnimations`| `boolean` | `false` | Disables transition effects. |

### AccordionItem Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | Unique ID for the item. |
| `header` | `ReactNode` | **Required** | Content shown in the clickable header. |
| `children` | `ReactNode` | **Required** | Content shown when expanded. |
| `disabled` | `boolean` | `false` | Disables this specific item. |
| `status` | `'success'\|'warning'\|'error'\|'featured'` | - | Applies semantic colors to the item. |
| `loading` | `boolean` | `false` | Loading state for this specific item. |
| `icon` | `{ expanded?, collapsed? }` | - | Custom icons for this item only. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.accordion` | Main container class. |
| `.accordion--[variant]` | Variant modifier. |
| `.accordion-item` | Individual item wrapper. |
| `.accordion-item--open` | State class for open items. |
| `.accordion-item__header` | The clickable header element. |
| `.accordion-item__content`| The collapsible panel. |
