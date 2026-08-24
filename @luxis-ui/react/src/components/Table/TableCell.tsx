"use client";

import React from 'react';
import { buildCellClasses, buildDimensionStyle } from './_utils';
import type { TableCellProps } from './types';

/**
 * TableCell — renders a `<td>` element.
 *
 * Supports alignment, fixed/min/max widths, text truncation, numeric
 * formatting, and horizontal sticky positioning.
 *
 * @example
 * ```tsx
 * <TableCell align="right" numeric truncate maxWidth="200px">
 *   1,234.56
 * </TableCell>
 * ```
 *
 * @accessibility
 * - Renders a semantic `<td>` with correct `role="cell"` implied by table structure.
 * - When `truncate` is set the full content should also be provided via
 *   `title` so keyboard and pointer users can reveal it on hover/focus.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableCellInner<C extends React.ElementType = 'td'>(
  props: TableCellProps<C>,
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
    className = '',
    style,
    children,
    ...rest
  } = props;

  const Tag = (as ?? 'td') as React.ElementType;
  const resolvedAlign = align ?? (numeric ? 'right' : undefined);

  const classes = buildCellClasses({
    base: 'lxs-table-cell',
    align: resolvedAlign,
    numeric,
    truncate,
    stickyLeft,
    stickyRight,
    extra: className,
  });

  const inlineStyle: React.CSSProperties = {
    ...buildDimensionStyle(width, minWidth, maxWidth),
    ...style,
  };

  return (
    <Tag ref={ref} className={classes} style={inlineStyle} {...rest}>
      {children}
    </Tag>
  );
}

export const TableCell = React.forwardRef(TableCellInner) as unknown as <
  C extends React.ElementType = 'td',
>(
  props: TableCellProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(TableCell as React.FC).displayName = 'TableCell';

export default TableCell;
