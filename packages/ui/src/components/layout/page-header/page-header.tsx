import { forwardRef, type ComponentProps, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import type { SlotClassNames } from '../../../lib/slots';

/** Inner parts of a `PageHeader`, for `classNames`. */
export type PageHeaderSlot = 'title' | 'description' | 'actions';

export interface PageHeaderProps extends Omit<
  ComponentProps<'header'>,
  'title'
> {
  /** Page title. Rendered as the page's `<h1>`. */
  title: ReactNode;
  /** One-line summary under the title. */
  description?: ReactNode;
  /** Breadcrumb or back link above the title. */
  breadcrumb?: ReactNode;
  /** Page-level actions, e.g. "Export" and "New order". Primary action last. */
  actions?: ReactNode;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<PageHeaderSlot>;
}

/**
 * The top of an admin page: breadcrumb, title, description and actions.
 * Actions wrap under the title on small screens.
 *
 * @example
 * <PageHeader
 *   breadcrumb={<Breadcrumb>…</Breadcrumb>}
 *   title="Orders"
 *   description="Track and fulfil customer orders."
 *   actions={<><Button variant="outline">Export</Button><Button>New order</Button></>}
 * />
 */
export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(
  function PageHeader(
    { className, title, description, breadcrumb, actions, classNames, children, ...props },
    ref,
  ) {
    return (
      <header
        ref={ref}
        data-slot="page-header"
        className={cn('flex flex-col gap-3', className)}
        {...props}
      >
        {breadcrumb}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1
              data-slot="page-header-title"
              className={cn('text-heading font-semibold tracking-tight text-foreground', classNames?.title)}
            >
              {title}
            </h1>
            {description && (
              <p
                data-slot="page-header-description"
                className={cn('text-sm text-muted-foreground', classNames?.description)}
              >
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div
              data-slot="page-header-actions"
              className={cn('flex shrink-0 flex-wrap items-center gap-2', classNames?.actions)}
            >
              {actions}
            </div>
          )}
        </div>
        {children}
      </header>
    );
  },
);
