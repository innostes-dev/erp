"use client";

import React from 'react';
import type { TableCaptionProps } from './types';

/**
 * TableCaption — renders a `<caption>` element.
 *
 * Captions are the recommended way of providing an accessible table name
 * that is also visible to sighted users. Use `placement` to control whether
 * the caption appears above or below the table.
 *
 * @accessibility
 * - A `<caption>` is read by screen readers as the accessible name of the
 *   table — prefer it over `aria-label` when the label should be visible.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableCaptionInner<C extends React.ElementType = 'caption'>(
  props: TableCaptionProps<C>,
  ref: React.ForwardedRef<any>,
) {
  const {
    as,
    placement = 'bottom',
    className = '',
    style,
    children,
    ...rest
  } = props;

  const Tag = (as ?? 'caption') as React.ElementType;

  const classes = [
    'lxs-table-caption',
    `lxs-table-caption--${placement}`,
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

export const TableCaption = React.forwardRef(TableCaptionInner) as unknown as <
  C extends React.ElementType = 'caption',
>(
  props: TableCaptionProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(TableCaption as React.FC).displayName = 'TableCaption';

export default TableCaption;
