'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';
import { useRender } from '@base-ui/react/use-render';
import { mergeProps } from '@base-ui/react/merge-props';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { backdrop } from '../../../lib/styles';
import { useControllableState } from '../../../lib/use-controllable-state';
import { useMediaQuery } from '../../../lib/use-media-query';
import { Button, type ButtonProps } from '../../actions/button/button';
import { Separator } from '../separator/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../overlays/tooltip/tooltip';

/* -------------------------------------------------------------------------------------------------
 * State
 * -----------------------------------------------------------------------------------------------*/

interface SidebarContextValue {
  /** Desktop: expanded (`true`) or collapsed (`false`). */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Mobile: the slide-in panel is open. */
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  /** True below the `mobileQuery` breakpoint. */
  isMobile: boolean;
  /** Toggle the right thing for the current screen size. */
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/** Settings of the nearest `Sidebar`, read by its parts. */
interface SidebarConfig {
  collapsible: SidebarCollapsible;
  side: SidebarSide;
  /** Collapsed to icons right now (desktop only). */
  iconCollapsed: boolean;
}
const SidebarConfigContext = createContext<SidebarConfig>({
  collapsible: 'icon',
  side: 'left',
  iconCollapsed: false,
});

/**
 * Reads and controls the sidebar from anywhere inside `SidebarProvider`.
 *
 * @example
 * const { open, toggle, isMobile } = useSidebar();
 */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error('useSidebar must be used inside <SidebarProvider>.');
  return context;
}

/* -------------------------------------------------------------------------------------------------
 * Provider
 * -----------------------------------------------------------------------------------------------*/

export interface SidebarProviderProps extends ComponentProps<'div'> {
  /** Desktop expanded state (controlled). */
  open?: boolean;
  /** Initial desktop expanded state (uncontrolled). @default true */
  defaultOpen?: boolean;
  /** Called when the desktop state changes. Persist it (e.g. a cookie) to remember the choice. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Toggle with Ctrl/⌘ + this key. `null` disables the shortcut.
   * @default 'b'
   */
  keyboardShortcut?: string | null;
  /** Media query that switches to the mobile panel. @default '(max-width: 767px)' */
  mobileQuery?: string;
  /** Expanded width (any CSS length). Sets `--sidebar-width`. @default '16rem' */
  width?: string;
  /** Collapsed width in icon mode. Sets `--sidebar-width-icon`. @default '3.5rem' */
  iconWidth?: string;
  /** Width of the mobile panel. Sets `--sidebar-width-mobile`. @default 'min(18rem, 85vw)' */
  mobileWidth?: string;
}

/**
 * The app shell: holds the sidebar state and lays out `Sidebar` (and optionally `AppRail`)
 * next to `SidebarInset`. On desktop the sidebar collapses; on mobile it becomes a slide-in panel.
 *
 * Every size is a CSS variable (`--sidebar-width`, `--sidebar-width-icon`, `--sidebar-width-mobile`)
 * and every colour a token (`--color-sidebar*`), so the design can be changed without forking.
 *
 * @example
 * <SidebarProvider width="17rem">
 *   <Sidebar variant="inset" collapsible="icon">…</Sidebar>
 *   <SidebarInset>…</SidebarInset>
 * </SidebarProvider>
 */
