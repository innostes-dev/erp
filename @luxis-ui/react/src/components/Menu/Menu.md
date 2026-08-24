# Menu

The `Menu` component provides a flexible list of choices on temporary surfaces. It supports single-level and multi-level (nested) items, keyboard shortcuts, and responsive mobile adaptations.

## Features

- **Nested Menus**: Infinite levels of submenus with automatic chevron indicators.
- **Orientation**: Supports both `vertical` (dropdowns/sidebars) and `horizontal` (navbars) layouts.
- **Responsive**: Built-in "hamburger" toggle for mobile viewports.
- **Rich Items**: Add `icons`, `rightIcons`, and `shortcuts` (e.g., Ctrl+S) to each item.
- **Keyboard Navigation**: Full support for Arrow keys, Enter, and Escape.
- **Semantic Variants**: supports `default` and `danger` (red) item styles.
- **Controlled Opening**: Items manage their own submenu states.

## Installation

```bash
import { Menu, MenuItem } from '@luxis-ui/react';
```

## Usage

### Simple Action Menu

```tsx
import { ActionMenu, Button } from '@luxis-ui/react';
import { MoreVerticalIcon } from '@luxis-ui/react/icons';

const items = [
  { label: 'Profile', onClick: () => {}, icon: <UserIcon /> },
  { label: 'Settings', onClick: () => {}, icon: <SettingsIcon /> },
  { label: 'Logout', variant: 'danger', divider: true, icon: <LogoutIcon /> },
];

const App = () => (
  <ActionMenu
    trigger={({ toggle, disabled }) => (
      <Button variant="ghost" size="sm" iconOnly onClick={toggle} disabled={disabled}>
        <MoreVerticalIcon />
      </Button>
    )}
    items={items}
  />
);
```

### Multi-level Nested Menu

```tsx
const nestedItems = [
  {
    label: 'Export',
    items: [
      { label: 'As PDF', onClick: () => {} },
      { label: 'As CSV', onClick: () => {} },
    ]
  },
  { label: 'Print', shortcut: '⌘P' }
];

<Menu items={nestedItems} />;
```

### Horizontal Navbar

```tsx
<Menu orientation="horizontal" responsive={false}>
  <MenuItem label="Features" active />
  <MenuItem label="Pricing" />
  <MenuItem label="Documentation" />
</Menu>
```

## API Reference

### Menu Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `MenuItemProps[]`| - | Recursive array of menu items. |
| `children` | `ReactNode` | - | Manual `MenuItem` components. |
| `orientation` | `'vertical' \| 'horizontal'`| `'vertical'`| Layout direction. |
| `responsive` | `boolean` | `true` | Show hamburger on mobile. |
| `width` | `string \| number` | - | Fixed width (mostly for vertical). |

### MenuItem Props

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | Text content. |
| `onClick` | `() => void` | - | Click handler (ignored if has sub-items). |
| `items` | `MenuItemProps[]`| - | Child items for a submenu. |
| `icon` | `ReactNode` | - | Icon on the left. |
| `rightIcon` | `ReactNode` | - | Icon on the far right. |
| `shortcut` | `string` | - | Keyboard shortcut text on the right. |
| `active` | `boolean` | `false` | Highlighted state. |
| `divider` | `boolean` | `false` | Adds a line below the item. |
| `variant` | `'default'\|'danger'` | `'default'` | Visual style preset. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-menu` | Root list container. |
| `.lxs-menu-item` | The individual clickable row. |
| `.lxs-menu-item--active`| Modifier for active state. |
| `.lxs-submenu` | Container for nested items. |
| `.lxs-menu-toggle` | The mobile hamburger button. |
| `.lxs-menu-divider` | separator line element. |
