'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
  forwardRef,
} from 'react';
import { useRender } from '@base-ui/react/use-render';
import { mergeProps } from '@base-ui/react/merge-props';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cn } from '../../../lib/cn';
import { backdrop } from '../../../lib/styles';
import { useControllableState } from '../../../lib/use-controllable-state';
import { useMediaQuery } from '../../../lib/use-media-query';
import { Button, type ButtonProps } from '../../actions/button/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../overlays/tooltip/tooltip';

interface SidebarContextValue {
  /** Desktop: expanded (`true`) or collapsed to icons (`false`). */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Mobile: the slide-in panel is open. */
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  /** Toggle the right thing for the current screen size. */
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

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
}

/**
 * The app shell: holds the sidebar state and lays out `Sidebar` next to `SidebarInset`.
 * On desktop the sidebar collapses to icons; on mobile it becomes a slide-in panel.
 *
 * @example
 * <SidebarProvider>
 *   <Sidebar>
 *     <SidebarHeader>Acme</SidebarHeader>
 *     <SidebarContent>
 *       <SidebarGroup>
 *         <SidebarGroupLabel>Workspace</SidebarGroupLabel>
 *         <SidebarMenu>
 *           <SidebarMenuItem>
 *             <SidebarMenuButton icon={<HomeIcon />} isActive render={<Link href="/" />}>Dashboard</SidebarMenuButton>
 *           </SidebarMenuItem>
 *         </SidebarMenu>
 *       </SidebarGroup>
 *     </SidebarContent>
 *   </Sidebar>
 *   <SidebarInset>
 *     <header><SidebarTrigger /></header>
 *     <main>…</main>
 *   </SidebarInset>
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
      className,
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
          className={cn(
            'group/sidebar-provider flex min-h-svh w-full',
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

export interface SidebarProps extends ComponentProps<'aside'> {
  /** Accessible name for the navigation landmark. @default 'Main navigation' */
  label?: string;
}

/** The sidebar panel. Sticky on desktop; a slide-in panel on mobile. */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { className, label = 'Main navigation', children, ...props },
  ref,
) {
  const { open, isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <BaseDialog.Root open={openMobile} onOpenChange={setOpenMobile}>
        <BaseDialog.Portal>
          <BaseDialog.Backdrop className={backdrop} />
          <BaseDialog.Popup
            // The ref is the <aside> on desktop and this panel (a div) on mobile.
            ref={ref as Ref<HTMLDivElement>}
            data-slot="sidebar"
            data-mobile=""
            aria-label={label}
            className={cn(
              'fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col border-e border-border bg-card text-card-foreground shadow-xl outline-none',
              'transition-transform duration-300 ease-out data-starting-style:-translate-x-full data-ending-style:-translate-x-full',
              'rtl:data-starting-style:translate-x-full rtl:data-ending-style:translate-x-full',
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
    );
  }

  return (
    <aside
      ref={ref}
      data-slot="sidebar"
      data-state={open ? 'expanded' : 'collapsed'}
      className={cn(
        'group/sidebar sticky top-0 hidden h-svh shrink-0 flex-col border-e border-border bg-card text-card-foreground transition-[width] duration-200 ease-out md:flex',
        open ? 'w-64' : 'w-14',
        className,
      )}
      {...props}
    >
      <nav aria-label={label} className="flex min-h-0 flex-1 flex-col">
        {children}
      </nav>
    </aside>
  );
});

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
          'flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto',
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
          'mt-auto flex flex-col gap-2 border-t border-border p-3',
          className,
        )}
        {...props}
      />
    );
  },
);

/** A section of related links. */
export const SidebarGroup = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SidebarGroup({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sidebar-group"
        className={cn('flex flex-col gap-1 px-2 py-1', className)}
        {...props}
      />
    );
  },
);

/** The heading of a group. Hidden when the sidebar is collapsed. */
export const SidebarGroupLabel = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'>
>(function SidebarGroupLabel({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="sidebar-group-label"
      className={cn(
        'flex h-8 shrink-0 items-center px-2 text-xs font-medium text-muted-foreground transition-opacity',
        'group-data-[state=collapsed]/sidebar:pointer-events-none group-data-[state=collapsed]/sidebar:opacity-0',
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

export const SidebarMenuItem = forwardRef<HTMLLIElement, ComponentProps<'li'>>(
  function SidebarMenuItem({ className, ...props }, ref) {
    return (
      <li
        ref={ref}
        data-slot="sidebar-menu-item"
        className={cn('relative', className)}
        {...props}
      />
    );
  },
);

export interface SidebarMenuButtonProps extends useRender.ComponentProps<'button'> {
  /** Highlights the item and sets `aria-current="page"`. */
  isActive?: boolean;
  /** Icon shown before the label, and alone when the sidebar is collapsed. */
  icon?: ReactNode;
  /** Text or element at the end, e.g. a count `Badge`. Hidden when collapsed. */
  badge?: ReactNode;
  /**
   * Tooltip shown when the sidebar is collapsed.
   * @default the children, when they're a string
   */
  tooltip?: ReactNode;
}

/**
 * A navigation item. Renders a `<button>`; pass `render={<Link href="…" />}` (or `<a>`) for
 * navigation so it uses your router.
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
    render,
    children,
    ...props
  },
  ref,
) {
  const { open, isMobile, setOpenMobile } = useSidebar();
  const collapsed = !open && !isMobile;

  const element = useRender({
    defaultTagName: 'button',
    ref,
    render,
    props: mergeProps<'button'>(
      // data-* attributes aren't in React's prop types, hence the cast.
      {
        className: cn(
          'flex h-9 w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-md px-2.5 text-start text-sm text-muted-foreground transition-colors outline-none',
          'hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring',
          "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          isActive && 'bg-accent font-medium text-accent-foreground',
          collapsed && 'justify-center px-0',
          className,
        ),
        'aria-current': isActive ? 'page' : undefined,
        'data-active': isActive ? '' : undefined,
        onClick: () => {
          if (isMobile) setOpenMobile(false);
        },
        children: (
          <>
            {icon}
            <span className={cn('flex-1 truncate', collapsed && 'sr-only')}>
              {children}
            </span>
            {badge && !collapsed && (
              <span className="ms-auto text-xs">{badge}</span>
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

/** The main area next to the sidebar. Put your page header and content in it. */
export const SidebarInset = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SidebarInset({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sidebar-inset"
        className={cn('flex min-w-0 flex-1 flex-col bg-background', className)}
        {...props}
      />
    );
  },
);
