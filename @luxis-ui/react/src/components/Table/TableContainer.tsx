"use client";

import React from 'react';
import type { TableContainerProps } from './types';

/**
 * TableContainer — Wraps a `<Table>` to enable horizontal scrolling and/or
 * a fixed max-height for vertical scrolling.
 *
 * @example
 * ```tsx
 * <TableContainer scrollX maxHeight="400px">
 *   <Table>…</Table>
 * </TableContainer>
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableContainerInner<C extends React.ElementType = 'div'>(
  props: TableContainerProps<C>,
  ref: React.ForwardedRef<any>,
) {
  const {
    as,
    scrollX = true,
    maxHeight,
    className = '',
    style,
    children,
    ...rest
  } = props;

  const Tag = (as ?? 'div') as React.ElementType;

  const classes = [
    'lxs-table-container',
    scrollX && 'lxs-table-container--scroll-x',
    maxHeight !== undefined && 'lxs-table-container--max-height',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inlineStyle: React.CSSProperties = { ...style };
  if (maxHeight !== undefined) {
    inlineStyle.maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
  }

  return (
    <Tag ref={ref} className={classes} style={inlineStyle} {...rest}>
      {children}
    </Tag>
  );
}

export const TableContainer = React.forwardRef(TableContainerInner) as unknown as <
  C extends React.ElementType = 'div',
>(
  props: TableContainerProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(TableContainer as React.FC).displayName = 'TableContainer';

export default TableContainer;
