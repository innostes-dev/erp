'use client';

import { forwardRef, useMemo, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { isSameDay, startOfDay, addDays } from '../../lib/date';
import { formatRelativeTime } from '../../lib/relative-time';
import type { SlotClassNames } from '../../lib/slots';
import { IconTile, type IconTileTone } from '../../components/data-display/icon-tile/icon-tile';

/** One event in an `ActivityFeed`. */
export interface ActivityItem {
  /** Unique, stable id. */
  id: string;
  /** What happened, e.g. "New employee joined". */
  title: ReactNode;
  /** Details, e.g. "Kavya Reddy joined as Software Engineer". */
  description?: ReactNode;
  /** When: a `Date` (shown as "2 min ago" and used for day groups) or preformatted text. */
  time?: Date | string;
  /** Icon, shown in an `IconTile`. */
  icon?: ReactNode;
  /** Icon tile colour. @default 'primary' */
  tone?: IconTileTone;
  /** Custom leading element, e.g. the actor's avatar. Replaces the icon. */
  leading?: ReactNode;
  /** Extra content under the description, e.g. a quoted comment or attachment. */
  extra?: ReactNode;
}

export type ActivityFeedSlot = 'root' | 'group' | 'groupLabel' | 'item' | 'title' | 'description' | 'time' | 'empty';

export interface ActivityFeedProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The events, newest first. */
  items: readonly ActivityItem[];
  /**
   * `list`: compact rows. `timeline`: icons joined by a vertical line, for audit trails and
   * record history.
   * @default 'list'
   */
  variant?: 'list' | 'timeline';
  /** Group events under "Today", "Yesterday" and dates. Needs `Date` times. @default false */
  groupByDay?: boolean;
  /** Locale for relative times and day labels. */
  locale?: string;
  /** Labels for day groups, for translation. @default { today: 'Today', yesterday: 'Yesterday' } */
  labels?: { today?: string; yesterday?: string };
  /** Shown when there are no events. @default 'No activity yet.' */
  emptyText?: ReactNode;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<ActivityFeedSlot>;
}

/**
 * A chronological list of events: recent activity on a dashboard, an audit log, or the history
 * of a record. Relative times update with the user's locale.
 *
 * @example
 * <ActivityFeed items={events} variant="timeline" groupByDay />
 */
export const ActivityFeed = forwardRef<HTMLDivElement, ActivityFeedProps>(function ActivityFeed(
  {
    className,
    items,
    variant = 'list',
    groupByDay = false,
    locale,
    labels,
    emptyText = 'No activity yet.',
    classNames,
    ...props
  },
  ref,
) {
  const groups = useMemo(() => {
    if (!groupByDay) return [{ key: 'all', label: null as string | null, items }];
    const today = startOfDay(new Date());
    const yesterday = addDays(today, -1);
    const dayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' });
    const map = new Map<string, { key: string; label: string | null; items: ActivityItem[] }>();
    for (const item of items) {
      const date = item.time instanceof Date ? item.time : null;
      const key = date ? startOfDay(date).toISOString() : 'other';
      const label = !date
        ? null
        : isSameDay(date, today)
          ? (labels?.today ?? 'Today')
          : isSameDay(date, yesterday)
            ? (labels?.yesterday ?? 'Yesterday')
            : dayFormat.format(date);
      if (!map.has(key)) map.set(key, { key, label, items: [] });
      map.get(key)!.items.push(item);
    }
    return [...map.values()];
  }, [items, groupByDay, locale, labels]);

  if (items.length === 0) {
    return (
      <p data-slot="activity-feed-empty" className={cn('py-6 text-center text-sm text-muted-foreground', classNames?.empty)}>
        {emptyText}
      </p>
    );
  }

  const timeline = variant === 'timeline';

  return (
    <div ref={ref} data-slot="activity-feed" data-variant={variant} className={cn('flex flex-col gap-4', classNames?.root, className)} {...props}>
      {groups.map((group) => (
        <section key={group.key} data-slot="activity-feed-group" className={cn('flex flex-col gap-1', classNames?.group)}>
          {group.label && (
            <h3 data-slot="activity-feed-group-label" className={cn('pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase', classNames?.groupLabel)}>
              {group.label}
            </h3>
          )}
          <ol className="flex flex-col">
            {group.items.map((item, index) => {
              const isLast = index === group.items.length - 1;
              return (
                <li
                  key={item.id}
                  data-slot="activity-feed-item"
                  className={cn('relative flex gap-3', timeline ? 'pb-5 last:pb-0' : 'py-2', classNames?.item)}
                >
                  {timeline && !isLast && (
                    <span aria-hidden="true" className="absolute start-[calc(1.125rem-1px)] top-10 bottom-1 w-0.5 rounded-full bg-border" />
                  )}
                  <span className="relative flex shrink-0">
                    {item.leading ?? (
                      <IconTile tone={item.tone ?? 'primary'} size="sm" shape={timeline ? 'circle' : 'square'} className="size-9">
                        {item.icon}
                      </IconTile>
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <span data-slot="activity-feed-title" className={cn('text-sm font-medium', classNames?.title)}>
                        {item.title}
                      </span>
                      {item.time && (
                        <span data-slot="activity-feed-time" className={cn('shrink-0 text-xs text-muted-foreground', classNames?.time)}>
                          {item.time instanceof Date ? (
                            <time dateTime={item.time.toISOString()}>{formatRelativeTime(item.time, { locale })}</time>
                          ) : (
                            item.time
                          )}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <span data-slot="activity-feed-description" className={cn('text-xs text-muted-foreground', classNames?.description)}>
                        {item.description}
                      </span>
                    )}
                    {item.extra && <div className="mt-1.5">{item.extra}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
});
