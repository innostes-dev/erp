'use client';

import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from '../../../lib/icons';
import { buttonVariants } from '../../actions/button/button-variants';
import { getPaginationRange } from './use-pagination';

export interface PaginationProps extends Omit<
  ComponentProps<'nav'>,
  'onChange'
> {
  /** Current page, starting at 1. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Called with the new page number. */
  onPageChange: (page: number) => void;
  /**
   * Pages shown on each side of the current page.
   * @default 1
   */
  siblingCount?: number;
  /**
   * Pages always shown at the start and end.
   * @default 1
   */
  boundaryCount?: number;
  /**
   * Show "Previous"/"Next" text next to the arrows (hidden on small screens).
   * @default true
   */
  showLabels?: boolean;
  /**
   * Labels, for translation.
   * @default { previous: 'Previous', next: 'Next', page: (n) => `Page ${n}` }
   */
  labels?: {
    previous?: string;
    next?: string;
    page?: (page: number) => string;
  };
}

/**
 * Page navigation for tables and lists. Controlled: you own `page` and update it in
 * `onPageChange` (e.g. from the URL or a data-fetching hook).
 *
 * For custom layouts, use `getPaginationRange()` to compute the page items yourself.
 *
 * @example
 * const [page, setPage] = useState(1);
 * <Pagination page={page} pageCount={Math.ceil(total / pageSize)} onPageChange={setPage} />
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  function Pagination(
    {
      className,
      page,
      pageCount,
      onPageChange,
      siblingCount,
      boundaryCount,
      showLabels = true,
      labels,
      'aria-label': ariaLabel = 'Pagination',
      ...props
    },
    ref,
  ) {
    const items = getPaginationRange({
      page,
      pageCount,
      siblingCount,
      boundaryCount,
    });
    const previous = labels?.previous ?? 'Previous';
    const next = labels?.next ?? 'Next';
    const pageLabel = labels?.page ?? ((n: number) => `Page ${n}`);
    const isFirst = page <= 1;
    const isLast = page >= pageCount;

    const navButton = cn(
      buttonVariants({ variant: 'ghost', size: 'sm' }),
      'gap-1 px-2.5',
    );

    return (
      <nav
        ref={ref}
        data-slot="pagination"
        aria-label={ariaLabel}
        className={cn('flex w-full justify-center', className)}
        {...props}
      >
        <ul className="flex flex-row items-center gap-1">
          <li>
            <button
              type="button"
              className={navButton}
              onClick={() => onPageChange(page - 1)}
              disabled={isFirst}
              data-disabled={isFirst ? '' : undefined}
              aria-label={previous}
            >
              <ChevronLeftIcon className="rtl:rotate-180" />
              {showLabels && (
                <span className="hidden sm:inline">{previous}</span>
              )}
            </button>
          </li>
          {items.map((item) =>
            typeof item === 'number' ? (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPageChange(item)}
                  aria-label={pageLabel(item)}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    buttonVariants({
                      variant: item === page ? 'outline' : 'ghost',
                      size: 'sm',
                      iconOnly: true,
                    }),
                    'tabular-nums',
                  )}
                >
                  {item}
                </button>
              </li>
            ) : (
              <li
                key={item}
                aria-hidden="true"
                className="flex size-8 items-center justify-center text-muted-foreground"
              >
                <MoreHorizontalIcon className="size-4" />
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              className={navButton}
              onClick={() => onPageChange(page + 1)}
              disabled={isLast}
              data-disabled={isLast ? '' : undefined}
              aria-label={next}
            >
              {showLabels && <span className="hidden sm:inline">{next}</span>}
              <ChevronRightIcon className="rtl:rotate-180" />
            </button>
          </li>
        </ul>
      </nav>
    );
  },
);
