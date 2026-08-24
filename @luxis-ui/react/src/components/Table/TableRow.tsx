"use client";

import React, { useCallback } from 'react';
import type { TableRowProps } from './types';

/**
 * TableRow — renders a `<tr>` element.
 *
 * Supports selection, disabled state, clickable rows, and expandable rows.
 * Keyboard users can activate clickable rows via Enter or Space.
 *
 * @accessibility
 * - Sets `aria-selected` when `selected` is provided.
 * - Sets `aria-disabled` when `disabled` is true.
 * - Sets `aria-expanded` when `expanded` is provided.
 * - Adds `tabIndex={0}` and keyboard handler when `clickable` is true so
 *   that keyboard users can trigger `onClick` with Enter / Space.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableRowInner<C extends React.ElementType = 'tr'>(
  props: TableRowProps<C>,
  ref: React.ForwardedRef<any>,
) {
  const {
    as,
    selected,
    disabled = false,
    clickable = false,
    expanded,
    className = '',
    style,
    children,
    onClick,
    ...rest
  } = props;

  const Tag = (as ?? 'tr') as React.ElementType;

  const classes = [
    'lxs-table-row',
    selected && 'lxs-table-row--selected',
    disabled && 'lxs-table-row--disabled',
    clickable && 'lxs-table-row--clickable',
    expanded && 'lxs-table-row--expanded',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  /** Allow keyboard activation for clickable rows. */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (clickable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        (onClick as React.MouseEventHandler<HTMLTableRowElement> | undefined)?.(
          e as unknown as React.MouseEvent<HTMLTableRowElement>,
        );
      }
    },
    [clickable, onClick],
  );

  return (
    <Tag
      ref={ref}
      className={classes}
      style={style}
      aria-selected={selected ?? undefined}
      aria-disabled={disabled || undefined}
      aria-expanded={expanded ?? undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? handleKeyDown : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export const TableRow = React.forwardRef(TableRowInner) as unknown as <
  C extends React.ElementType = 'tr',
>(
  props: TableRowProps<C> & { ref?: React.Ref<unknown> },
) => React.ReactElement | null;

(TableRow as React.FC).displayName = 'TableRow';

export default TableRow;
