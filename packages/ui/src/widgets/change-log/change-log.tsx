'use client';

import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { ArrowRightIcon } from '../../lib/icons';
import type { SlotClassNames } from '../../lib/slots';
import type { IconTileTone } from '../../components/data-display/icon-tile/icon-tile';
import {
  ActivityFeed,
  type ActivityFeedProps,
} from '../activity-feed/activity-feed';

/** One changed field in a `ChangeLogEntry`. */
export interface FieldChange {
  /** Field name, e.g. "Status". */
  field: ReactNode;
  /** Old value. Omit or `null` when the field was empty. */
  from?: ReactNode;
  /** New value. Omit or `null` when the field was cleared. */
  to?: ReactNode;
}

/** One revision of a record in a `ChangeLog`. */
export interface ChangeLogEntry {
  /** Unique, stable id. */
  id: string;
  /** Who made the change, e.g. "Priya Shah". Shown in bold before `action`. */
  actor?: ReactNode;
  /** What they did, e.g. "updated the invoice". */
  action: ReactNode;
  /** When: a `Date` (shown as "2 min ago") or preformatted text. */
  time?: Date | string;
  /** The field-level changes. */
  changes?: readonly FieldChange[];
  /** A comment or reason, e.g. "Customer asked for a later date". */
  note?: ReactNode;
  /** The actor's avatar. Replaces the icon. */
  avatar?: ReactNode;
  /** Icon when there's no avatar. */
  icon?: ReactNode;
  /** Icon tile colour. @default 'neutral' */
  tone?: IconTileTone;
}

export type ChangeLogSlot = 'changes' | 'field' | 'from' | 'to' | 'note';

export interface ChangeLogProps extends Omit<
  ActivityFeedProps,
  'items' | 'variant' | 'classNames'
> {
  /** The revisions, newest first. */
  entries: readonly ChangeLogEntry[];
  /** Shown for an empty old or new value. @default '—' */
  emptyValue?: ReactNode;
  /** Labels for screen readers, for translation. @default { from: 'from', to: 'to' } */
  diffLabels?: { from?: string; to?: string };
  /** Classes for the diff parts. Use `ActivityFeed` slots via `className` on the root. */
  classNames?: SlotClassNames<ChangeLogSlot>;
}

/**
 * The audit trail of one record: who changed which fields, from what to what, and when. Use
 * it on the detail page of an invoice, employee or order. For a general event stream, use
 * `ActivityFeed`.
 *
 * @example
 * <ChangeLog
 *   groupByDay
 *   entries={[{
 *     id: '1',
 *     actor: 'Priya Shah',
 *     action: 'updated the invoice',
 *     time: new Date(),
 *     changes: [
 *       { field: 'Status', from: 'Draft', to: 'Sent' },
 *       { field: 'Due date', from: '1 Nov', to: '15 Nov' },
 *     ],
 *   }]}
 * />
 */
export const ChangeLog = forwardRef<HTMLDivElement, ChangeLogProps>(
  function ChangeLog(
    {
      entries,
      emptyValue = '—',
      diffLabels,
      classNames,
      emptyText = 'No changes yet.',
      ...props
    },
    ref,
  ) {
    const show = (v: ReactNode) =>
      v === undefined || v === null || v === '' ? emptyValue : v;

    return (
      <ActivityFeed
        ref={ref as any}
        variant="timeline"
        emptyText={emptyText}
        data-slot="change-log"
        {...props}
        items={entries.map((entry) => ({
          id: entry.id,
          time: entry.time,
          icon: entry.icon,
          tone: entry.tone ?? 'neutral',
          leading: entry.avatar,
          title: (
            <span className="font-normal">
              {entry.actor && (
                <span className="font-semibold">{entry.actor} </span>
              )}
              {entry.action}
            </span>
          ),
          extra:
            entry.changes?.length || entry.note ? (
              <div className="flex flex-col gap-2">
                {entry.changes && entry.changes.length > 0 && (
                  <dl
                    data-slot="change-log-changes"
                    className={cn(
                      'grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs',
                      classNames?.changes,
                    )}
                  >
                    {entry.changes.map((change, i) => (
                      <div
                        key={i}
                        className="col-span-2 grid grid-cols-subgrid items-baseline"
                      >
                        <dt
                          data-slot="change-log-field"
                          className={cn(
                            'font-medium text-muted-foreground',
                            classNames?.field,
                          )}
                        >
                          {change.field}
                        </dt>
                        <dd className="m-0 flex min-w-0 flex-wrap items-center gap-1.5">
                          <del
                            data-slot="change-log-from"
                            className={cn(
                              'text-muted-foreground line-through decoration-destructive/60 break-words',
                              classNames?.from,
                            )}
                          >
                            <span className="sr-only">
                              {diffLabels?.from ?? 'from'}{' '}
                            </span>
                            {show(change.from)}
                          </del>
                          <ArrowRightIcon className="size-3 shrink-0 text-muted-foreground rtl:rotate-180" />
                          <ins
                            data-slot="change-log-to"
                            className={cn(
                              'font-medium text-foreground no-underline break-words',
                              classNames?.to,
                            )}
                          >
                            <span className="sr-only">
                              {diffLabels?.to ?? 'to'}{' '}
                            </span>
                            {show(change.to)}
                          </ins>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {entry.note && (
                  <blockquote
                    data-slot="change-log-note"
                    className={cn(
                      'm-0 border-s-2 border-border ps-3 text-xs text-muted-foreground italic',
                      classNames?.note,
                    )}
                  >
                    {entry.note}
                  </blockquote>
                )}
              </div>
            ) : undefined,
        }))}
      />
    );
  },
);
