import React from 'react';
import type { BoxAs, BoxProps } from '../Box';
import { Box } from '../Box';

/**
 * Semantic spacing tokens for gap props.
 * Named tokens resolve to the design system's `--lxs-spacing-*` CSS variables:
 * - `none` → 0
 * - `xs`   → var(--lxs-spacing-1)  = 4px
 * - `sm`   → var(--lxs-spacing-2)  = 8px
 * - `md`   → var(--lxs-spacing-4)  = 16px
 * - `lg`   → var(--lxs-spacing-6)  = 24px
 * - `xl`   → var(--lxs-spacing-8)  = 32px
 * - `2xl`  → var(--lxs-spacing-10) = 40px
 *
 * You can still pass a raw number (converted to px) or any CSS string.
 */
export type GapSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number | (string & {});

export interface FlexProps {
  /** Child elements */
  children?: React.ReactNode;
  /** flex-direction */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /** flex-wrap */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  /** justify-content — shorthand values map to CSS: 'start'→flex-start, 'end'→flex-end, 'between'→space-between, etc. */
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  /** align-items — shorthand: 'start'→flex-start, 'end'→flex-end */
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  /** align-content — shorthand same mapping as align */
  alignContent?: 'start' | 'end' | 'center' | 'between' | 'around' | 'stretch';
  /** Gap between items — accepts semantic tokens (xs/sm/md/lg/xl/2xl/none), numbers (px), or any CSS string */
  gap?: GapSize;
  /** Row gap — accepts semantic tokens (xs/sm/md/lg/xl/2xl/none), numbers (px), or any CSS string */
  rowGap?: GapSize;
  /** Column gap — accepts semantic tokens (xs/sm/md/lg/xl/2xl/none), numbers (px), or any CSS string */
  columnGap?: GapSize;
  /** Render as inline-flex instead of flex */
  inline?: boolean;
  /** Stretch to 100% width */
  fullWidth?: boolean;
  /** flex-grow */
  grow?: number;
  /** flex-shrink */
  shrink?: number;
  /** flex-basis */
  basis?: string | number;
  /** Custom className */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
  /** HTML element to render as */
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'main';
}

const JUSTIFY_MAP: Record<string, BoxProps['justifyContent']> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const ALIGN_MAP: Record<string, BoxProps['alignItems']> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  baseline: 'baseline',
  stretch: 'stretch',
};

const ALIGN_CONTENT_MAP: Record<string, React.CSSProperties['alignContent']> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  stretch: 'stretch',
};

/** Named spacing tokens mapped to design-system CSS variables. */
const GAP_SIZE_MAP: Record<string, string> = {
  none: '0',
  xs:   'var(--lxs-spacing-1)',   // 4px
  sm:   'var(--lxs-spacing-2)',   // 8px
  md:   'var(--lxs-spacing-4)',   // 16px
  lg:   'var(--lxs-spacing-6)',   // 24px
  xl:   'var(--lxs-spacing-8)',   // 32px
  '2xl': 'var(--lxs-spacing-10)', // 40px
};

const resolveGap = (v: GapSize | undefined): string | number | undefined => {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return v;
  return GAP_SIZE_MAP[v] ?? v;
};

const toPx = (v: GapSize | undefined): string | undefined => {
  if (v === undefined) return undefined;
  const resolved = resolveGap(v);
  if (resolved === undefined) return undefined;
  return typeof resolved === 'number' ? `${resolved}px` : resolved;
};

/**
 * Flex — convenience wrapper around Box for flexbox layouts.
 *
 * Uses shorthand prop names (`justify`, `align`, `direction`, `wrap`) that map
 * to the underlying CSS values. Arbitrary-value props (`gap`, `rowGap`, …) are
 * applied as inline styles.
 *
 * @example Basic row
 * ```tsx
 * <Flex gap="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Flex>
 * ```
 *
 * @example Centered column
 * ```tsx
 * <Flex direction="column" align="center" justify="center" gap="sm">
 *   <h1>Title</h1>
 *   <p>Content</p>
 * </Flex>
 * ```
 */
const Flex = React.forwardRef<HTMLDivElement, FlexProps & React.HTMLAttributes<HTMLDivElement>>(
  (
    {
      children,
      direction = 'row',
      wrap = 'nowrap',
      justify = 'start',
      align = 'stretch',
      alignContent,
      gap,
      rowGap,
      columnGap,
      inline = false,
      fullWidth = false,
      grow,
      shrink,
      basis,
      className = '',
      as = 'div',
      style,
      ...rest
    },
    ref
  ) => {
    // Build extra styles for props Box no longer handles as first-class
    const extraStyle: React.CSSProperties = {};
    if (alignContent) extraStyle.alignContent = ALIGN_CONTENT_MAP[alignContent] ?? alignContent;
    if (rowGap !== undefined) extraStyle.rowGap = toPx(rowGap);
    if (columnGap !== undefined) extraStyle.columnGap = toPx(columnGap);
    if (grow !== undefined) extraStyle.flexGrow = grow;
    if (shrink !== undefined) extraStyle.flexShrink = shrink;
    if (basis !== undefined) extraStyle.flexBasis = toPx(basis);

    return (
      <Box
        ref={ref as React.Ref<HTMLElement>}
        as={as as BoxAs}
        display={inline ? 'inline-flex' : 'flex'}
        flexDirection={direction}
        flexWrap={wrap}
        justifyContent={JUSTIFY_MAP[justify]}
        alignItems={ALIGN_MAP[align]}
        gap={resolveGap(gap)}
        w={fullWidth ? '100%' : undefined}
        className={`lxs-flex ${className}`.trim()}
        style={{ ...extraStyle, ...style }}
        {...rest}
      >
        {children}
      </Box>
    );
  }
);

Flex.displayName = 'Flex';

export default Flex as React.FC<FlexProps & React.RefAttributes<HTMLDivElement>>;
export { Flex };
