'use client';

import {
  forwardRef,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { cn } from '../../lib/cn';
import { ArrowDownIcon } from '../../lib/icons';
import { formatRelativeTime } from '../../lib/relative-time';
import { popupSurface } from '../../lib/styles';
import type { SlotClassNames } from '../../lib/slots';
import {
  IconTile,
  type IconTileTone,
} from '../../components/data-display/icon-tile/icon-tile';

/** One notification. */
export interface NotificationItem {
  /** Unique, stable id. */
  id: string;
  /** Headline, e.g. "Leave request approved". */
  title: ReactNode;
  /** Details, e.g. "Ramesh Kumar · 3 days casual leave". */
  description?: ReactNode;
  /** When it happened: a `Date` (shown as "2 min ago") or preformatted text. */
  time?: Date | string;
  /** Read notifications are shown without the dot and bold title. @default false */
  read?: boolean;
  /** Icon, shown in an `IconTile`. Ignored when `avatar` is set. */
  icon?: ReactNode;
  /** Icon tile colour. @default 'primary' */
  tone?: IconTileTone;
  /** An avatar instead of an icon, e.g. for "Priya commented". */
  avatar?: ReactNode;
  /** Link target. */
  href?: string;
}

export type NotificationListSlot =
  'root' | 'item' | 'title' | 'description' | 'time' | 'empty';

export interface NotificationListProps extends Omit<
  ComponentProps<'ul'>,
  'children'
> {
  /** The notifications, newest first. */
  items: readonly NotificationItem[];
  /** Called when a notification is clicked (e.g. to mark it read or navigate). */
  onItemClick?: (item: NotificationItem) => void;
  /** Shown when there are no notifications. @default "You're all caught up." */
  emptyText?: ReactNode;
  /** Locale for relative times. @default the browser's locale */
  locale?: string;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<NotificationListSlot>;
}

/**
 * A list of notifications with unread markers and relative times. Used inside `NotificationBell`,
 * and on its own on a notifications page or in a `WidgetCard`.
 *
 * @example
 * <NotificationList items={notifications} onItemClick={(n) => markRead(n.id)} />
 */
export const NotificationList = forwardRef<
  HTMLUListElement,
  NotificationListProps
>(function NotificationList(
  {
    className,
    items,
    onItemClick,
    emptyText = "You're all caught up.",
    locale,
    classNames,
    ...props
  },
  ref,
) {
  if (items.length === 0) {
    return (
      <p
        data-slot="notification-list-empty"
        className={cn(
          'py-8 text-center text-sm text-muted-foreground',
          classNames?.empty,
        )}
      >
        {emptyText}
      </p>
    );
  }
  return (
    <ul
      ref={ref}
      data-slot="notification-list"
      className={cn('flex flex-col', classNames?.root, className)}
      {...props}
    >
      {items.map((item) => {
        const unread = !item.read;
        const body = (
          <>
            {item.avatar ?? (
              <IconTile
                tone={item.tone ?? 'primary'}
                size="sm"
                className="size-9"
              >
                {item.icon}
              </IconTile>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                data-slot="notification-title"
                className={cn(
                  'text-sm',
                  unread ? 'font-semibold' : 'font-medium text-foreground/90',
                  classNames?.title,
                )}
              >
                {item.title}
              </span>
              {item.description && (
                <span
                  data-slot="notification-description"
                  className={cn(
                    'text-xs text-muted-foreground',
                    classNames?.description,
                  )}
                >
                  {item.description}
                </span>
              )}
              {item.time && (
                <span
                  data-slot="notification-time"
                  className={cn(
                    'text-xs text-muted-foreground',
                    classNames?.time,
                  )}
                >
                  {item.time instanceof Date ? (
                    <time dateTime={item.time.toISOString()}>
                      {formatRelativeTime(item.time, { locale })}
                    </time>
                  ) : (
                    item.time
                  )}
                </span>
              )}
            </span>
            {unread && (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
                <span className="sr-only">Unread</span>
              </span>
            )}
          </>
        );
        const itemClass = cn(
          'flex w-full items-start gap-3 rounded-lg p-2.5 text-start transition-colors outline-none',
          (item.href || onItemClick) &&
            'cursor-pointer hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
          unread && 'bg-primary/[0.03]',
          classNames?.item,
        );
        return (
          <li
            key={item.id}
            data-slot="notification-item"
            data-unread={unread ? '' : undefined}
          >
            {item.href ? (
              <a
                href={item.href}
                className={itemClass}
                onClick={() => onItemClick?.(item)}
              >
                {body}
              </a>
            ) : onItemClick ? (
              <button
                type="button"
                className={itemClass}
                onClick={() => onItemClick(item)}
              >
                {body}
              </button>
            ) : (
              <div className={itemClass}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
});

export type NotificationBellSlot =
  'trigger' | 'badge' | 'content' | 'header' | 'footer';

export interface NotificationBellProps {
  /** The notifications, newest first. */
  items: readonly NotificationItem[];
  /** Unread count on the bell. @default number of items without `read` */
  unreadCount?: number;
  /** Shows a "Mark all as read" button. */
  onMarkAllRead?: () => void;
  /** Called when a notification is clicked. */
  onItemClick?: (item: NotificationItem) => void;
  /** A "View all" link at the bottom. */
  viewAll?: { href?: string; onClick?: () => void; label?: ReactNode };
  /** Heading of the panel. @default 'Notifications' */
  title?: ReactNode;
  /** Shown when there are no notifications. */
  emptyText?: ReactNode;
  /** Locale for relative times. */
  locale?: string;
  /** Popup alignment against the bell. @default 'end' */
  align?: 'start' | 'center' | 'end';
  /** Bell icon. @default a bell */
  icon?: ReactNode;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<NotificationBellSlot>;
  /** Labels, for translation. */
  labels?: {
    trigger?: (unread: number) => string;
    markAllRead?: string;
    viewAll?: string;
  };
}

/**
 * A bell button with an unread count that opens the latest notifications. For the top bar.
 *
 * @example
 * <NotificationBell items={notifications} onMarkAllRead={markAllRead} viewAll={{ href: '/notifications' }} />
 */
export const NotificationBell = forwardRef<
  HTMLButtonElement,
  NotificationBellProps
>(function NotificationBell(
  {
    items,
    unreadCount,
    onMarkAllRead,
    onItemClick,
    viewAll,
    title = 'Notifications',
    emptyText,
    locale,
    align = 'end',
    icon,
    classNames,
    labels,
  },
  ref,
) {
  const unread = useMemo(
    () => unreadCount ?? items.filter((i) => !i.read).length,
    [items, unreadCount],
  );
  const triggerLabel =
    labels?.trigger?.(unread) ??
    (unread > 0 ? `Notifications, ${unread} unread` : 'Notifications');

  return (
    <BasePopover.Root>
      <BasePopover.Trigger
        ref={ref}
        aria-label={triggerLabel}
        data-slot="notification-bell"
        className={cn(
          'relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors outline-none',
          'hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring data-popup-open:bg-accent',
          "[&_svg:not([class*='size-'])]:size-5",
          classNames?.trigger,
        )}
      >
        {icon ?? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.268 21a2 2 0 0 0 3.464 0" />
            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
          </svg>
        )}
        {unread > 0 && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-semibold text-destructive-foreground tabular-nums ring-2 ring-background',
              classNames?.badge,
            )}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner className="z-50" align={align} sideOffset={6}>
          <BasePopover.Popup
            data-slot="notification-bell-content"
            className={cn(
              popupSurface,
              'flex max-h-[min(32rem,var(--available-height))] w-[min(24rem,calc(100vw-1rem))] flex-col',
              classNames?.content,
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between gap-2 border-b border-border px-4 py-3',
                classNames?.header,
              )}
            >
              <BasePopover.Title className="text-sm font-semibold">
                {title}
              </BasePopover.Title>
              {onMarkAllRead && unread > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="cursor-pointer text-xs font-medium text-primary hover:underline"
                >
                  {labels?.markAllRead ?? 'Mark all as read'}
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
              <NotificationList
                items={items}
                onItemClick={onItemClick}
                emptyText={emptyText}
                locale={locale}
              />
            </div>
            {viewAll && (
              <div
                className={cn(
                  'border-t border-border p-2 text-center',
                  classNames?.footer,
                )}
              >
                {viewAll.href ? (
                  <a
                    href={viewAll.href}
                    onClick={viewAll.onClick}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {viewAll.label ??
                      labels?.viewAll ??
                      'View all notifications'}
                    <ArrowDownIcon className="size-3.5 -rotate-90 rtl:rotate-90" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={viewAll.onClick}
                    className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {viewAll.label ??
                      labels?.viewAll ??
                      'View all notifications'}
                    <ArrowDownIcon className="size-3.5 -rotate-90 rtl:rotate-90" />
                  </button>
                )}
              </div>
            )}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
});
