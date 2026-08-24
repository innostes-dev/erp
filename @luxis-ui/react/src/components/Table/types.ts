"use client";

import React from 'react';

// ═══════════════════════════════════════════════
// Core Enumerations / Union Types
// ═══════════════════════════════════════════════

/** Visual presentation variant of the table */
export type TableVariant = 'simple' | 'striped' | 'bordered' | 'ghost';

/** Density / size of cell padding */
export type TableSize = 'sm' | 'md' | 'lg';

/** Text-alignment inside a cell */
export type TableCellAlign = 'left' | 'center' | 'right';

/** Sort direction for a header cell */
export type SortDirection = 'asc' | 'desc' | 'none';

// ═══════════════════════════════════════════════
// Polymorphic helper types
// ═══════════════════════════════════════════════

/**
 * Allows any component to be rendered as a different HTML element or React
 * component while keeping the correct prop types for that element.
 *
 * @example
 * <TableRow as="a" href="/dashboard" />
 */
export type AsProp<C extends React.ElementType> = {
  /** Render the component as this element/component */
  as?: C;
};

/** Extract own props, excluding those already provided by the `as` element */
export type PolymorphicComponentProps<
  C extends React.ElementType,
  Props = Record<string, never>,
> = Props &
  AsProp<C> &
  Omit<React.ComponentPropsWithRef<C>, keyof Props | 'as'>;

// ═══════════════════════════════════════════════
// Table (root)
// ═══════════════════════════════════════════════

export interface TableOwnProps {
  /**
   * Visual style variant
   * @default 'simple'
   */
  variant?: TableVariant;

  /**
   * Cell-padding density
   * @default 'md'
   */
  size?: TableSize;

  /**
   * Stick the header row to the top of the scroll container
   * @default false
   */
  stickyHeader?: boolean;

  /**
   * Stick the footer row to the bottom of the scroll container
   * @default false
   */
  stickyFooter?: boolean;

  /**
   * Highlight the first column as sticky on the left
   * @default false
   */
  stickyFirstColumn?: boolean;

  /**
   * Highlight the last column as sticky on the right
   * @default false
   */
  stickyLastColumn?: boolean;

  /**
   * Enable zebra / alternating row colours (applies stripe even without variant="striped")
   * @default false
   */
  striped?: boolean;

  /**
   * Highlight rows on hover
   * @default true
   */
  hoverable?: boolean;

  /**
   * Show a loading overlay / skeleton state
   * @default false
   */
  loading?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;

  style?: React.CSSProperties;

  children?: React.ReactNode;

  /** Full accessible label for the table (forwarded to aria-label) */
  label?: string;
}

export type TableProps<C extends React.ElementType = 'table'> =
  PolymorphicComponentProps<C, TableOwnProps>;

// ═══════════════════════════════════════════════
// TableContainer
// ═══════════════════════════════════════════════

export interface TableContainerOwnProps {
  /**
   * Enable horizontal scrolling when the table overflows
   * @default true
   */
  scrollX?: boolean;

  /**
   * Maximum height for vertical scrolling (CSS value, e.g. "400px")
   */
  maxHeight?: string | number;

  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export type TableContainerProps<C extends React.ElementType = 'div'> =
  PolymorphicComponentProps<C, TableContainerOwnProps>;

// ═══════════════════════════════════════════════
// TableHead / TableBody / TableFooter
// ═══════════════════════════════════════════════

export interface TableSectionOwnProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export type TableHeadProps<C extends React.ElementType = 'thead'> =
  PolymorphicComponentProps<C, TableSectionOwnProps>;

export type TableBodyProps<C extends React.ElementType = 'tbody'> =
  PolymorphicComponentProps<C, TableSectionOwnProps>;

export type TableFooterProps<C extends React.ElementType = 'tfoot'> =
  PolymorphicComponentProps<C, TableSectionOwnProps>;

// ═══════════════════════════════════════════════
// TableRow
// ═══════════════════════════════════════════════

export interface TableRowOwnProps {
  /**
   * Mark row as selected — adds aria-selected and selection styling
   * @default false
   */
  selected?: boolean;

  /**
   * Disable interaction and dim the row
   * @default false
   */
  disabled?: boolean;

  /**
   * Make the row visually clickable (cursor-pointer + hover)
   * Attach an onClick handler to handle navigation / selection.
   * @default false
   */
  clickable?: boolean;

