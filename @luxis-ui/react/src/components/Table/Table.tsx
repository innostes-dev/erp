"use client";

import React from 'react';
import { TableContextProvider } from './context';
import type { TableProps } from './types';
import './styles.css';

/**
 * Table — root `<table>` element.
 *
 * Provides shared configuration to all child Table sub-components via context.
 * Supports polymorphic rendering via the `as` prop.
 *
 * @example
 * ```tsx
 * <Table variant="striped" size="md" stickyHeader hoverable>
 *   <TableHead>…</TableHead>
 *   <TableBody>…</TableBody>
 * </Table>
 * ```
 *
 * @accessibility
 * - Renders a semantic `<table>` element.
 * - Pass `label` to provide an accessible name via `aria-label`.
 * - Use `<TableCaption>` as an alternative to `aria-label` for visible captions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableInner<C extends React.ElementType = 'table'>(
  props: TableProps<C>,
  ref: React.ForwardedRef<any>,
) {
  const {
    as,
    variant = 'simple',
    size = 'md',
    stickyHeader = false,
    stickyFooter = false,
    stickyFirstColumn = false,
    stickyLastColumn = false,
    striped = false,
    hoverable = true,
    loading = false,
    className = '',
    style,
    label,
    children,
    ...rest
  } = props;

  const Tag = (as ?? 'table') as React.ElementType;

  const classes = [
    'lxs-table',
    `lxs-table--${variant}`,
    `lxs-table--${size}`,
    hoverable && 'lxs-table--hoverable',
    (striped || variant === 'striped') && 'lxs-table--zebra',
    stickyFirstColumn && 'lxs-table--sticky-first-col',
    stickyLastColumn && 'lxs-table--sticky-last-col',
    loading && 'lxs-table--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <TableContextProvider
      variant={variant}
      size={size}
      stickyHeader={stickyHeader}
      stickyFooter={stickyFooter}
      stickyFirstColumn={stickyFirstColumn}
      stickyLastColumn={stickyLastColumn}
      striped={striped || variant === 'striped'}
      hoverable={hoverable}
      loading={loading}
    >
      <Tag
        ref={ref}
        role="table"
        aria-label={label}
        aria-busy={loading || undefined}
        className={classes}
        style={style}
        {...rest}
      >
        {children}
      </Tag>
    </TableContextProvider>
  );
}

// Cast is necessary to preserve generic forwardRef signature
export const Table = React.forwardRef(TableInner) as unknown as <
  C extends React.ElementType = 'table',
>(
  props: TableProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(Table as React.FC).displayName = 'Table';

export default Table;
