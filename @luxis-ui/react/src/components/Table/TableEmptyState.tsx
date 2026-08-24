"use client";

import React from 'react';
import type { TableEmptyStateProps } from './types';

// ─────────────────────────────────────────────
// Default icons
// ─────────────────────────────────────────────

const EmptyIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4" y="4" width="40" height="40" rx="6" stroke="currentColor" strokeWidth="2" />
    <path d="M12 16h24M12 24h16M12 32h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ErrorIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
    <path d="M24 14v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="24" cy="33" r="1.5" fill="currentColor" />
  </svg>
);

const LoadingIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ animation: 'lxs-table-spin 0.8s linear infinite' }}
  >
    <circle
      cx="20"
      cy="20"
      r="16"
      stroke="currentColor"
      strokeWidth="3"
      strokeOpacity="0.2"
    />
    <path
      d="M20 4A16 16 0 0 1 36 20"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <style>{`@keyframes lxs-table-spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

/**
 * TableEmptyState — renders a full-width row spanning all columns to display
 * empty, error, or loading messages inside a table body.
 *
 * @example
 * ```tsx
 * <TableBody>
 *   {rows.length === 0 && (
 *     <TableEmptyState
 *       colSpan={columns.length}
 *       message="No records found"
 *       description="Try adjusting your filters."
 *     />
 *   )}
 * </TableBody>
 * ```
 *
 * @accessibility
 * - Lives inside a `<tr>` → `<td>` structure so the table remains valid HTML.
 * - The wrapping `<tr>` has `role="row"` and the inner `<td>` has `role="cell"`
 *   (both implicit from elements).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableEmptyStateInner<C extends React.ElementType = 'tr'>(
  props: TableEmptyStateProps<C>,
  ref: React.ForwardedRef<any>,
) {
  const {
    as,
    colSpan,
    message = 'No data available',
    description,
    icon,
    type = 'empty',
    className = '',
    style,
    ...rest
  } = props;

  const Tag = (as ?? 'tr') as React.ElementType;

  const trClasses = ['lxs-table-row', className].filter(Boolean).join(' ');
  const tdClasses = [
    'lxs-table-cell',
    'lxs-table-empty-state',
    `lxs-table-empty-state--${type}`,
  ].join(' ');

  let defaultIcon: React.ReactNode;
  if (icon !== undefined) {
    defaultIcon = icon;
  } else if (type === 'error') {
    defaultIcon = React.createElement(ErrorIcon);
  } else if (type === 'loading') {
    defaultIcon = React.createElement(LoadingIcon);
  } else {
    defaultIcon = React.createElement(EmptyIcon);
  }

  return (
    <Tag ref={ref} className={trClasses} style={style} {...rest}>
      <td
        className={tdClasses}
        colSpan={colSpan}
        aria-live={type === 'loading' ? 'polite' : undefined}
        aria-busy={type === 'loading' || undefined}
      >
        <div className="lxs-table-empty-state__inner">
          <span className="lxs-table-empty-state__icon" aria-hidden="true">
            {defaultIcon}
          </span>
          <p className="lxs-table-empty-state__message">
            {message}
          </p>
          {description && (
            <p className="lxs-table-empty-state__description">{description}</p>
          )}
        </div>
      </td>
    </Tag>
  );
}

export const TableEmptyState = React.forwardRef(TableEmptyStateInner) as unknown as <
  C extends React.ElementType = 'tr',
>(
  props: TableEmptyStateProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(TableEmptyState as React.FC).displayName = 'TableEmptyState';

export default TableEmptyState;
