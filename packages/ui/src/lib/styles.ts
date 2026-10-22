/**
 * Class strings shared by several components. Internal: not exported from the package.
 * @internal
 */

/** Floating surface used by menus, selects, comboboxes and popovers. */
export const popupSurface =
  'rounded-md border border-border bg-popover text-popover-foreground shadow-lg outline-none ' +
  'origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-out ' +
  'data-starting-style:scale-95 data-starting-style:opacity-0 ' +
  'data-ending-style:scale-95 data-ending-style:opacity-0';

/** A selectable row inside a menu, select or combobox list. */
export const listItem =
  'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none ' +
  'data-highlighted:bg-accent data-highlighted:text-accent-foreground ' +
  'data-disabled:pointer-events-none data-disabled:opacity-50 ' +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

/** Small uppercase-ish heading for a group of list items. */
export const listGroupLabel =
  'px-2 py-1.5 text-xs font-medium text-muted-foreground';

/** Thin divider between groups of list items. */
export const listSeparator = '-mx-1 my-1 h-px bg-border';

/** Dimmed full-screen layer behind modal overlays. */
export const backdrop =
  'fixed inset-0 z-50 bg-overlay transition-opacity duration-200 ' +
  'data-starting-style:opacity-0 data-ending-style:opacity-0';
