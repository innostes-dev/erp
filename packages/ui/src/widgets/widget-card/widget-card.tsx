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
import { ArrowDownIcon, CircleAlertIcon, InboxIcon } from '../../lib/icons';
import { useId } from '../../lib/use-id';
import { Skeleton } from '../../components/feedback/skeleton/skeleton';

/** "View all" link in the header of a `WidgetCard`. */
export interface WidgetCardViewAll {
  /** Link target. */
  href?: string;
  /** Click handler, when it isn't a plain link. */
  onClick?: () => void;
  /** Render your router's link, e.g. `<Link href="/orders" />`. Our props are merged in. */
  render?: ReactElement<Record<string, unknown>>;
  /** Label, for translation. @default 'View all' */
  label?: ReactNode;
}

/** Inner parts of a `WidgetCard`, for `classNames`. */
export type WidgetCardSlot = 'header' | 'title' | 'description' | 'count' | 'actions' | 'body' | 'footer';

export interface WidgetCardProps extends Omit<
  ComponentProps<'section'>,
  'title'
> {
  /** The widget's heading. */
  title: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  /** Icon before the title, e.g. an `IconTile`. */
  icon?: ReactNode;
  /** A count shown as a badge next to the title, e.g. the number of pending items. */
  count?: number;
  /** Colour of the count badge. @default 'destructive' */
  countTone?: 'destructive' | 'primary' | 'neutral';
  /** Controls at the end of the header, e.g. a period `Select` or a `DropdownMenu`. */
  actions?: ReactNode;
  /** Shows a "View all →" link at the end of the header. */
  viewAll?: WidgetCardViewAll;
  /** Content below the body, e.g. a summary or a link. */
  footer?: ReactNode;
  /** Show skeleton rows instead of the content. */
  loading?: boolean;
  /** Number of skeleton rows while loading. @default 4 */
  loadingRows?: number;
  /** Show an error instead of the content. `true` shows a default message. */
  error?: ReactNode | boolean;
  /** Shows a "Try again" button with the error. */
  onRetry?: () => void;
  /** Show the empty state instead of the content. */
  empty?: boolean;
  /** What to show when `empty`. @default "Nothing here yet." */
  emptyState?: ReactNode;
  /**
   * Body padding. `none` lets tables and charts reach the card edges.
   * @default 'default'
   */
  padding?: 'default' | 'none';
  /** Heading level of the title, to fit the page outline. @default 2 */
  headingLevel?: 2 | 3 | 4;
  /** Classes for inner parts. Each part also has a `data-slot` (e.g. `widget-card-header`). */
  classNames?: SlotClassNames<WidgetCardSlot>;
}

/**
 * The frame for dashboard widgets: header with title, count, actions and "View all", a body,
 * and built-in loading, empty and error states. Every widget in innostes UI uses it, and you
 * can build your own widgets on it.
 *
 * Renders a `<section>` labelled by its title, so screen-reader users can jump between widgets.
 *
 * @example
 * <WidgetCard
 *   title="Pending actions"
 *   count={5}
 *   viewAll={{ href: '/approvals' }}
 *   loading={isLoading}
 *   empty={items.length === 0}
 * >
 *   <ActionList items={items} />
 * </WidgetCard>
 */
export const WidgetCard = forwardRef<HTMLElement, WidgetCardProps>(
  function WidgetCard(
    {
      className,
      title,
      description,
      icon,
      count,
      countTone = 'destructive',
      actions,
      viewAll,
      footer,
      loading = false,
      loadingRows = 4,
      error,
      onRetry,
      empty = false,
      emptyState,
      padding = 'default',
      headingLevel = 2,
      classNames,
      children,
      ...props
    },
    ref,
  ) {
    const titleId = useId();
    const Heading = `h${headingLevel}` as 'h2';
    const viewAllLabel = viewAll?.label ?? 'View all';
    const linkClass =
      'inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring';
    const viewAllContent = (
      <>
        {viewAllLabel}
        <ArrowDownIcon className="size-3.5 -rotate-90 rtl:rotate-90" />
      </>
    );

    let body: ReactNode = children;
    if (loading) {
      body = (
        <div aria-hidden="true" className="flex flex-col gap-4">
          {Array.from({ length: loadingRows }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      );
    } else if (error) {
      body = (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 py-8 text-center"
        >
          <CircleAlertIcon className="size-6 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {error === true ? "Couldn't load this widget." : error}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="h-8 cursor-pointer rounded-md border border-input px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              Try again
            </button>
          )}
        </div>
      );
    } else if (empty) {
      body = emptyState ?? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
          <InboxIcon className="size-6" />
          Nothing here yet.
        </div>
      );
    }

    return (
      <section
        ref={ref}
        data-slot="widget-card"
        aria-labelledby={titleId}
        aria-busy={loading || undefined}
        className={cn(
          'flex min-w-0 flex-col rounded-xl border border-border bg-card text-card-foreground shadow-xs',
          className,
        )}
        {...props}
      >
        <header
          data-slot="widget-card-header"
          className={cn('flex flex-wrap items-start gap-x-3 gap-y-2 px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4', classNames?.header)}
        >
          {icon && <span className="flex shrink-0">{icon}</span>}
          <div className="flex min-w-[min(12rem,100%)] flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Heading
                id={titleId}
                data-slot="widget-card-title"
                className={cn('truncate text-subheading font-semibold', classNames?.title)}
              >
                {title}
              </Heading>
              {count !== undefined && count > 0 && (
                <span
                  data-slot="widget-card-count"
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
                    countTone === 'destructive' &&
                      'bg-destructive text-destructive-foreground',
                    countTone === 'primary' &&
                      'bg-primary text-primary-foreground',
                    countTone === 'neutral' && 'bg-muted text-muted-foreground',
                    classNames?.count,
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
            {description && (
              <p
                data-slot="widget-card-description"
                className={cn('text-sm text-muted-foreground', classNames?.description)}
              >
                {description}
              </p>
            )}
          </div>
          {(actions || viewAll) && (
            <div
              data-slot="widget-card-actions"
              className={cn('flex shrink-0 flex-wrap items-center gap-2', classNames?.actions)}
            >
              {actions}
              {viewAll &&
                (viewAll.render && isValidElement(viewAll.render) ? (
                  cloneElement(
                    viewAll.render,
                    { className: linkClass, onClick: viewAll.onClick },
                    viewAllContent,
                  )
                ) : viewAll.href ? (
                  <a
                    href={viewAll.href}
                    onClick={viewAll.onClick}
                    className={linkClass}
                  >
                    {viewAllContent}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={viewAll.onClick}
                    className={cn(linkClass, 'cursor-pointer')}
                  >
                    {viewAllContent}
                  </button>
                ))}
            </div>
          )}
        </header>
        <div
          data-slot="widget-card-body"
          className={cn(
            'min-w-0 flex-1',
            padding === 'default' ? 'px-4 pb-4 sm:px-5 sm:pb-5' : 'pb-1',
            classNames?.body,
          )}
        >
          {body}
        </div>
        {footer && (
          <footer
            data-slot="widget-card-footer"
            className={cn('border-t border-border px-4 py-3 text-sm text-muted-foreground sm:px-5', classNames?.footer)}
          >
            {footer}
          </footer>
        )}
      </section>
    );
  },
);
