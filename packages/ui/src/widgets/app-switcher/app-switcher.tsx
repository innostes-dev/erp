'use client';

import { cloneElement, forwardRef, isValidElement, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { cn } from '../../lib/cn';
import { ArrowDownIcon, CheckIcon, ChevronDownIcon } from '../../lib/icons';
import { popupSurface } from '../../lib/styles';
import type { SlotClassNames } from '../../lib/slots';
import { useControllableState } from '../../lib/use-controllable-state';
import { IconTile, type IconTileTone } from '../../components/data-display/icon-tile/icon-tile';
import { SearchInput } from '../../components/forms/input-group/input-group';

/** An application or module in the `AppSwitcher`. */
export interface AppSwitcherApp {
  /** Unique id; matched against `value`. */
  id: string;
  /** Name, e.g. "HRMS". */
  name: string;
  /** One line about it, e.g. "People & HR". */
  description?: string;
  /** Icon, shown in an `IconTile`. */
  icon: ReactNode;
  /** Tile colour. @default 'primary' */
  tone?: IconTileTone;
  /** Link to the app. */
  href?: string;
  /** Your router's link, e.g. `<Link href="/hrms" />`. Our props and content are merged in. */
  render?: ReactElement<Record<string, unknown>>;
  /** Show but don't allow switching to it. */
  disabled?: boolean;
}

/** A titled group of apps, e.g. "Modules" or "Tools". */
export interface AppSwitcherSection {
  /** Heading. */
  label: string;
  /** The apps. */
  apps: AppSwitcherApp[];
  /** A "View all" link for the section. */
  viewAll?: { href?: string; onClick?: () => void; label?: ReactNode };
}

export type AppSwitcherSlot = 'trigger' | 'content' | 'search' | 'section' | 'sectionLabel' | 'item';

export interface AppSwitcherProps {
  /** The apps, in sections. */
  sections: AppSwitcherSection[];
  /** Id of the current app (controlled). */
  value?: string;
  /** Initial current app (uncontrolled). */
  defaultValue?: string;
  /** Called with the id of the chosen app. Navigate here if the apps don't have links. */
  onValueChange?: (id: string) => void;
  /** Show a search box. @default true when there are more than 6 apps */
  searchable?: boolean;
  /** Placeholder of the search box. @default 'Search applications…' */
  searchPlaceholder?: string;
  /** Shown when the search matches nothing. @default 'No applications found.' */
  emptyText?: ReactNode;
  /** Show the current app's name in the trigger (hidden on narrow screens). @default true */
  showName?: boolean;
  /** Popup alignment against the trigger. @default 'start' */
  align?: 'start' | 'center' | 'end';
  /** Classes for inner parts. */
  classNames?: SlotClassNames<AppSwitcherSlot>;
}

/**
 * A launcher for moving between the modules and tools of a suite (ERP, CRM, HRMS…), usually in
 * the top bar. Shows the current app, with search and sections in a popover.
 *
 * @example
 * <AppSwitcher
 *   value="hrms"
 *   sections={[
 *     { label: 'Modules', apps: [
 *       { id: 'erp', name: 'ERP', description: 'Business operations', icon: <BuildingIcon />, tone: 'chart-1', href: '/erp' },
 *       { id: 'hrms', name: 'HRMS', description: 'People & HR', icon: <UsersIcon />, tone: 'chart-3', href: '/hrms' },
 *     ] },
 *   ]}
 * />
 */
export const AppSwitcher = forwardRef<HTMLButtonElement, AppSwitcherProps>(function AppSwitcher(
  {
    sections,
    value: valueProp,
    defaultValue,
    onValueChange,
    searchable,
    searchPlaceholder = 'Search applications…',
    emptyText = 'No applications found.',
    showName = true,
    align = 'start',
    classNames,
  },
  ref,
) {
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((v: string | undefined) => void) | undefined,
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const all = sections.flatMap((s) => s.apps);
  const current = all.find((app) => app.id === value);
  const showSearch = searchable ?? all.length > 6;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, apps: s.apps.filter((a) => `${a.name} ${a.description ?? ''}`.toLowerCase().includes(q)) }))
      .filter((s) => s.apps.length > 0);
  }, [sections, query]);

  function choose(app: AppSwitcherApp) {
    setValue(app.id);
    setOpen(false);
    setQuery('');
  }

  return (
    <BasePopover.Root open={open} onOpenChange={(next) => setOpen(next)}>
      <BasePopover.Trigger
        ref={ref}
        data-slot="app-switcher-trigger"
        aria-label={current ? `Switch application, current: ${current.name}` : 'Switch application'}
        className={cn(
          'inline-flex h-10 max-w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-background ps-1.5 pe-2.5 text-sm font-semibold shadow-xs transition-colors outline-none',
          'hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-popup-open:bg-accent',
          classNames?.trigger,
        )}
      >
        {current && (
          <IconTile tone={current.tone ?? 'primary'} size="sm" className="size-7">
            {current.icon}
          </IconTile>
        )}
        {showName && <span className="truncate max-sm:hidden">{current?.name ?? 'Applications'}</span>}
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner className="z-50" align={align} sideOffset={6}>
          <BasePopover.Popup
            data-slot="app-switcher-content"
            className={cn(
              popupSurface,
              '@container flex max-h-(--available-height) w-[min(36rem,calc(100vw-1rem))] flex-col gap-3 overflow-y-auto p-3',
              classNames?.content,
            )}
          >
            {showSearch && (
              <SearchInput
                size="sm"
                autoFocus
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={query}
                onValueChange={setQuery}
                groupClassName={classNames?.search}
              />
            )}
            {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>}
            {filtered.map((section) => (
              <section key={section.label} data-slot="app-switcher-section" className={cn('flex flex-col gap-1.5', classNames?.section)}>
                <div className="flex items-center justify-between px-1">
                  <h3 className={cn('text-xs font-semibold tracking-wide text-muted-foreground uppercase', classNames?.sectionLabel)}>
                    {section.label}
                  </h3>
                  {section.viewAll &&
                    (section.viewAll.href ? (
                      <a href={section.viewAll.href} onClick={section.viewAll.onClick} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        {section.viewAll.label ?? 'View all'} <ArrowDownIcon className="size-3 -rotate-90 rtl:rotate-90" />
                      </a>
                    ) : (
                      <button type="button" onClick={section.viewAll.onClick} className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline">
                        {section.viewAll.label ?? 'View all'} <ArrowDownIcon className="size-3 -rotate-90 rtl:rotate-90" />
                      </button>
                    ))}
                </div>
                <ul className="grid grid-cols-1 gap-1 @md:grid-cols-2">
                  {section.apps.map((app) => {
                    const isCurrent = app.id === value;
                    const itemClass = cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 text-start transition-colors outline-none',
                      'hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
                      isCurrent && 'border-primary/40 bg-primary/5',
                      app.disabled && 'pointer-events-none opacity-50',
                      classNames?.item,
                    );
                    const content: ReactNode = (
                      <>
                        <IconTile tone={app.tone ?? 'primary'} size="md">
                          {app.icon}
                        </IconTile>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-semibold">{app.name}</span>
                          {app.description && <span className="truncate text-xs text-muted-foreground">{app.description}</span>}
                        </span>
                        {isCurrent && <CheckIcon className="size-4 shrink-0 text-primary" />}
                      </>
                    );
                    const common = {
                      'data-slot': 'app-switcher-item',
                      'aria-current': isCurrent ? ('true' as const) : undefined,
                      'aria-disabled': app.disabled || undefined,
                      className: itemClass,
                      onClick: () => choose(app),
                    };
                    return (
                      <li key={app.id}>
                        {app.render && isValidElement(app.render) ? (
                          cloneElement(app.render, common, content)
                        ) : app.href ? (
                          <a href={app.href} {...common}>
                            {content}
                          </a>
                        ) : (
                          <button type="button" disabled={app.disabled} {...common}>
                            {content}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
});
