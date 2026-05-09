# 03 - React Components & Theming

When building React components for your module, you must adhere to the global design system.

## 1. Using Luxis UI
We use `@luxis-ui/react` for standard components. Do not build custom buttons or inputs unless absolutely necessary.

```tsx
import { Button, Input } from '@luxis-ui/react';

export function CreateItemForm() {
  return (
    <form className="flex flex-col gap-4">
      <Input placeholder="SKU Number" />
      <Button variant="primary">Save Item</Button>
    </form>
  );
}
```

## 2. Global Styling (No Local Themes)
Innostes OS uses a strict global theme. You should not define local `--app-primary` variables.

- Use the global `.module-page`, `.page-header`, and `.page-content-card` classes (defined in `globals.css`) for standard layouts.
- Use Tailwind CSS classes for layout adjustments.

```tsx
export function InventoryDashboard() {
  return (
    <div className="module-page">
      <header className="page-header">
        <h1>Inventory Dashboard</h1>
        <p>Real-time stock overview</p>
      </header>
      
      <div className="page-content-card">
        {/* Your content here */}
      </div>
    </div>
  );
}
```