export const SidebarProvider = forwardRef<HTMLDivElement, SidebarProviderProps>(
  function SidebarProvider(
    {
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      keyboardShortcut = 'b',
      mobileQuery = '(max-width: 767px)',
      width = '16rem',
      iconWidth = '3.5rem',
      mobileWidth = 'min(18rem, 85vw)',
      className,
      style,
      children,
      ...props
    },
    ref,
  ) {
    const isMobile = useMediaQuery(mobileQuery);
    const [open, setOpen] = useControllableState({
      value: openProp,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const [openMobile, setOpenMobile] = useState(false);

    const toggle = useCallback(() => {
      if (isMobile) setOpenMobile(!openMobile);
      else setOpen(!open);
    }, [isMobile, open, openMobile, setOpen]);

    useEffect(() => {
      if (!keyboardShortcut) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (
          event.key.toLowerCase() === keyboardShortcut.toLowerCase() &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggle();
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [keyboardShortcut, toggle]);

    const value = useMemo(
      () => ({ open, setOpen, openMobile, setOpenMobile, isMobile, toggle }),
      [open, setOpen, openMobile, isMobile, toggle],
    );

    return (
      <SidebarContext.Provider value={value}>
        <div
          ref={ref}
          data-slot="sidebar-provider"
          data-state={open ? 'expanded' : 'collapsed'}
          style={
            {
              '--sidebar-width': width,
              '--sidebar-width-icon': iconWidth,
              '--sidebar-width-mobile': mobileWidth,
              ...style,
            } as CSSProperties
          }
          className={cn(
            'group/sidebar-provider flex min-h-svh w-full',
            'has-[[data-slot=sidebar][data-variant=inset]]:bg-sidebar',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  },
);

/* -------------------------------------------------------------------------------------------------
 * Sidebar
 * -----------------------------------------------------------------------------------------------*/

export type SidebarSide = 'left' | 'right';
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';
export type SidebarCollapsible = 'icon' | 'offcanvas' | 'none';

export interface SidebarProps extends ComponentProps<'aside'> {
  /** Accessible name for the navigation landmark. @default 'Main navigation' */
  label?: string;
  /** Screen edge. Follows the text direction in RTL. @default 'left' */
  side?: SidebarSide;
  /**
   * - `sidebar`: full height, attached to the edge.
   * - `floating`: detached, rounded and shadowed.
   * - `inset`: the page content (`SidebarInset`) floats as a rounded panel on the sidebar colour.
   * @default 'sidebar'
   */
  variant?: SidebarVariant;
  /**
   * What collapsing does on desktop: shrink to icons, slide fully away, or never collapse.
   * @default 'icon'
   */
  collapsible?: SidebarCollapsible;
}

/**
 * The navigation panel. Sticky on desktop; a slide-in panel on mobile.
 *
 * Style hooks: `data-state` (`expanded` | `collapsed`), `data-collapsible` (set while collapsed),
 * `data-variant`, `data-side`. Hide things when collapsed to icons with
 * `group-data-[collapsible=icon]/sidebar:hidden`.
 */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    className,
    label = 'Main navigation',
    side = 'left',
    variant = 'sidebar',
    collapsible = 'icon',
    children,
    ...props
  },
  ref,
) {
  const { open, isMobile, openMobile, setOpenMobile } = useSidebar();
  const expanded = collapsible === 'none' || open;
  const config = useMemo(
    () => ({
      collapsible,
      side,
      iconCollapsed: !isMobile && !expanded && collapsible === 'icon',
    }),
    [collapsible, side, isMobile, expanded],
  );

  if (isMobile) {
    return (
      <SidebarConfigContext.Provider
        value={{ ...config, iconCollapsed: false }}
      >
        <BaseDialog.Root open={openMobile} onOpenChange={setOpenMobile}>
          <BaseDialog.Portal>
            <BaseDialog.Backdrop className={backdrop} />
            <BaseDialog.Popup
              // The ref is the <aside> on desktop and this panel (a div) on mobile.
              ref={ref as Ref<HTMLDivElement>}
              data-slot="sidebar"
              data-mobile=""
              data-side={side}
              data-state="expanded"
              aria-label={label}
              className={cn(
                'group/sidebar fixed inset-y-0 z-50 flex w-(--sidebar-width-mobile) flex-col bg-sidebar text-sidebar-foreground shadow-xl outline-none',
                'transition-transform duration-300 ease-out',
                side === 'left'
                  ? 'start-0 border-e border-sidebar-border data-starting-style:-translate-x-full data-ending-style:-translate-x-full rtl:data-starting-style:translate-x-full rtl:data-ending-style:translate-x-full'
                  : 'end-0 border-s border-sidebar-border data-starting-style:translate-x-full data-ending-style:translate-x-full rtl:data-starting-style:-translate-x-full rtl:data-ending-style:-translate-x-full',
                className,
              )}
            >
              <BaseDialog.Title className="sr-only">{label}</BaseDialog.Title>
              <nav aria-label={label} className="flex min-h-0 flex-1 flex-col">
                {children}
              </nav>
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        </BaseDialog.Root>
      </SidebarConfigContext.Provider>
    );
  }

  return (
    <SidebarConfigContext.Provider value={config}>
      <aside
        ref={ref}
        data-slot="sidebar"
        data-state={expanded ? 'expanded' : 'collapsed'}
        data-collapsible={expanded ? '' : collapsible}
        data-variant={variant}
        data-side={side}
        className={cn(
          'group/sidebar peer relative hidden shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground md:flex',
          'transition-[width] duration-200 ease-out motion-reduce:transition-none',
          side === 'right' && 'order-last',
          // width
          expanded
            ? 'w-(--sidebar-width)'
            : collapsible === 'icon'
              ? 'w-(--sidebar-width-icon)'
              : 'w-0',
          // variant
          variant === 'floating'
            ? cn(
                'sticky top-2 m-2 h-[calc(100svh-1rem)] rounded-xl border border-sidebar-border shadow-sm',
                !expanded && collapsible === 'offcanvas' && 'm-0 border-0',
              )
            : 'sticky top-0 h-svh',
          variant === 'sidebar' &&
            (side === 'left'
              ? 'border-e border-sidebar-border'
              : 'border-s border-sidebar-border'),
          !expanded && collapsible === 'offcanvas' && 'border-0',
          className,
        )}
        {...props}
      >
        <nav
          aria-label={label}
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            collapsible === 'offcanvas' &&
              'w-(--sidebar-width) min-w-(--sidebar-width)',
          )}
        >
          {children}
        </nav>
      </aside>
    </SidebarConfigContext.Provider>
  );
});

/* -------------------------------------------------------------------------------------------------
 * Structure
 * -----------------------------------------------------------------------------------------------*/

/** Top of the sidebar, e.g. logo or workspace switcher. */
export const SidebarHeader = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SidebarHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sidebar-header"
        className={cn('flex flex-col gap-2 p-3', className)}
        {...props}
      />
    );
  },
);

