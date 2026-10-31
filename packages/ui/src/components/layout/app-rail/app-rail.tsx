'use client';

import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { useRender } from '@base-ui/react/use-render';
import { mergeProps } from '@base-ui/react/merge-props';
import { cn } from '../../../lib/cn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../overlays/tooltip/tooltip';

export interface AppRailProps extends ComponentProps<'nav'> {
  /** Accessible name. @default 'Apps' */
  label?: string;
}

/**
 * A narrow vertical strip of icon links, usually for switching between modules or top-level
 * areas, placed before a `Sidebar` that holds the current module's pages (two-level navigation).
 *
 * Width is `--app-rail-width` (default 4.5rem); colours use the sidebar tokens. Hidden below `md`,
 * where the `Sidebar` becomes a slide-in panel. Put the same links in it for mobile.
 *
 * @example
 * <SidebarProvider>
 *   <AppRail>
 *     <AppRailItem icon={<HomeIcon />} label="Home" isActive render={<Link href="/" />} />
 *     <AppRailItem icon={<UsersIcon />} label="People" render={<Link href="/people" />} />
 *     <AppRailFooter>…</AppRailFooter>
 *   </AppRail>
 *   <Sidebar>…</Sidebar>
 *   <SidebarInset>…</SidebarInset>
 * </SidebarProvider>
 */
export const AppRail = forwardRef<HTMLElement, AppRailProps>(function AppRail(
  { className, label = 'Apps', children, ...props },
  ref,
) {
  return (
    <nav
      ref={ref}
      aria-label={label}
      data-slot="app-rail"
      className={cn(
        'sticky top-0 hidden h-svh w-(--app-rail-width,4.5rem) shrink-0 flex-col items-center gap-1.5 overflow-y-auto border-e border-sidebar-border bg-sidebar py-3 text-sidebar-foreground md:flex',
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  );
});

/** Top slot of the rail, e.g. the product logo. */
export const AppRailHeader = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function AppRailHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="app-rail-header"
        className={cn('mb-2 flex flex-col items-center gap-2', className)}
        {...props}
      />
    );
  },
);

/** Bottom slot of the rail, pushed to the end. */
export const AppRailFooter = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function AppRailFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="app-rail-footer"
        className={cn('mt-auto flex flex-col items-center gap-1.5', className)}
        {...props}
      />
    );
  },
);

export interface AppRailItemProps extends Omit<
  useRender.ComponentProps<'button'>,
  'children'
> {
  /** The icon. */
  icon: ReactNode;
  /** Name of the destination. Used as the tooltip and the accessible name. */
  label: string;
  /** Highlights the item and sets `aria-current="page"`. */
  isActive?: boolean;
  /** A count shown on the icon, e.g. unread items. */
  badge?: number;
  /**
   * Show the label under the icon instead of only in a tooltip.
   * @default false
   */
  showLabel?: boolean;
}

/**
 * One destination in an `AppRail`. Renders a `<button>`; pass `render={<Link href="…" />}`
 * for navigation.
 */
export const AppRailItem = forwardRef<HTMLElement, AppRailItemProps>(
  function AppRailItem(
    {
      className,
      icon,
      label,
      isActive = false,
      badge,
      showLabel = false,
      render,
      ...props
    },
    ref,
  ) {
    const element = useRender({
      defaultTagName: 'button',
      ref,
      render,
      props: mergeProps<'button'>(
        {
          className: cn(
            'relative flex shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-sidebar-muted-foreground transition-colors outline-none',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring',
            "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
            showLabel
              ? 'w-[calc(var(--app-rail-width,4.5rem)-0.75rem)] py-2'
              : 'size-11',
            isActive &&
              'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground',
            className,
          ),
          'aria-label': showLabel
            ? undefined
            : badge !== undefined && badge > 0
              ? `${badge > 99 ? '99+' : badge} ${label}`
              : label,
          'aria-current': isActive ? 'page' : undefined,
          'data-active': isActive ? '' : undefined,
          'data-slot': 'app-rail-item',
          children: (
            <>
              <span aria-hidden="true" className="contents">
                {icon}
              </span>
              {showLabel && (
                <span className="max-w-full truncate px-1 text-[0.6875rem] leading-tight font-medium">
                  {label}
                </span>
              )}
              {badge !== undefined && badge > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-semibold text-destructive-foreground tabular-nums ring-2 ring-sidebar"
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </>
          ),
        } as ComponentProps<'button'>,
        props,
      ),
    });

    if (showLabel) return element;
    return (
      <Tooltip>
        <TooltipTrigger render={element} />
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  },
);

/** A divider between groups of rail items. */
export const AppRailSeparator = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'>
>(function AppRailSeparator({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="separator"
      data-slot="app-rail-separator"
      className={cn('my-1.5 h-px w-8 shrink-0 bg-sidebar-border', className)}
      {...props}
    />
  );
});
