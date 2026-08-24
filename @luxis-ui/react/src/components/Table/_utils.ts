import React from 'react';

/**
 * Converts a `string | number` CSS dimension value to a px string.
 * Returns `undefined` when the input is `undefined`.
 */
export function toCssValue(v: string | number): string {
  return typeof v === 'number' ? `${v}px` : v;
}

/**
 * Builds a partial `CSSProperties` object with width / minWidth / maxWidth
 * only for the dimensions that are explicitly provided (not undefined).
 */
export function buildDimensionStyle(
  width?: string | number,
  minWidth?: string | number,
  maxWidth?: string | number,
): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (width !== undefined) { s.width = toCssValue(width); }
  if (minWidth !== undefined) { s.minWidth = toCssValue(minWidth); }
  if (maxWidth !== undefined) { s.maxWidth = toCssValue(maxWidth); }
  return s;
}

/**
 * Builds the CSS class string for a table cell (td or th), handling alignment,
 * numeric, truncate, and sticky modifiers.
 */
export function buildCellClasses(opts: {
  base: string;
  align?: string;
  numeric: boolean;
  truncate: boolean;
  stickyLeft: boolean;
  stickyRight: boolean;
  extra?: string;
}): string {
  const { base, align, numeric, truncate, stickyLeft, stickyRight, extra } = opts;
  return [
    base,
    align ? `lxs-table-cell--align-${align}` : '',
    numeric ? 'lxs-table-cell--numeric' : '',
    truncate ? 'lxs-table-cell--truncate' : '',
    stickyLeft ? 'lxs-table-cell--sticky-left' : '',
    stickyRight ? 'lxs-table-cell--sticky-right' : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}
