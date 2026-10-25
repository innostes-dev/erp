'use client';

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cn } from '../../../lib/cn';
import { SearchIcon } from '../../../lib/icons';
import { backdrop } from '../../../lib/styles';
import type { SlotClassNames } from '../../../lib/slots';
import { useControllableState } from '../../../lib/use-controllable-state';
import { useId } from '../../../lib/use-id';

/** One command in a `CommandPalette`. */
export interface CommandItem {
  /** Unique, stable id. */
  id: string;
  /** Text shown and searched. */
  label: string;
  /** Secondary text, e.g. the section a page belongs to. */
  description?: ReactNode;
  /** Icon before the label. */
  icon?: ReactNode;
  /** Shortcut hint at the end, e.g. "G then O". Visual only. */
  shortcut?: ReactNode;
  /** Extra words that should match the search. */
  keywords?: string[];
  /** Show but don't allow selecting. */
  disabled?: boolean;
  /** Runs when the command is chosen. The palette closes afterwards. */
  onSelect: () => void;
}

/** A titled group of commands. */
export interface CommandGroup {
  /** Group heading, e.g. "Pages" or "Actions". */
  heading: string;
  /** The commands. */
  items: CommandItem[];
}

export type CommandPaletteSlot = 'popup' | 'input' | 'list' | 'groupHeading' | 'item' | 'empty' | 'footer';

