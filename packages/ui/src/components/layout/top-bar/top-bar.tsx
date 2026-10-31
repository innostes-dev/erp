import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';

export interface TopBarProps extends ComponentProps<'header'> {
  /**
   * Stick to the top while the page scrolls.
   * @default true
   */
  sticky?: boolean;
  /** Blur the content behind a translucent bar. @default false */
  blur?: boolean;
}

/**
 * The app's top bar: brand and app switcher on the start, search in the middle, and
 * notifications, help and the user menu at the end. Height is `--top-bar-height` (default 4rem).
 *
 * Lay it out with `TopBarStart`, `TopBarCenter` and `TopBarEnd`. The centre shrinks first, so the
 * bar never overflows; hide less important items on small screens with `max-md:hidden`.
 *
 * @example
 * <TopBar>
 *   <TopBarStart><SidebarTrigger /><AppSwitcher … /></TopBarStart>
 *   <TopBarCenter><SearchInput … /></TopBarCenter>
 *   <TopBarEnd><NotificationBell … /><UserMenu … /></TopBarEnd>
 * </TopBar>
 */
export const TopBar = forwardRef<HTMLElement, TopBarProps>(function TopBar(
  { className, sticky = true, blur = false, ...props },
  ref,
) {
  return (
    <header
      ref={ref}
      data-slot="top-bar"
      className={cn(
        'z-30 flex h-(--top-bar-height,4rem) shrink-0 items-center gap-2 border-b border-sidebar-border bg-background px-3 sm:gap-4 sm:px-4',
        sticky && 'sticky top-0',
        blur &&
          'bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70',
        className,
      )}
      {...props}
    />
  );
});

/** Start of the top bar: menu toggle, logo, app switcher. */
export const TopBarStart = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function TopBarStart({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="top-bar-start"
        className={cn('flex min-w-0 shrink-0 items-center gap-2', className)}
        {...props}
      />
    );
  },
);

/** Middle of the top bar, usually search. Takes the remaining space and shrinks first. */
export const TopBarCenter = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function TopBarCenter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="top-bar-center"
        className={cn(
          'flex min-w-0 flex-1 items-center justify-center [&>*]:w-full [&>*]:max-w-xl',
          className,
        )}
        {...props}
      />
    );
  },
);

/** End of the top bar: notifications, help, settings, user menu. */
export const TopBarEnd = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function TopBarEnd({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="top-bar-end"
        className={cn(
          'ms-auto flex shrink-0 items-center gap-1 sm:gap-2',
          className,
        )}
        {...props}
      />
    );
  },
);
