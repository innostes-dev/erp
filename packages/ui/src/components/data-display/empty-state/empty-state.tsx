import { forwardRef, type ComponentProps, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Illustration or icon shown above the title. */
  icon?: ReactNode;
  /** What's empty, e.g. "No invoices yet". */
  title: ReactNode;
  /** What the user can do about it. */
  description?: ReactNode;
  /** Primary and secondary actions, e.g. a "Create invoice" button. */
  actions?: ReactNode;
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
    { className, icon, title, description, actions, children, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-slot="empty-state"
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border p-10 text-center',
          className,
        )}
        {...props}
      >
        {icon && (
          <div
            data-slot="empty-state-icon"
            className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-6"
          >
            {icon}
          </div>
        )}
        <div className="flex max-w-sm flex-col gap-1.5">
          <h3
            data-slot="empty-state-title"
            className="text-base font-semibold text-foreground"
          >
            {title}
          </h3>
          {description && (
            <p
              data-slot="empty-state-description"
              className="text-sm text-muted-foreground"
            >
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div
            data-slot="empty-state-actions"
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {actions}
          </div>
        )}
        {children}
      </div>
    );
  },
);
