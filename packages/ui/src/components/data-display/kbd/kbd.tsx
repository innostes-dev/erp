import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';

/**
 * A keyboard key or shortcut, e.g. in tooltips and menus.
 *
 * @example
 * Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search.
 */
export const Kbd = forwardRef<HTMLElement, ComponentProps<'kbd'>>(function Kbd(
  { className, ...props },
  ref,
) {
  return (
    <kbd
      ref={ref}
      data-slot="kbd"
      className={cn(
        'pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-1 rounded-sm border border-border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground select-none',
        className,
      )}
      {...props}
    />
  );
});
