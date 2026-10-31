'use client';

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import type { SlotClassNames } from '../../lib/slots';
import {
  IconTile,
  type IconTileTone,
} from '../../components/data-display/icon-tile/icon-tile';

/** One shortcut tile. */
export interface QuickAction {
  /** Unique, stable id. */
  id: string;
  /** Label, e.g. "New invoice". */
  label: string;
  /** Second line, e.g. "Bill a customer". */
  description?: string;
  /** Icon, shown in an `IconTile`. */
  icon: ReactNode;
  /** Tile colour. @default 'primary' */
  tone?: IconTileTone;
  /** Link target. */
  href?: string;
  /** Your router's link. */
  render?: ReactElement<Record<string, unknown>>;
  /** Click handler. */
  onClick?: () => void;
  /** Show but don't allow it. */
  disabled?: boolean;
}

export type QuickActionsSlot = 'root' | 'item' | 'label' | 'description';

export interface QuickActionsProps extends Omit<
  ComponentProps<'ul'>,
  'children'
> {
  /** The shortcuts. */
  items: readonly QuickAction[];
  /**
   * `tile`: icon above the label, in a grid. `row`: icon beside label and description.
   * @default 'tile'
   */
  layout?: 'tile' | 'row';
  /** Smallest tile width before wrapping. @default '7.5rem' for tiles, '14rem' for rows */
  minItemWidth?: string;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<QuickActionsSlot>;
}

/**
 * A grid of shortcuts to common tasks ("New invoice", "Add employee", "Run payroll"). Fills as
 * many columns as fit.
 *
 * @example
 * <QuickActions items={[{ id: 'invoice', label: 'New invoice', icon: <FileIcon />, tone: 'chart-1', href: '/invoices/new' }]} />
 */
export const QuickActions = forwardRef<HTMLUListElement, QuickActionsProps>(
  function QuickActions(
    {
      className,
      items,
      layout = 'tile',
      minItemWidth,
      classNames,
      style,
      ...props
    },
    ref,
  ) {
    const tile = layout === 'tile';
    return (
      <ul
        ref={ref}
        data-slot="quick-actions"
        data-layout={layout}
        style={{
          ['--quick-action-min' as string]:
            minItemWidth ?? (tile ? '7.5rem' : '14rem'),
          ...style,
        }}
        className={cn(
          'grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--quick-action-min)),1fr))] gap-2',
          classNames?.root,
          className,
        )}
        {...props}
      >
        {items.map((item) => {
          const cls = cn(
            'flex h-full w-full cursor-pointer rounded-lg border border-border bg-card text-card-foreground transition-[border-color,background-color,box-shadow] outline-none',
            'hover:border-ring/40 hover:bg-accent/50 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            tile
              ? 'flex-col items-center justify-center gap-2 p-3 text-center'
              : 'items-center gap-3 p-3 text-start',
            item.disabled && 'pointer-events-none opacity-50',
            classNames?.item,
          );
          const content: ReactNode = (
            <>
              <IconTile tone={item.tone ?? 'primary'} size={tile ? 'md' : 'sm'}>
                {item.icon}
              </IconTile>
              <span className="flex min-w-0 flex-col">
                <span
                  data-slot="quick-action-label"
                  className={cn(
                    'text-sm font-medium',
                    !tile && 'truncate',
                    classNames?.label,
                  )}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span
                    data-slot="quick-action-description"
                    className={cn(
                      'text-xs text-muted-foreground',
                      !tile && 'truncate',
                      classNames?.description,
                    )}
                  >
                    {item.description}
                  </span>
                )}
              </span>
            </>
          );
          const common = {
            className: cls,
            onClick: item.onClick,
            'data-slot': 'quick-action',
            'aria-disabled': item.disabled || undefined,
          };
          return (
            <li key={item.id}>
              {item.render && isValidElement(item.render) ? (
                cloneElement(item.render, common, content)
              ) : item.href ? (
                <a href={item.href} {...common}>
                  {content}
                </a>
              ) : (
                <button type="button" disabled={item.disabled} {...common}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  },
);
