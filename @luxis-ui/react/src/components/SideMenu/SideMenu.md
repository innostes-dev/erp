# SideMenu

The `SideMenu` component is a professional navigation sidebar typical of admin dashboards and SaaS applications. It supports multi-level nesting, collapsed states, and integrated badges.

## Features

- **Collapsible**: Easily toggle between a full width menu and a compact icon-only view using the `collapsed` prop.
- **Nested Submenus**: Infinite nesting support with internal state management and smooth chevron animations.
- **Badges**: Add numeric or text indicators (e.g., "12" or "New") to specific menu items.
- **Header & Footer**: Dedicated slots for brand logos, user profiles, or collapse toggles.
- **Keyboard Navigation**: Full support for "Enter" and "Space" to expand menus or trigger actions.
- **Responsive Width**: Customizable `width` and `collapsedWidth` to fit any layout.
- **Active State**: Automatic highlighting for the currently selected route.

## Installation

```bash
import { SideMenu, SideMenuItem } from '@luxis-ui/react';
```

## Usage

### Basic Admin Sidebar

```tsx
import { SideMenu } from '@luxis-ui/react';

const menuItems = [
  { label: 'Dashboard', icon: <HomeIcon />, active: true },
  { 
    label: 'Ecommerce', 
    icon: <CartIcon />,
    items: [
      { label: 'Products', href: '/products' },
      { label: 'Orders', badge: 5, href: '/orders' },
    ]
  },
  { label: 'Settings', icon: <GearIcon />, href: '/settings' },
];

const App = () => (
  <SideMenu 
    items={menuItems} 
    header={<Logo />} 
    footer={<UserCard />}
  />
);
```

### Collapsed State

```tsx
<SideMenu 
  collapsed={true} 
  items={menuItems} 
  width={280}
  collapsedWidth={64}
/>
```

## API Reference

### SideMenu Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `MenuItem[]` | **Required** | Nested navigation configuration. |
| `collapsed` | `boolean` | `false` | Toggles compact mode. |
| `width` | `string \| number` | `'260px'` | Expanded sidebar width. |
| `header` | `ReactNode` | - | Brand/Logo area content. |
| `footer` | `ReactNode` | - | Bottom area content. |

### MenuItem Props

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | **Required** | Text label. |
| `icon` | `ReactNode` | - | Leading icon. |
| `active` | `boolean` | `false` | Highlighted state. |
| `badge` | `string \| number` | - | Small label on the right. |
| `items` | `MenuItem[]` | - | Nested submenu items. |
| `href` | `string` | - | If provided, item renders as an `<a>`. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-sidemenu` | Main `<aside>` container. |
| `.lxs-sidemenu-item` | The row element for an item. |
| `.lxs-sidemenu-item--active`| Active row styling. |
| `.lxs-sidemenu-submenu` | Container for nested children. |
| `.lxs-sidemenu-chevron` | Submenu arrow icon. |
| `.lxs-sidemenu-item-badge` | The numeric indicator pill. |
