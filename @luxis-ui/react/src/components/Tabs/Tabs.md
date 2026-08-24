# Tabs

The `Tabs` component allows users to organize and navigate between related content views within the same context. It supports multiple visual styles, horizontal/vertical orientations, and lazy loading.

## Features

- **Multiple Variants**: Choose between `line` (default), `enclosed`, `soft-rounded`, `solid-rounded`, and `segmented`.
- **Directional Flexibility**: Support for both `horizontal` and `vertical` layouts.
- **Scrollable Tabs**: Automatic scroll buttons for horizontal tabs when content overflows.
- **Lazy Loading**: Use `isLazy` to defer mounting of tab panels until they are first activated.
- **Controlled & Uncontrolled**: Support for `value` (controlled) and `defaultValue` (uncontrolled) states.
- **Accessible**: Full WAI-ARIA `tablist`, `tab`, and `tabpanel` role integration with proper `aria-selected` and `hidden` states.
- **Integrated Icons**: Built-in support for leading icons in tab labels.

## Installation

```bash
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@luxis-ui/react';
```

## Usage

### Basic Line Tabs

```tsx
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@luxis-ui/react';

const App = () => (
  <Tabs defaultValue="overview">
    <TabList>
      <Tab value="overview">Overview</Tab>
      <Tab value="settings">Settings</Tab>
      <Tab value="history" disabled>History</Tab>
    </TabList>

    <TabPanels>
      <TabPanel value="overview">General account statistics...</TabPanel>
      <TabPanel value="settings">Account configuration options...</TabPanel>
    </TabPanels>
  </Tabs>
);
```

### Segmented Variant with Icons

```tsx
<Tabs variant="segmented" size="sm">
  <TabList>
    <Tab value="grid" icon={<GridIcon />} />
    <Tab value="list" icon={<ListIcon />} />
  </TabList>
</Tabs>
```

### Lazy Vertical Tabs

```tsx
<Tabs orientation="vertical" isLazy>
  <TabList>
    <Tab value="tab1">Personal Info</Tab>
    <Tab value="tab2">Security</Tab>
  </TabList>
  <TabPanels>
    <TabPanel value="tab1">...</TabPanel>
    <TabPanel value="tab2">...</TabPanel>
  </TabPanels>
</Tabs>
```

## API Reference

### Tabs Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `defaultValue`| `string` | - | Initially active tab (uncontrolled). |
| `value` | `string` | - | Currently active tab (controlled). |
| `onChange` | `(val) => void` | - | Callback when tab changes. |
| `variant` | `TabsVariant` | `'line'` | Visual styling preset. |
| `orientation` | `'horizontal'\|'vertical'`| `'horizontal'`| Tab list direction. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scale of labels and panels. |
| `isLazy` | `boolean` | `false` | Mount panels only when selected. |

### TabList Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `showScrollControls`| `boolean`| `false` | Shows arrows on overflow (horiz). |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-tabs` | Root container. |
| `.lxs-tab-list` | The navigation row/column. |
| `.lxs-tab` | The individual clickable tab. |
| `.lxs-tab-panels` | Container for all panels. |
| `.lxs-tab-panel` | Individual content area. |
| `.lxs-tab-scroll-btn`| The left/right overflow arrows. |