/** Scrollable middle of the sidebar that holds the groups. */
export const SidebarContent = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SidebarContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sidebar-content"
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto overscroll-contain',
          className,
        )}
        {...props}
      />
    );
  },
);

/** Bottom of the sidebar, e.g. the user menu. */
export const SidebarFooter = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SidebarFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sidebar-footer"
        className={cn(
          'mt-auto flex flex-col gap-2 border-t border-sidebar-border p-3',
          className,
        )}
        {...props}
      />
    );
  },
);

/** A divider between sidebar sections. */
export const SidebarSeparator = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Separator>
>(function SidebarSeparator({ className, ...props }, ref) {
  return (
    <Separator
      ref={ref}
      data-slot="sidebar-separator"
      className={mergeClassName('mx-3 w-auto bg-sidebar-border', className)}
      {...props}
    />
  );
});

/** A section of related links. Wrap in `Collapsible` to make it expandable (see docs). */
export const SidebarGroup = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SidebarGroup({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sidebar-group"
        className={cn('relative flex flex-col gap-1 px-2 py-1', className)}
        {...props}
      />
    );
  },
);

/** The heading of a group. Hidden (but still announced) when collapsed to icons. */
export const SidebarGroupLabel = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'>
>(function SidebarGroupLabel({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="sidebar-group-label"
      className={cn(
        'flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-xs font-medium tracking-wide text-sidebar-muted-foreground uppercase outline-none',
        'focus-visible:outline-2 focus-visible:outline-sidebar-ring',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]/sidebar:sr-only',
        className,
      )}
      {...props}
    />
  );
});

/** A small button at the top end of a group, e.g. "+ New project". Give it an `aria-label`. */
export const SidebarGroupAction = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'>
>(function SidebarGroupAction({ className, type = 'button', ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      data-slot="sidebar-group-action"
      className={cn(
        'absolute end-3 top-2.5 flex size-6 cursor-pointer items-center justify-center rounded-md text-sidebar-muted-foreground transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring',
        '[&>svg]:size-4 group-data-[collapsible=icon]/sidebar:hidden',
        className,
      )}
      {...props}
    />
  );
});

/** A list of navigation items. */
export const SidebarMenu = forwardRef<HTMLUListElement, ComponentProps<'ul'>>(
  function SidebarMenu({ className, ...props }, ref) {
    return (
      <ul
        ref={ref}
        data-slot="sidebar-menu"
        className={cn('flex flex-col gap-0.5', className)}
        {...props}
      />
    );
  },
);

/** One entry of a `SidebarMenu`. Holds a button, and optionally an action, a badge or a sub-menu. */
export const SidebarMenuItem = forwardRef<HTMLLIElement, ComponentProps<'li'>>(
  function SidebarMenuItem({ className, ...props }, ref) {
    return (
      <li
        ref={ref}
        data-slot="sidebar-menu-item"
        className={cn('group/menu-item relative', className)}
        {...props}
      />
    );
  },
);

/* -------------------------------------------------------------------------------------------------
 * Menu button
 * -----------------------------------------------------------------------------------------------*/

const menuButtonSize = {
  sm: 'h-8 text-xs pointer-coarse:h-10',
  md: 'h-9 text-sm pointer-coarse:h-11',
  lg: 'h-12 text-sm',
} as const;

