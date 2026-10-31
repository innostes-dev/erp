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
  buttonVariants,
  type ButtonVariant,
} from '../../components/actions/button/button-variants';
import {
  IconTile,
  type IconTileTone,
} from '../../components/data-display/icon-tile/icon-tile';

/** The button of an `ActionListItem`. */
export interface ActionListAction {
  /** Button text, e.g. "Review". */
  label: ReactNode;
  /** Click handler. */
  onClick?: () => void;
  /** Link target. */
  href?: string;
  /** Your router's link, e.g. `<Link href="/approvals/12" />`. */
  render?: ReactElement<Record<string, unknown>>;
  /** Button style. @default 'secondary' */
  variant?: ButtonVariant;
}

/** One task in an `ActionList`. */
export interface ActionListItem {
  /** Unique, stable id. */
  id: string;
  /** The task, e.g. "Approve leave request". */
  title: ReactNode;
  /** Who or what it's about, e.g. "Suresh Reddy · 2 days". */
  description?: ReactNode;
  /** Icon, shown in an `IconTile`. */
  icon?: ReactNode;
  /** Icon tile colour. @default 'primary' */
  tone?: IconTileTone;
  /** The button at the end, or any element. */
  action?: ActionListAction | ReactNode;
}

export type ActionListSlot =
  'root' | 'item' | 'title' | 'description' | 'action' | 'empty';

export interface ActionListProps extends Omit<
  ComponentProps<'ul'>,
  'children'
> {
  /** The tasks. */
  items: readonly ActionListItem[];
  /** Lines between rows. @default false */
  divided?: boolean;
  /** Shown when there's nothing to do. @default "You're all caught up." */
  emptyText?: ReactNode;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<ActionListSlot>;
}

function isAction(value: unknown): value is ActionListAction {
  return (
    !!value &&
    typeof value === 'object' &&
    !isValidElement(value) &&
    'label' in value
  );
}

/**
 * A list of tasks waiting for the user, each with a button: approvals, reviews, onboarding steps.
 * Pair it with a `WidgetCard` and its `count` for a "Pending actions" widget.
 *
 * @example
 * <WidgetCard title="Pending actions" count={items.length}>
 *   <ActionList items={[{ id: '1', title: 'Approve leave request', description: 'Suresh Reddy · 2 days', icon: <CalendarIcon />, action: { label: 'Review', href: '/leave/1' } }]} />
 * </WidgetCard>
 */
export const ActionList = forwardRef<HTMLUListElement, ActionListProps>(
  function ActionList(
    {
      className,
      items,
      divided = false,
      emptyText = "You're all caught up.",
      classNames,
      ...props
    },
    ref,
  ) {
    if (items.length === 0) {
      return (
        <p
          className={cn(
            'py-6 text-center text-sm text-muted-foreground',
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
        data-slot="action-list"
        className={cn(
          'flex flex-col',
          divided ? 'divide-y divide-border' : 'gap-1',
          classNames?.root,
          className,
        )}
        {...props}
      >
        {items.map((item) => {
          let action: ReactNode = null;
          if (isAction(item.action)) {
            const a = item.action;
            const cls = cn(
              buttonVariants({ variant: a.variant ?? 'secondary', size: 'sm' }),
              classNames?.action,
            );
            action = a.render ? (
              cloneElement(
                a.render,
                { className: cls, onClick: a.onClick },
                a.label,
              )
            ) : a.href ? (
              <a href={a.href} onClick={a.onClick} className={cls}>
                {a.label}
              </a>
            ) : (
              <button type="button" onClick={a.onClick} className={cls}>
                {a.label}
              </button>
            );
          } else if (item.action) {
            action = item.action as ReactNode;
          }
          return (
            <li
              key={item.id}
              data-slot="action-list-item"
              className={cn('flex items-center gap-3 py-2', classNames?.item)}
            >
              {item.icon && (
                <IconTile
                  tone={item.tone ?? 'primary'}
                  size="sm"
                  className="size-9"
                >
                  {item.icon}
                </IconTile>
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  data-slot="action-list-title"
                  className={cn(
                    'truncate text-sm font-medium',
                    classNames?.title,
                  )}
                >
                  {item.title}
                </span>
                {item.description && (
                  <span
                    data-slot="action-list-description"
                    className={cn(
                      'truncate text-xs text-muted-foreground',
                      classNames?.description,
                    )}
                  >
                    {item.description}
                  </span>
                )}
              </span>
              {action && <span className="flex shrink-0">{action}</span>}
            </li>
          );
        })}
      </ul>
    );
  },
);
