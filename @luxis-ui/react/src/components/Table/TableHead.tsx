"use client";

import React from 'react';
import { useTableContext } from './context';
import type { TableHeadProps } from './types';

/**
 * TableHead — renders a `<thead>` element.
 *
 * Automatically becomes `position: sticky` when the parent `<Table>` has
 * `stickyHeader` set to `true`.
 *
 * @accessibility
 * - Provides a semantic `<thead>` scope for screen readers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableHeadInner<C extends React.ElementType = 'thead'>(
  props: TableHeadProps<C>,
  ref: React.ForwardedRef<any>,
) {
  const { as, className = '', style, children, ...rest } = props;
  const { stickyHeader } = useTableContext();

  const Tag = (as ?? 'thead') as React.ElementType;

  const classes = [
    'lxs-table-head',
    stickyHeader && 'lxs-table-head--sticky',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag ref={ref} className={classes} style={style} {...rest}>
      {children}
    </Tag>
  );
}

export const TableHead = React.forwardRef(TableHeadInner) as unknown as <
  C extends React.ElementType = 'thead',
>(
  props: TableHeadProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(TableHead as React.FC).displayName = 'TableHead';

export default TableHead;
