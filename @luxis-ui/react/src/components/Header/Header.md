# Header

The `Header` component is a professional top navigation bar designed for admin panels and dashboard applications. It integrates branding, page titles, global search, notifications, and user account management.

## Features

- **Sticky Layout**: Built-in `sticky` support ensures the header remains visible during scrolling.
- **Sidebar Integration**: Integrated `onToggleSidebar` callback for controlling dashboard navigation.
- **Notification System**: Built-in dropdown panel for `NotificationItem` lists with unread counting and "Mark all as read" support.
- **User Account Menu**: Displays user avatar, name, and subtitle with a customizable dropdown `Menu`.
- **Action Slots**: Flexible `actions` prop for adding buttons, search bars, or custom widgets.
- **Responsive**: Mobile-friendly layout with adaptive toggle and content scaling.
- **Accessibility**: ARIA labels for buttons and semantic `<header>` wrapper.

## Installation

```bash
import { Header } from '@luxis-ui/react';
```

## Usage

### Basic Dashboard Header

```tsx
import { Header } from '@luxis-ui/react';

const App = () => (
  <Header
    title="Overview"
    userName="Jane Smith"
    userSubtitle="Platform Manager"
    onToggleSidebar={() => setSidebarOpen(!open)}
  />
);
```

### Full-Featured Header

```tsx
<Header
  title="Project Management"
  actions={<SearchBar />}
  notifications={[
    { id: '1', title: 'Task Assigned', time: '5m ago', read: false },
    { id: '2', title: 'Build Success', time: '1h ago', read: true, type: 'success' },
  ]}
  userAvatar="/avatars/jane.png"
  userMenuItems={[
    { label: 'Profile', onClick: () => navigate('/profile') },
    { label: 'Settings', onClick: () => navigate('/settings') },
    { label: 'Logout', variant: 'danger', divider: true }
  ]}
/>
```

## API Reference

### Header Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | - | Primary page or section title. |
| `logo` | `ReactNode` | - | Brand icon/element. |
| `userName` | `string` | - | Display name for the logged-in user. |
| `userAvatar` | `string` | - | URL for the user's profile picture. |
| `userSubtitle` | `string` | - | Role or secondary text below the user name. |
| `userMenuItems` | `MenuItem[]` | `[]` | Object list for the user dropdown. |
| `notifications` | `NotificationItem[]`| `[]` | List of items for the bell dropdown. |
| `actions` | `ReactNode` | - | Custom elements (buttons, inputs) in center-right. |
| `sticky` | `boolean` | `true` | Fixes header to the top of the viewport. |
| `onToggleSidebar`| `() => void` | - | Fired when the menu/hamburger is clicked. |

### NotificationItem Object

| Key | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique ID. |
| `title` | `string` | Notification headline. |
| `description` | `string` | Optional detailed text. |
| `time` | `string` | Timestamp string (e.g. "5m ago"). |
| `read` | `boolean` | If false, unread dot is shown. |
| `type` | `string` | `info`, `success`, `warning`, `error`. |

## CSS Classes

| Selector | Description |
| :--- | :--- |
| `.lxs-header` | Root header element. |
| `.lxs-header--sticky` | Applied when sticky is active. |
| `.lxs-header-title` | Style for the title typography. |
| `.lxs-header-notifications` | The bell icon button container. |
| `.lxs-header-notifications-panel`| The dropdown notification list. |
| `.lxs-header-user-menu` | The user dropdown component container. |
| `.lxs-header-actions` | Container for custom actions. |
