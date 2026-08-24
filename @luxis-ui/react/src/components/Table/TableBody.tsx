"use client";

import React from 'react';
import type { TableBodyProps } from './types';

/**
 * TableBody — renders a `<tbody>` element.
 *
 * Acts as a semantic container for data rows.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableBodyInner<C extends React.ElementType = 'tbody'>(
  props: TableBodyProps<C>,
  ref: React.ForwardedRef<any>,
) {
  const { as, className = '', style, children, ...rest } = props;

  const Tag = (as ?? 'tbody') as React.ElementType;

  const classes = ['lxs-table-body', className].filter(Boolean).join(' ');

  return (
    <Tag ref={ref} className={classes} style={style} {...rest}>
      {children}
    </Tag>
  );
}

export const TableBody = React.forwardRef(TableBodyInner) as unknown as <
  C extends React.ElementType = 'tbody',
>(
  props: TableBodyProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(TableBody as React.FC).displayName = 'TableBody';

export default TableBody;
