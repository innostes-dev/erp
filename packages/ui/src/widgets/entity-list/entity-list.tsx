'use client';

import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { SlotClassNames } from '../../lib/slots';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/data-display/avatar/avatar';
import { IconTile, type IconTileTone } from '../../components/data-display/icon-tile/icon-tile';

/** One row of an `EntityList`: a person, company, product or record. */
export interface EntityListItem {
  /** Unique, stable id. */
  id: string;
  /** Main text, e.g. a person's name. */
  title: ReactNode;
  /** Second line, e.g. job title or email. */
  subtitle?: ReactNode;
  /** Avatar image URL. */
  avatarSrc?: string;
  /** Initials for the avatar fallback. @default from `title` when it's a string */
  initials?: string;
  /** An icon instead of an avatar, shown in an `IconTile`. */
  icon?: ReactNode;
  /** Colour of the icon tile or initials avatar. */
  tone?: IconTileTone;
  /** Custom leading element, instead of avatar or icon. */
  leading?: ReactNode;
  /** Text at the end, e.g. a date, amount or status `Badge`. */
  meta?: ReactNode;
  /** A control at the very end, e.g. an icon button. */
  action?: ReactNode;
  /** Link target for the row. */
  href?: string;
}

export type EntityListSlot = 'root' | 'item' | 'leading' | 'title' | 'subtitle' | 'meta' | 'action' | 'empty';

export interface EntityListProps extends Omit<ComponentProps<'ul'>, 'children'> {
  /** The rows. */
  items: readonly EntityListItem[];
  /** Called when a row is clicked. Makes rows buttons (unless they have `href`). */
  onItemClick?: (item: EntityListItem) => void;
  /** Lines between rows. @default false */
  divided?: boolean;
  /** Row density. @default 'md' */
  density?: 'sm' | 'md';
  /** Shown when `items` is empty. @default 'Nothing to show.' */
  emptyText?: ReactNode;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<EntityListSlot>;
}

const initialsOf = (text: ReactNode) =>
  typeof text === 'string'
    ? text
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]!.toUpperCase())
        .join('')
    : '';

const avatarTone: Partial<Record<IconTileTone, string>> = {
  'chart-1': 'bg-chart-1/12 text-chart-1',
  'chart-2': 'bg-chart-2/12 text-chart-2',
  'chart-3': 'bg-chart-3/12 text-chart-3',
  'chart-4': 'bg-chart-4/15 text-chart-4',
  'chart-5': 'bg-chart-5/12 text-chart-5',
  'chart-6': 'bg-chart-6/12 text-chart-6',
  'chart-7': 'bg-chart-7/12 text-chart-7',
  'chart-8': 'bg-chart-8/12 text-chart-8',
  primary: 'bg-primary/10 text-primary',
};

/**
 * A compact list of people or records with an avatar, two lines of text and an optional value or
 * action at the end: upcoming birthdays, new joiners, top customers, recent orders.
 * Put it in a `WidgetCard` for a dashboard.
 *
 * @example
 * <WidgetCard title="Upcoming birthdays" viewAll={{ href: '/people/birthdays' }}>
 *   <EntityList items={people.map((p) => ({ id: p.id, title: p.name, subtitle: p.role, avatarSrc: p.photo, meta: format(p.birthday) }))} />
 * </WidgetCard>
 */
export const EntityList = forwardRef<HTMLUListElement, EntityListProps>(function EntityList(
  { className, items, onItemClick, divided = false, density = 'md', emptyText = 'Nothing to show.', classNames, ...props },
  ref,
) {
  if (items.length === 0) {
    return <p className={cn('py-6 text-center text-sm text-muted-foreground', classNames?.empty)}>{emptyText}</p>;
  }
  return (
    <ul
      ref={ref}
      data-slot="entity-list"
      className={cn('flex flex-col', divided ? 'divide-y divide-border' : 'gap-1', classNames?.root, className)}
      {...props}
    >
      {items.map((item) => {
        const leading =
          item.leading ??
          (item.icon ? (
            <IconTile tone={item.tone ?? 'primary'} size={density === 'sm' ? 'sm' : 'md'}>
              {item.icon}
            </IconTile>
          ) : (
            <Avatar size={density === 'sm' ? 'sm' : 'md'}>
              {item.avatarSrc && <AvatarImage src={item.avatarSrc} alt="" />}
              <AvatarFallback className={item.tone ? avatarTone[item.tone] : undefined}>
                {item.initials ?? initialsOf(item.title)}
              </AvatarFallback>
            </Avatar>
          ));
        const content = (
          <>
            <span data-slot="entity-list-leading" className={cn('flex shrink-0', classNames?.leading)}>
              {leading}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span data-slot="entity-list-title" className={cn('truncate text-sm font-medium', classNames?.title)}>
                {item.title}
              </span>
              {item.subtitle && (
                <span data-slot="entity-list-subtitle" className={cn('truncate text-xs text-muted-foreground', classNames?.subtitle)}>
                  {item.subtitle}
                </span>
              )}
            </span>
            {item.meta && (
              <span data-slot="entity-list-meta" className={cn('shrink-0 text-xs text-muted-foreground tabular-nums', classNames?.meta)}>
                {item.meta}
              </span>
            )}
          </>
        );
        const rowClass = cn(
          'flex min-w-0 flex-1 items-center gap-3 rounded-lg text-start outline-none',
          density === 'sm' ? 'py-1.5' : 'py-2',
          (item.href || onItemClick) && '-mx-2 cursor-pointer px-2 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
        );
        return (
          <li key={item.id} data-slot="entity-list-item" className={cn('flex items-center gap-2', classNames?.item)}>
            {item.href ? (
              <a href={item.href} className={rowClass} onClick={() => onItemClick?.(item)}>
                {content}
              </a>
            ) : onItemClick ? (
              <button type="button" className={rowClass} onClick={() => onItemClick(item)}>
                {content}
              </button>
            ) : (
              <div className={rowClass}>{content}</div>
            )}
            {item.action && (
              <span data-slot="entity-list-action" className={cn('flex shrink-0', classNames?.action)}>
                {item.action}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
});
