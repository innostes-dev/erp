# 04 - Core Shell (Frontend UI)

The Shell is built with **Next.js 15 (App Router)** (`apps/os-shell`). It acts as the "Window Manager" and global navigation state holder.

## Dynamic Routing Engine
The Shell uses Next.js dynamic routing (`app/(suite)/[appId]`) to handle an infinite number of potential modules without requiring explicit route definitions for each.

### 1. The Registry Fetch
When the user accesses the workspace, the Shell calls `fetchRegistryModules()`. This queries the Kernel and returns an array of `RegistryModule` objects containing the `id`, `name`, and `sidebarGroups` for every installed app.

### 2. The App Launcher
The `AppLauncher` component loops over the registered modules to render the grid of clickable app icons in the top navigation bar.

### 3. The Module Layout
When a user navigates to `/hr`, Next.js matches the dynamic `[appId]` route.
The `ModuleLayout` component intercepts this:
```tsx
const modules = await fetchRegistryModules();
const active = modules.find((m) => m.id === params.appId);
```
It extracts the `sidebarGroups` from the active module's manifest and renders the left-hand navigation sidebar dynamically.

## Global Design System
The Shell wraps the entire application in a `@luxis-ui/react` `ThemeProvider`. 

We enforce a single, unified color schema across the entire OS. Modules do not bring their own CSS variables or themes; instead, they consume the global CSS (`globals.css`) and tokens (`libs/core/design-system/src/tokens.ts`) provided by the Shell. This ensures that a user switching from HR to Inventory experiences a seamless, cohesive interface.
