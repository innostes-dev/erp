'use client';

import { createContext, useContext, forwardRef } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';

type TabsVariant = 'underline' | 'pills';
const TabsVariantContext = createContext<TabsVariant>('underline');

export interface TabsProps extends BaseTabs.Root.Props {
  /**
   * `underline` for page sections; `pills` for compact switches inside cards and toolbars.
   * @default 'underline'
   */
  variant?: TabsVariant;
}

/**
 * Switches between related panels in the same place. Arrow keys move between tabs.
 *
 * @example
 * <Tabs defaultValue="overview">
 *   <TabsList>
 *     <TabsTab value="overview">Overview</TabsTab>
 *     <TabsTab value="activity">Activity</TabsTab>
 *   </TabsList>
 *   <TabsPanel value="overview">…</TabsPanel>
 *   <TabsPanel value="activity">…</TabsPanel>
 * </Tabs>
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { className, variant = 'underline', ...props },
  ref,
) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <BaseTabs.Root
        ref={ref}
        data-slot="tabs"
        data-variant={variant}
        className={mergeClassName(
          'flex flex-col gap-4 data-[orientation=vertical]:flex-row',
          className,
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
});

/** The row of tabs, with an animated indicator under (or behind) the active tab. */
export const TabsList = forwardRef<HTMLDivElement, BaseTabs.List.Props>(
  function TabsList({ className, children, ...props }, ref) {
    const variant = useContext(TabsVariantContext);
    return (
      <BaseTabs.List
        ref={ref}
        data-slot="tabs-list"
        className={mergeClassName(
          cn(
            'relative z-0 flex max-w-full shrink-0 items-center',
          // Scroll sideways instead of overflowing when tabs don't fit (no visible scrollbar).
          'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden data-[orientation=vertical]:overflow-visible',
            variant === 'underline'
              ? 'gap-1 border-b border-border data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:border-e data-[orientation=vertical]:border-b-0'
              : 'w-fit gap-1 rounded-lg bg-muted p-1',
          ),
          className,
        )}
        {...props}
      >
        {children}
        <BaseTabs.Indicator
          data-slot="tabs-indicator"
          className={cn(
            'absolute transition-all duration-200 ease-out',
            variant === 'underline'
              ? 'bottom-0 left-(--active-tab-left) h-0.5 w-(--active-tab-width) translate-y-px bg-primary'
              : 'top-(--active-tab-top) left-(--active-tab-left) -z-10 h-(--active-tab-height) w-(--active-tab-width) rounded-md bg-background shadow-xs',
          )}
        />
      </BaseTabs.List>
    );
  },
);

/** One tab. `value` links it to the `TabsPanel` with the same value. */
export const TabsTab = forwardRef<HTMLElement, BaseTabs.Tab.Props>(
  function TabsTab({ className, ...props }, ref) {
    const variant = useContext(TabsVariantContext);
    return (
      <BaseTabs.Tab
        ref={ref}
        data-slot="tabs-tab"
        className={mergeClassName(
          cn(
            'inline-flex cursor-pointer items-center justify-center gap-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none',
            'hover:text-foreground data-active:text-foreground',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'data-disabled:pointer-events-none data-disabled:opacity-50',
            "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            variant === 'underline' ? 'h-10 px-3' : 'h-8 rounded-md px-3',
          ),
          className,
        )}
        {...props}
      />
    );
  },
);

/** Content for one tab. Only the active panel is rendered (unless `keepMounted`). */
export const TabsPanel = forwardRef<HTMLDivElement, BaseTabs.Panel.Props>(
  function TabsPanel({ className, ...props }, ref) {
    return (
      <BaseTabs.Panel
        ref={ref}
        data-slot="tabs-panel"
        className={mergeClassName(
          'flex-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          className,
        )}
        {...props}
      />
    );
  },
);
