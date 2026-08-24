"use client";

import React from 'react';
import { useTableContext } from './context';
import type { TableFooterProps } from './types';

/**
 * TableFooter — renders a `<tfoot>` element.
 *
 * Automatically becomes `position: sticky` at the bottom of the scroll
 * container when the parent `<Table>` has `stickyFooter` set to `true`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableFooterInner<C extends React.ElementType = 'tfoot'>(
  props: TableFooterProps<C>,
  ref: React.ForwardedRef<any>,
) {
  const { as, className = '', style, children, ...rest } = props;
  const { stickyFooter } = useTableContext();

  const Tag = (as ?? 'tfoot') as React.ElementType;

  const classes = [
    'lxs-table-footer',
    stickyFooter && 'lxs-table-footer--sticky',
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

export const TableFooter = React.forwardRef(TableFooterInner) as unknown as <
  C extends React.ElementType = 'tfoot',
>(
  props: TableFooterProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(TableFooter as React.FC).displayName = 'TableFooter';

export default TableFooter;