export interface SidebarMenuButtonProps extends useRender.ComponentProps<'button'> {
  /** Highlights the item and sets `aria-current="page"`. */
  isActive?: boolean;
  /** Icon shown before the label, and alone when collapsed to icons. */
  icon?: ReactNode;
  /** Text or element at the end, e.g. a count `Badge`. Hidden when collapsed. */
  badge?: ReactNode;
  /**
   * Tooltip shown when collapsed to icons.
   * @default the children, when they're a string
   */
  tooltip?: ReactNode;
  /** Height: 32, 36 or 48px (taller on touch screens). @default 'md' */
  size?: keyof typeof menuButtonSize;
  /**
   * Show the bar on the edge of the active item.
   * @default true
   */
  activeIndicator?: boolean;
}

/**
 * A navigation item. Renders a `<button>`; pass `render={<Link href="…" />}` (or `<a>`) for
 * navigation so it uses your router. Style hooks: `data-active`, `data-slot="sidebar-menu-button"`,
 * and the label `data-slot="sidebar-menu-label"`.
 */
export const SidebarMenuButton = forwardRef<
  HTMLElement,
  SidebarMenuButtonProps
>(function SidebarMenuButton(
  {
    className,
    isActive = false,
    icon,
    badge,
    tooltip,
    size = 'md',
    activeIndicator = true,
    render,
    children,
    ...props
  },
  ref,
) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { iconCollapsed: collapsed } = useContext(SidebarConfigContext);

  const element = useRender({
    defaultTagName: 'button',
    ref,
    render,
    props: mergeProps<'button'>(
      // data-* attributes aren't in React's prop types, hence the cast.
      {
        className: cn(
          'relative flex w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-md px-2.5 text-start text-sidebar-foreground transition-colors outline-none',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring',
          "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
          menuButtonSize[size],
          isActive &&
            'bg-sidebar-primary-soft font-medium text-sidebar-primary hover:bg-sidebar-primary-soft hover:text-sidebar-primary',
          isActive &&
            activeIndicator &&
            !collapsed &&
            'before:absolute before:inset-y-1.5 before:start-0 before:w-0.75 before:rounded-full before:bg-sidebar-primary',
          collapsed && 'justify-center px-0',
          className,
        ),
        'aria-current': isActive ? 'page' : undefined,
        'data-active': isActive ? '' : undefined,
        'data-slot': 'sidebar-menu-button',
        'data-size': size,
        onClick: () => {
          if (isMobile) setOpenMobile(false);
        },
        children: (
          <>
            {icon}
            <span
              data-slot="sidebar-menu-label"
              className={cn('flex-1 truncate', collapsed && 'sr-only')}
            >
              {children}
            </span>
            {badge && !collapsed && (
              <span className="ms-auto shrink-0 text-xs">{badge}</span>
            )}
          </>
        ),
      } as ComponentProps<'button'>,
      props,
    ),
  });

  const tip = tooltip ?? (typeof children === 'string' ? children : undefined);
  if (!collapsed || !tip) return element;

  return (
    <Tooltip>
      <TooltipTrigger render={element} />
      <TooltipContent side="right">{tip}</TooltipContent>
    </Tooltip>
  );
});

export interface SidebarMenuActionProps extends ComponentProps<'button'> {
  /** Only show on hover or focus of the item (always shown on touch screens). @default false */
  showOnHover?: boolean;
}

/** A small button at the end of a menu item, e.g. "⋯" for item options. Give it an `aria-label`. */
export const SidebarMenuAction = forwardRef<
  HTMLButtonElement,
  SidebarMenuActionProps
>(function SidebarMenuAction(
  { className, showOnHover = false, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-slot="sidebar-menu-action"
      className={cn(
        'absolute end-1 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-sidebar-muted-foreground transition-[color,background-color,opacity]',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring',
        '[&>svg]:size-4 group-data-[collapsible=icon]/sidebar:hidden',
        showOnHover &&
          'pointer-fine:opacity-0 pointer-fine:group-hover/menu-item:opacity-100 pointer-fine:group-focus-within/menu-item:opacity-100 data-popup-open:opacity-100',
        className,
      )}
      {...props}
    />
  );
});

/** A count or status at the end of a menu item. Hidden when collapsed to icons. */
export const SidebarMenuBadge = forwardRef<
  HTMLSpanElement,
  ComponentProps<'span'>
>(function SidebarMenuBadge({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="sidebar-menu-badge"
      className={cn(
        'pointer-events-none absolute end-2 top-1/2 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-full bg-sidebar-accent px-1.5 text-xs font-medium text-sidebar-accent-foreground tabular-nums',
        'group-data-[collapsible=icon]/sidebar:hidden',
        className,
      )}
      {...props}
    />
  );
});

