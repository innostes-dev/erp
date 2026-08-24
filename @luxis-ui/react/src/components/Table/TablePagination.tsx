"use client";

import React, { useMemo, useCallback } from 'react';
import type { TablePaginationProps } from './types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Build a compact page window: [1, …, 4, 5, 6, …, 20] */
function buildPageWindow(
  current: number,
  total: number,
  delta = 2,
): (number | '…')[] {
  if (total <= 1) return [1];
  const range: (number | '…')[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push('…');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('…');
  if (total > 1) range.push(total);

  return range;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

/**
 * TablePagination — standalone pagination control to pair with a `<Table>`.
 *
 * Handles both controlled (page / pageSize) and callback-based usage.
 * Renders fully accessible navigation buttons with proper `aria-label`s.
 *
 * @example
 * ```tsx
 * const [page, setPage] = useState(0);
 * const [pageSize, setPageSize] = useState(10);
 *
 * <TablePagination
 *   totalRows={data.length}
 *   page={page}
 *   pageSize={pageSize}
 *   onPageChange={setPage}
 *   onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
 * />
 * ```
 *
 * @accessibility
 * - The outer `<nav>` has `aria-label="Table pagination"`.
 * - Each page button has a descriptive `aria-label`.
 * - Current page button has `aria-current="page"`.
 * - Prev/Next buttons have `aria-disabled` in addition to `disabled`.
 */
export const TablePagination = React.memo<TablePaginationProps>(
  function TablePagination({
    totalRows,
    page,
    pageSize,
    pageSizeOptions = [10, 25, 50, 100],
    onPageChange,
    onPageSizeChange,
    showPageSizeSelector = true,
    showRowCount = true,
    className = '',
    style,
  }) {
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

    // Row-count summary: "1–10 of 247"
    const rowCountLabel = useMemo(() => {
      if (totalRows === 0) return '0 rows';
      const from = page * pageSize + 1;
      const to = Math.min((page + 1) * pageSize, totalRows);
      return `${from}–${to} of ${totalRows}`;
    }, [page, pageSize, totalRows]);

    const pageWindow = useMemo(
      () => buildPageWindow(page + 1, totalPages),
      [page, totalPages],
    );

    const handlePageChange = useCallback(
      (p: number) => {
        if (p < 0 || p >= totalPages) return;
        onPageChange(p);
      },
      [onPageChange, totalPages],
    );

    const handlePageSizeChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onPageSizeChange?.(Number(e.target.value));
      },
      [onPageSizeChange],
    );

    const classes = ['lxs-table-pagination', className]
      .filter(Boolean)
      .join(' ');

    return (
      <nav
        className={classes}
        style={style}
        aria-label="Table pagination"
        role="navigation"
      >
        {/* Left side: row count + page-size selector */}
        <div className="lxs-table-pagination__info">
          {showRowCount && (
            <span aria-live="polite" aria-atomic="true">
              {rowCountLabel}
            </span>
          )}
          {showPageSizeSelector && onPageSizeChange && (
            <label className="lxs-table-pagination__page-size">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                aria-label="Rows per page"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Right side: page buttons */}
        <div className="lxs-table-pagination__controls" aria-label="Page navigation">
          {/* Previous */}
          <button
            type="button"
            className="lxs-table-pagination__btn"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            aria-disabled={page === 0}
            aria-label="Previous page"
          >
            ‹
          </button>

          {/* Page numbers */}
          {pageWindow.map((entry, idx) =>
            entry === '…' ? (
              <span
                key={`ellipsis-before-${typeof pageWindow[idx + 1] === 'number' ? pageWindow[idx + 1] : idx}`}
                className="lxs-table-pagination__btn"
                aria-hidden="true"
                style={{ border: 'none', cursor: 'default', opacity: 0.5 }}
              >
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                className={[
                  'lxs-table-pagination__btn',
                  entry === page + 1 && 'lxs-table-pagination__btn--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handlePageChange(Number(entry) - 1)}
                aria-label={`Page ${entry}`}
                aria-current={entry === page + 1 ? 'page' : undefined}
              >
                {entry}
              </button>
            ),
          )}

          {/* Next */}
          <button
            type="button"
            className="lxs-table-pagination__btn"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages - 1}
            aria-disabled={page >= totalPages - 1}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </nav>
    );
  },
);

TablePagination.displayName = 'TablePagination';

export default TablePagination;