export interface CommandPaletteProps {
  /** The commands, in groups. */
  groups: CommandGroup[];
  /** Open state (controlled). */
  open?: boolean;
  /** Initial open state (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when the palette opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Open with Ctrl/⌘ + this key. `null` disables the shortcut.
   * @default 'k'
   */
  hotkey?: string | null;
  /** Placeholder of the search input. @default 'Type a command or search…' */
  placeholder?: string;
  /** Shown when nothing matches. @default 'No results found.' */
  emptyText?: ReactNode;
  /** Accessible name of the dialog. @default 'Command palette' */
  label?: string;
  /** Content under the list, e.g. keyboard hints. */
  footer?: ReactNode;
  /** Custom matching. @default label, description text and keywords, case- and accent-insensitive */
  filter?: (item: CommandItem, query: string) => boolean;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<CommandPaletteSlot>;
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const defaultFilter = (item: CommandItem, query: string) => {
  const q = normalize(query);
  if (!q) return true;
  const haystack = [item.label, typeof item.description === 'string' ? item.description : '', ...(item.keywords ?? [])];
  return haystack.some((text) => normalize(text).includes(q));
};

/**
 * A searchable list of pages and actions, opened with ⌘K / Ctrl+K: the fastest way around a large
 * admin app. Arrow keys move, Enter runs the command, Escape closes.
 *
 * @example
 * <CommandPalette
 *   groups={[
 *     { heading: 'Pages', items: [{ id: 'orders', label: 'Orders', icon: <CartIcon />, onSelect: () => router.push('/orders') }] },
 *     { heading: 'Actions', items: [{ id: 'new-invoice', label: 'Create invoice', shortcut: 'C I', onSelect: createInvoice }] },
 *   ]}
 * />
 */
export const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(function CommandPalette(
  {
    groups,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    hotkey = 'k',
    placeholder = 'Type a command or search…',
    emptyText = 'No results found.',
    label = 'Command palette',
    footer,
    filter = defaultFilter,
    classNames,
  },
  ref,
) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!hotkey) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() === hotkey.toLowerCase() && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hotkey, open, setOpen]);

  const filtered = useMemo(
    () =>
      groups
        .map((group) => ({ ...group, items: group.items.filter((item) => filter(item, query)) }))
        .filter((group) => group.items.length > 0),
    [groups, query, filter],
  );
  const enabled = useMemo(() => filtered.flatMap((g) => g.items).filter((i) => !i.disabled), [filtered]);
  const activeItem = enabled[Math.min(active, enabled.length - 1)];
  const optionId = (item: CommandItem) => `${id}-option-${item.id}`;

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);
  useEffect(() => {
    if (!activeItem) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[id="${optionId(activeItem)}"]`);
    node?.scrollIntoView?.({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem]);

  function run(item: CommandItem) {
    if (item.disabled) return;
    setOpen(false);
    item.onSelect();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const last = enabled.length - 1;
    const moves: Record<string, () => number> = {
      ArrowDown: () => (active >= last ? 0 : active + 1),
      ArrowUp: () => (active <= 0 ? last : active - 1),
      Home: () => 0,
      End: () => last,
    };
    if (moves[event.key] && enabled.length > 0) {
      event.preventDefault();
      setActive(moves[event.key]!());
    } else if (event.key === 'Enter' && activeItem) {
      event.preventDefault();
      run(activeItem);
    }
  }

  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => setOpen(next)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdrop} />
        <BaseDialog.Popup
          ref={ref}
          data-slot="command-palette"
          className={cn(
            'fixed top-[max(1rem,12vh)] left-1/2 z-50 flex max-h-[min(32rem,calc(100dvh-2rem))] w-[min(40rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-col overflow-hidden',
            'rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl outline-none',
            'transition-[opacity,scale] duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0',
            classNames?.popup,
          )}
        >
          <BaseDialog.Title className="sr-only">{label}</BaseDialog.Title>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={activeItem ? optionId(activeItem) : undefined}
              aria-label={label}
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              data-slot="command-palette-input"
              className={cn(
                'h-12 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm',
                classNames?.input,
              )}
            />
          </div>
          <div
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            data-slot="command-palette-list"
            className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain p-2', classNames?.list)}
          >
            {filtered.length === 0 ? (
              <div data-slot="command-palette-empty" className={cn('py-10 text-center text-sm text-muted-foreground', classNames?.empty)}>
                {emptyText}
              </div>
            ) : (
              filtered.map((group, g) => (
                <div key={group.heading} role="group" aria-labelledby={`${id}-group-${g}`} className="pb-2 last:pb-0">
                  <div
                    id={`${id}-group-${g}`}
                    data-slot="command-palette-group-heading"
                    className={cn('px-2 pt-2 pb-1.5 text-xs font-medium text-muted-foreground', classNames?.groupHeading)}
                  >
                    {group.heading}
                  </div>
                  {group.items.map((item) => {
                    const isActive = item === activeItem;
                    return (
                      <div
                        key={item.id}
                        id={optionId(item)}
                        role="option"
                        aria-selected={isActive}
                        aria-disabled={item.disabled || undefined}
                        data-highlighted={isActive ? '' : undefined}
                        data-slot="command-palette-item"
                        onMouseMove={() => !item.disabled && !isActive && setActive(enabled.indexOf(item))}
                        onClick={() => run(item)}
                        className={cn(
                          'flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm outline-none select-none',
                          "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                          'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
                          'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                          classNames?.item,
                        )}
                      >
                        {item.icon && <span className="flex text-muted-foreground">{item.icon}</span>}
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate">{item.label}</span>
                          {item.description && <span className="truncate text-xs text-muted-foreground">{item.description}</span>}
                        </span>
                        {item.shortcut && (
                          <kbd className="hidden shrink-0 rounded-sm border border-border bg-muted px-1.5 font-sans text-[0.6875rem] text-muted-foreground sm:inline">
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          {footer !== undefined ? (
            footer && (
              <div data-slot="command-palette-footer" className={cn('border-t border-border px-4 py-2 text-xs text-muted-foreground', classNames?.footer)}>
                {footer}
              </div>
            )
          ) : (
            <div
              aria-hidden="true"
              data-slot="command-palette-footer"
              className={cn('hidden items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:flex', classNames?.footer)}
            >
              <span>↑↓ to move</span>
              <span>↵ to select</span>
              <span>esc to close</span>
            </div>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
});