  /**
   * Render the row in an expanded/highlighted state (useful for expandable rows)
   * @default false
   */
  expanded?: boolean;

  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export type TableRowProps<C extends React.ElementType = 'tr'> =
  PolymorphicComponentProps<C, TableRowOwnProps>;

// ═══════════════════════════════════════════════
// TableCell
// ═══════════════════════════════════════════════

export interface TableCellOwnProps {
  /**
   * Horizontal text alignment
   * @default 'left'
   */
  align?: TableCellAlign;

  /**
   * Fixed width (CSS value)
   */
  width?: string | number;

  /**
   * Minimum width (CSS value)
   */
  minWidth?: string | number;

  /**
   * Maximum width (CSS value)
   */
  maxWidth?: string | number;

  /**
   * Truncate overflowing text with an ellipsis
   * @default false
   */
  truncate?: boolean;

  /**
   * Indicate that this cell contains a numeric value —
   * applies tabular-nums font-feature and right-align default
   * @default false
   */
  numeric?: boolean;

  /**
   * Mark cell as sticky to the left edge
   * @default false
   */
  stickyLeft?: boolean;

  /**
   * Mark cell as sticky to the right edge
   * @default false
   */
  stickyRight?: boolean;

  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export type TableCellProps<C extends React.ElementType = 'td'> =
  PolymorphicComponentProps<C, TableCellOwnProps>;

// ═══════════════════════════════════════════════
// TableHeaderCell
// ═══════════════════════════════════════════════

export interface TableHeaderCellOwnProps extends TableCellOwnProps {
  /**
   * Current sort direction for this column
   * @default 'none'
   */
  sortDirection?: SortDirection;

  /**
   * Whether users can click this header to sort the column
   * @default false
   */
  sortable?: boolean;

  /**
   * Callback when the sort button is activated (click / keyboard)
   */
  onSort?: (direction: SortDirection) => void;

  /**
   * Scope attribute — forwarded to the <th> element
   * @default 'col'
   */
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
}

export type TableHeaderCellProps<C extends React.ElementType = 'th'> =
  PolymorphicComponentProps<C, TableHeaderCellOwnProps>;

// ═══════════════════════════════════════════════
// TableCaption
// ═══════════════════════════════════════════════

export interface TableCaptionOwnProps {
  /**
   * Visual placement of the caption
   * @default 'bottom'
   */
  placement?: 'top' | 'bottom';

  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export type TableCaptionProps<C extends React.ElementType = 'caption'> =
  PolymorphicComponentProps<C, TableCaptionOwnProps>;

// ═══════════════════════════════════════════════
// TableEmptyState
// ═══════════════════════════════════════════════

export interface TableEmptyStateOwnProps {
  /**
   * Number of visible columns — used to set `colSpan` so the message
   * spans the entire table width
   */
  colSpan?: number;

  /**
   * Primary message text
   * @default 'No data available'
   */
  message?: React.ReactNode;

  /**
   * Optional description rendered below the message
   */
  description?: React.ReactNode;

  /**
   * Optional icon / illustration rendered above the message
   */
  icon?: React.ReactNode;

  /**
   * Type of empty state to render
   * @default 'empty'
   */
  type?: 'empty' | 'error' | 'loading';

  className?: string;
  style?: React.CSSProperties;
}

export type TableEmptyStateProps<C extends React.ElementType = 'tr'> =
  PolymorphicComponentProps<C, TableEmptyStateOwnProps>;

// ═══════════════════════════════════════════════
// TablePagination
// ═══════════════════════════════════════════════

export interface TablePaginationProps {
  /**
   * Total number of rows (before slicing)
   */
  totalRows: number;

  /**
   * Current page index (0-based)
   */
  page: number;

  /**
   * Number of rows per page
   */
  pageSize: number;

  /**
   * Selectable page-size options
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];

  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;

  /**
   * Callback when page size changes
   */
  onPageSizeChange?: (size: number) => void;

  /**
   * Show the page-size selector
   * @default true
   */
  showPageSizeSelector?: boolean;

  /**
   * Show the row-count summary ("1–10 of 100")
   * @default true
   */
  showRowCount?: boolean;

  className?: string;
  style?: React.CSSProperties;
}

// ═══════════════════════════════════════════════
// TableContext
// ═══════════════════════════════════════════════

export interface TableContextValue {
  variant: TableVariant;
  size: TableSize;
  stickyHeader: boolean;
  stickyFooter: boolean;
  stickyFirstColumn: boolean;
  stickyLastColumn: boolean;
  striped: boolean;
  hoverable: boolean;
  loading: boolean;
}
