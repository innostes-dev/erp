"use client";

import React, { useCallback, useId } from 'react';
import { buildCellClasses, buildDimensionStyle } from './_utils';
import type { TableHeaderCellProps, SortDirection } from './types';

// ─────────────────────────────────────────────
// Sort icon
// ─────────────────────────────────────────────

/** Minimal inline SVG sort arrow — no external icon dependency */
const SortIcon: React.FC<{ direction: SortDirection }> = ({ direction }) => (
  <svg
    className="lxs-table-header-cell__sort-icon"
    aria-hidden="true"
    focusable="false"
    width="10"
    height="14"
    viewBox="0 0 10 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 1L1.5 5H8.5L5 1Z" fill="currentColor" opacity={direction === 'asc' ? 1 : 0.3} />
    <path d="M5 13L8.5 9H1.5L5 13Z" fill="currentColor" opacity={direction === 'desc' ? 1 : 0.3} />
  </svg>
);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function resolveAriaSort(
  sortDirection: SortDirection,
  sortable: boolean,
): 'ascending' | 'descending' | 'none' | undefined {
  if (sortDirection === 'asc') { return 'ascending'; }
  if (sortDirection === 'desc') { return 'descending'; }
  if (sortable) { return 'none'; }
  return undefined;
}

function buildHeaderClasses(opts: {
  align?: string;
  numeric: boolean;
  truncate: boolean;
  stickyLeft: boolean;
  stickyRight: boolean;
  sortable: boolean;
  isSorted: boolean;
  sortDesc: boolean;
  className: string;
}): string {
  const sortClasses = [
    opts.sortable ? 'lxs-table-header-cell--sortable' : '',
    opts.isSorted ? 'lxs-table-header-cell--sorted' : '',
    opts.sortDesc ? 'lxs-table-header-cell--sort-desc' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return buildCellClasses({
    base: 'lxs-table-header-cell',
    align: opts.align,
    numeric: opts.numeric,
    truncate: opts.truncate,
    stickyLeft: opts.stickyLeft,
    stickyRight: opts.stickyRight,
    extra: [sortClasses, opts.className].filter(Boolean).join(' '),
  });
}

// ─────────────────────────────────────────────
// Sortable content wrapper
// ─────────────────────────────────────────────

interface SortButtonProps {
  labelId: string;
  onSort: () => void;
  direction: SortDirection;
  children: React.ReactNode;
}

const SortButton: React.FC<SortButtonProps> = ({ labelId, onSort, direction, children }) => (
  <button
    type="button"
    className="lxs-table-header-cell__sort-btn"
    onClick={onSort}
    aria-labelledby={labelId}
    tabIndex={0}
  >
    <span id={labelId}>{children}</span>
    <SortIcon direction={direction} />
  </button>
);

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

/**
 * TableHeaderCell — renders a `<th>` element.
 *
 * Supports column sorting with proper `aria-sort` attributes and
 * keyboard-accessible sort toggle button.
 *
 * @example
 * ```tsx
 * <TableHeaderCell
 *   sortable
 *   sortDirection="asc"
 *   onSort={(dir) => setSortDir(dir)}
 * >
 *   Name
 * </TableHeaderCell>
 * ```
 *
 * @accessibility
 * - Sets `aria-sort` to "ascending", "descending", or "none".
 * - The sort trigger is a `<button>` inside the `<th>` for correct
 *   keyboard focus/tab behaviour.
 * - `scope="col"` is set by default.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableHeaderCellInner<C extends React.ElementType = 'th'>(
  props: TableHeaderCellProps<C>,
  ref: React.ForwardedRef<any>,
) {
  const {
    as,
    align,
    width,
    minWidth,
    maxWidth,
    truncate = false,
    numeric = false,
    stickyLeft = false,
    stickyRight = false,
    sortDirection = 'none',
    sortable = false,
    onSort,
    scope = 'col',
    className = '',
    style,
    children,
    ...rest
  } = props;

  const labelId = useId();
  const Tag = (as ?? 'th') as React.ElementType;

  const isSorted = sortDirection === 'asc' || sortDirection === 'desc';
  const resolvedAlign = align ?? (numeric ? 'right' : undefined);

  const classes = buildHeaderClasses({
    align: resolvedAlign,
    numeric,
    truncate,
    stickyLeft,
    stickyRight,
    sortable,
    isSorted,
    sortDesc: sortDirection === 'desc',
    className,
  });

  const inlineStyle: React.CSSProperties = {
    ...buildDimensionStyle(width, minWidth, maxWidth),
    ...style,
  };

  const handleSort = useCallback(() => {
    if (!sortable || !onSort) { return; }
    let next: SortDirection = 'asc';
    if (sortDirection === 'asc') { next = 'desc'; }
    onSort(next);
  }, [sortable, onSort, sortDirection]);

  const ariaSort = resolveAriaSort(sortDirection, sortable);

  return (
    <Tag
      ref={ref}
      scope={scope}
      aria-sort={ariaSort}
      className={classes}
      style={inlineStyle}
      {...rest}
    >
      {sortable
        ? <SortButton labelId={labelId} onSort={handleSort} direction={sortDirection}>{children}</SortButton>
        : children}
    </Tag>
  );
}

export const TableHeaderCell = React.forwardRef(TableHeaderCellInner) as unknown as <
  C extends React.ElementType = 'th',
>(
  props: TableHeaderCellProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(TableHeaderCell as React.FC).displayName = 'TableHeaderCell';

export default TableHeaderCell;
