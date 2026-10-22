# @innostes/ui

Accessible React components for admin interfaces, built on [Base UI](https://base-ui.com) and
styled with [Tailwind CSS](https://tailwindcss.com) design tokens.

- **45+ components** for real admin work: data table, forms with validation, dialogs, sheets, menus,
  toasts, an app-shell sidebar, and more.
- **Accessible**: keyboard support, focus management and ARIA from Base UI; roles and keyboard
  behaviour covered by tests.
- **Your theme**: semantic tokens with Tailwind defaults. Override one CSS variable and every
  component follows. Dark theme included.
- **With or without Tailwind**: Tailwind apps share their theme; others import one stylesheet.
- **Typed and documented**: every prop has TSDoc; editors show descriptions and defaults on hover.
- **RSC-ready**: interactive components ship with `"use client"`; helpers stay server-safe.
- **Tree-shakable ESM**: one file per module; you ship only what you import.

## Install

```sh
pnpm add @innostes/ui
```

Peer dependencies: `react` and `react-dom` **17, 18 or 19**, and optionally `tailwindcss@^4`.
Every React version is covered by the test suite.

## Set up

**With Tailwind CSS v4** (components use your theme):

```css
/* app/globals.css */
@import 'tailwindcss';
@import '@innostes/ui/tailwind.css';
@import '@innostes/ui/dark.css'; /* optional */
```

**Without Tailwind:**

```ts
import '@innostes/ui/styles.css';
import '@innostes/ui/dark.css'; // optional
```

Mount the providers once:

```tsx
import { Toaster, TooltipProvider } from '@innostes/ui';

<TooltipProvider>{children}</TooltipProvider>
<Toaster />
```

## Use

```tsx
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  toast,
} from '@innostes/ui';

export function Example() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Edit</DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit order</DialogTitle>
        <Button onClick={() => toast.success('Saved')}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}
```

## Components

| Category     | Components                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Actions      | Button, ButtonGroup, Toggle, ToggleGroup                                                                                          |
| Forms        | Field, Form, Fieldset, Label, Input, Textarea, Checkbox, CheckboxGroup, RadioGroup, Switch, Select, Combobox, NumberField, Slider |
| Data display | DataTable, Table, Card, Stat, Badge, Avatar, EmptyState, Kbd                                                                      |
| Feedback     | Alert, toast + Toaster, Progress, Meter, Skeleton, Spinner                                                                        |
| Overlays     | Dialog, AlertDialog, Sheet, Popover, Tooltip, DropdownMenu, ContextMenu                                                           |
| Navigation   | Tabs, Breadcrumb, Pagination, Accordion, Collapsible                                                                              |
| Layout       | Sidebar, PageHeader, Separator, ScrollArea                                                                                        |

## Package contents

| Import                      | What                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `@innostes/ui`              | Components, hooks and helpers (`cn`, `buttonVariants`, `getPaginationRange`, …) |
| `@innostes/ui/tailwind.css` | Tokens + source registration for Tailwind v4 apps                               |
| `@innostes/ui/theme.css`    | Tokens only                                                                     |
| `@innostes/ui/dark.css`     | Opt-in dark theme (`.dark` or `[data-theme=dark]`)                              |
| `@innostes/ui/styles.css`   | Precompiled CSS for apps without Tailwind                                       |
| `@innostes/ui/api.json`     | Machine-readable props of every component, generated from TSDoc                 |

## Versioning

Semantic versioning. Breaking changes ship only in major versions, with migration notes in the
changelog.

## License

MIT