/** Nested items under a menu item. Hidden when collapsed to icons. */
export const SidebarMenuSub = forwardRef<
  HTMLUListElement,
  ComponentProps<'ul'>
>(function SidebarMenuSub({ className, ...props }, ref) {
  return (
    <ul
      ref={ref}
      data-slot="sidebar-menu-sub"
      className={cn(
        'ms-4.5 mt-0.5 flex flex-col gap-0.5 border-s border-sidebar-border ps-2.5',
        'group-data-[collapsible=icon]/sidebar:hidden',
        className,
      )}
      {...props}
    />
  );
});

/** One nested item. */
export const SidebarMenuSubItem = forwardRef<
  HTMLLIElement,
  ComponentProps<'li'>
>(function SidebarMenuSubItem({ className, ...props }, ref) {
  return (
    <li
      ref={ref}
      data-slot="sidebar-menu-sub-item"
      className={cn('relative', className)}
      {...props}
    />
  );
});

export interface SidebarMenuSubButtonProps extends useRender.ComponentProps<'a'> {
  /** Highlights the item and sets `aria-current="page"`. */
  isActive?: boolean;
}

/** A nested navigation link. Renders an `<a>`; use `render` for your router's link. */
export const SidebarMenuSubButton = forwardRef<
  HTMLElement,
  SidebarMenuSubButtonProps
>(function SidebarMenuSubButton(
  { className, isActive = false, render, ...props },
  ref,
) {
  const { isMobile, setOpenMobile } = useSidebar();
  return useRender({
    defaultTagName: 'a',
    ref,
    render,
    props: mergeProps<'a'>(
      {
        className: cn(
          'flex h-8 w-full items-center gap-2 truncate rounded-md px-2.5 text-sm text-sidebar-muted-foreground transition-colors outline-none pointer-coarse:h-10',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring',
          isActive && 'font-medium text-sidebar-primary',
          className,
        ),
        'aria-current': isActive ? 'page' : undefined,
        'data-active': isActive ? '' : undefined,
        'data-slot': 'sidebar-menu-sub-button',
        onClick: () => {
          if (isMobile) setOpenMobile(false);
        },
      } as ComponentProps<'a'>,
      props,
    ),
  });
});

/* -------------------------------------------------------------------------------------------------
 * Controls
 * -----------------------------------------------------------------------------------------------*/

/** Opens/closes the sidebar. Place it in the page header. */
export const SidebarTrigger = forwardRef<HTMLElement, ButtonProps>(
  function SidebarTrigger({ className, onClick, children, ...props }, ref) {
    const { toggle, open, isMobile, openMobile } = useSidebar();
    return (
      <Button
        ref={ref}
        data-slot="sidebar-trigger"
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Toggle sidebar"
        aria-expanded={isMobile ? openMobile : open}
        className={className}
        onClick={(event) => {
          onClick?.(event);
          toggle();
        }}
        {...props}
      >
        {children ?? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        )}
      </Button>
    );
  },
);

/**
 * A thin strip on the sidebar's inner edge that toggles it on click, like many desktop apps.
 * Place it as the last child of `Sidebar`. Hidden on mobile.
 */
export const SidebarRail = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'>
>(function SidebarRail({ className, ...props }, ref) {
  const { toggle, open } = useSidebar();
  const { side } = useContext(SidebarConfigContext);
  return (
    <button
      ref={ref}
      type="button"
      data-slot="sidebar-rail"
      aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
      tabIndex={-1}
      onClick={toggle}
      className={cn(
        'absolute inset-y-0 z-10 hidden w-2 cursor-col-resize transition-colors md:block',
        'after:absolute after:inset-y-0 after:start-1/2 after:w-px after:transition-colors hover:after:bg-sidebar-ring',
        side === 'left' ? 'end-0' : 'start-0',
        className,
      )}
      {...props}
    />
  );
});

/** The main area next to the sidebar. Put your page header and content in it. */
export const SidebarInset = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SidebarInset({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sidebar-inset"
        className={cn(
          'flex min-w-0 flex-1 flex-col bg-background',
          'md:peer-data-[variant=inset]:my-2 md:peer-data-[variant=inset]:me-2 md:peer-data-[variant=inset]:overflow-hidden md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-sidebar-border md:peer-data-[variant=inset]:shadow-sm',
          'md:peer-data-[variant=inset]:peer-data-[collapsible=offcanvas]:ms-2',
          className,
        )}
        {...props}
      />
    );
  },
);
