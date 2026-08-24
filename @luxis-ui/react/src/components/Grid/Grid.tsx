import React from 'react';
import './Grid.css';

type GridSize = boolean | 'auto' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type GridSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * If true, the component will have the flex container behavior
   * @default false
   */
  container?: boolean;
  /**
   * If true, the component will have the flex item behavior
   * @default false
   */
  item?: boolean;
  /**
   * Defines the space between items (applies to container)
   * @default 0
   */
  spacing?: GridSpacing;
  /**
   * Defines the row gap between items (applies to container)
   */
  rowSpacing?: GridSpacing;
  /**
   * Defines the column gap between items (applies to container)
   */
  columnSpacing?: GridSpacing;
  /**
   * Number of columns (1-12) for all breakpoints
   */
  xs?: GridSize;
  /**
   * Number of columns (1-12) for small devices (≥600px)
   */
  sm?: GridSize;
  /**
   * Number of columns (1-12) for medium devices (≥960px)
   */
  md?: GridSize;
  /**
   * Number of columns (1-12) for large devices (≥1280px)
   */
  lg?: GridSize;
  /**
   * Number of columns (1-12) for extra large devices (≥1920px)
   */
  xl?: GridSize;
  /**
   * Defines the justify-content style property
   */
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  /**
   * Defines the align-items style property
   */
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  /**
   * Defines the align-content style property
   */
  alignContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'stretch';
  /**
   * Defines the flex-direction style property
   */
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  /**
   * Defines the flex-wrap style property
   */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * The content of the component
   */
  children?: React.ReactNode;
}

/**
 * Grid component - A responsive grid layout system
 *
 * The Grid component uses a 12-column responsive grid layout inspired by Material-UI.
 * It supports five breakpoints (xs, sm, md, lg, xl) and provides flexible spacing,
 * alignment, and direction options.
 *
 * ## Breakpoints
 * - xs: 0px and up (extra small devices)
 * - sm: 600px and up (small devices)
 * - md: 960px and up (medium devices)
 * - lg: 1280px and up (large devices)
 * - xl: 1920px and up (extra large devices)
 *
 * ## CSS Customization
 *
 * You can customize the grid spacing using CSS custom properties:
 *
 * ```css
 * :root {
 *   --lxs-grid-spacing-unit: 8px;
 * }
 * ```
 *
 * @example
 * Basic grid with equal columns
 * ```tsx
 * <Grid container spacing={2}>
 *   <Grid item xs={12} sm={6} md={4}>
 *     <div>Column 1</div>
 *   </Grid>
 *   <Grid item xs={12} sm={6} md={4}>
 *     <div>Column 2</div>
 *   </Grid>
 *   <Grid item xs={12} sm={6} md={4}>
 *     <div>Column 3</div>
 *   </Grid>
 * </Grid>
 * ```
 *
 * @example
 * Responsive layout
 * ```tsx
 * <Grid container spacing={3}>
 *   <Grid item xs={12} md={8}>
 *     <div>Main content</div>
 *   </Grid>
 *   <Grid item xs={12} md={4}>
 *     <div>Sidebar</div>
 *   </Grid>
 * </Grid>
 * ```
 *
 * @example
 * Auto-width columns
 * ```tsx
 * <Grid container spacing={2}>
 *   <Grid item xs="auto">
 *     <div>Auto width</div>
 *   </Grid>
 *   <Grid item xs>
 *     <div>Fills remaining space</div>
 *   </Grid>
 * </Grid>
 * ```
 *
 * @example
 * With alignment
 * ```tsx
 * <Grid container spacing={2} justifyContent="center" alignItems="center">
 *   <Grid item xs={6}>
 *     <div>Centered content</div>
 *   </Grid>
 * </Grid>
 * ```
 */
const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      container = false,
      item = false,
      spacing,
      rowSpacing,
      columnSpacing,
      xs,
      sm,
      md,
      lg,
      xl,
      justifyContent,
      alignItems,
      alignContent,
      direction = 'row',
      wrap = 'wrap',
      className = '',
      children,
      style,
      ...props
    },
    ref
  ) => {
    // Build class names
    const classNames = [
      'lxs-grid',
      container && 'lxs-grid-container',
      item && 'lxs-grid-item',
      // Spacing
      container && spacing !== undefined && `lxs-grid-spacing-${spacing}`,
      container && rowSpacing !== undefined && `lxs-grid-row-spacing-${rowSpacing}`,
      container && columnSpacing !== undefined && `lxs-grid-column-spacing-${columnSpacing}`,
      // Breakpoints
      xs !== undefined && `lxs-grid-xs${xs === true ? '' : xs === 'auto' ? '-auto' : `-${xs}`}`,
      sm !== undefined && `lxs-grid-sm${sm === true ? '' : sm === 'auto' ? '-auto' : `-${sm}`}`,
      md !== undefined && `lxs-grid-md${md === true ? '' : md === 'auto' ? '-auto' : `-${md}`}`,
      lg !== undefined && `lxs-grid-lg${lg === true ? '' : lg === 'auto' ? '-auto' : `-${lg}`}`,
      xl !== undefined && `lxs-grid-xl${xl === true ? '' : xl === 'auto' ? '-auto' : `-${xl}`}`,
      // Direction
      container && direction !== 'row' && `lxs-grid-direction-${direction}`,
      // Wrap
      container && wrap !== 'wrap' && `lxs-grid-wrap-${wrap}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Build inline styles for alignment
    const alignmentStyles: React.CSSProperties = {
      ...style,
    };

    if (container) {
      if (justifyContent) alignmentStyles.justifyContent = justifyContent;
      if (alignItems) alignmentStyles.alignItems = alignItems;
      if (alignContent) alignmentStyles.alignContent = alignContent;
    }

    return (
      <div
        ref={ref}
        className={classNames}
        style={Object.keys(alignmentStyles).length > 0 ? alignmentStyles : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

export default Grid as React.FC<GridProps & React.RefAttributes<HTMLDivElement>>;
export { Grid };