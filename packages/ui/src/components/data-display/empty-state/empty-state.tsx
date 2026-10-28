import { forwardRef, type ComponentProps, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import type { SlotClassNames } from '../../../lib/slots';

/** Inner parts of an `EmptyState`, for `classNames`. */
export type EmptyStateSlot = 'icon' | 'title' | 'description' | 'actions';

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Illustration or icon shown above the title. */
  icon?: ReactNode;
  /** What's empty, e.g. "No invoices yet". */
  title: ReactNode;
  /** What the user can do about it. */
  description?: ReactNode;
  /** Primary and secondary actions, e.g. a "Create invoice" button. */
  actions?: ReactNode;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<EmptyStateSlot>;
}

/**
 * Placeholder for a list, table or page with no content yet, or no search results.
 * Explain why it's empty and offer the next step.
 *
 * @example
 * <EmptyState
 *   icon={<InboxIcon />}
 *   title="No invoices yet"
 *   description="Invoices you create will show up here."
 *   actions={<Button startIcon={<PlusIcon />}>Create invoice</Button>}
 * />
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    { className, icon, title, description, actions, classNames, children, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-slot="empty-state"
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border p-6 text-center sm:p-10',
          className,
        )}
        {...props}
      >
        {icon && (
          <div
            data-slot="empty-state-icon"
            className={cn(
              "flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-6",
              classNames?.icon,
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex max-w-sm flex-col gap-1.5">
          <h3
            data-slot="empty-state-title"
            className={cn('text-subheading font-semibold text-foreground', classNames?.title)}
          >
            {title}
          </h3>
          {description && (
            <p
              data-slot="empty-state-description"
              className={cn('text-sm text-muted-foreground', classNames?.description)}
            >
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div
            data-slot="empty-state-actions"
            className={cn('flex flex-wrap items-center justify-center gap-2', classNames?.actions)}
          >
            {actions}
          </div>
        )}
        {children}
      </div>
    );
  },
);
