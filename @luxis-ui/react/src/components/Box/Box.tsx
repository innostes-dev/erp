"use client";

import * as React from 'react';
import { CSSProperties } from 'react';
import './Box.css';

export type BoxAs =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'main'
  | 'header'
  | 'footer'
  | 'nav'
  | 'span';

export type BoxDisplay =
  | 'block'
  | 'inline-block'
  | 'inline'
  | 'flex'
  | 'inline-flex'
  | 'grid'
  | 'inline-grid'
  | 'none';

export type BoxPosition = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';

export type BoxOverflow = 'visible' | 'hidden' | 'scroll' | 'auto';

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  /** HTML element to render as. @default 'div' */
  as?: BoxAs;
  /** CSS display — maps to a CSS class */
  display?: BoxDisplay;
  /** CSS position — maps to a CSS class */
  position?: BoxPosition;
  /** CSS overflow — maps to a CSS class */
  overflow?: BoxOverflow;

  /** Background color — any CSS color or theme token e.g. '#fff', 'primary.500' */
  bg?: string;
  /** Text/foreground color — any CSS color value */
  color?: string;

  /** Width (number → px) */
  w?: string | number;
  /** Height (number → px) */
  h?: string | number;
  /** Min-width (number → px) */
  minW?: string | number;
  /** Max-width (number → px) */
  maxW?: string | number;
  /** Min-height (number → px) */
  minH?: string | number;
  /** Max-height (number → px) */
  maxH?: string | number;

  /** Margin all sides (number → px) */
  m?: string | number;
  /** Margin top */
  mt?: string | number;
  /** Margin right */
  mr?: string | number;
  /** Margin bottom */
  mb?: string | number;
  /** Margin left */
  ml?: string | number;
  /** Margin left + right */
  mx?: string | number;
  /** Margin top + bottom */
  my?: string | number;

  /** Padding all sides (number → px) */
  p?: string | number;
  /** Padding top */
  pt?: string | number;
  /** Padding right */
  pr?: string | number;
  /** Padding bottom */
  pb?: string | number;
  /** Padding left */
  pl?: string | number;
  /** Padding left + right */
  px?: string | number;
  /** Padding top + bottom */
  py?: string | number;

  /** Border shorthand — number becomes `{n}px solid var(--lxs-color-border-default)` */
  border?: string | number;
  /** Border color — any CSS color or theme token */
  borderColor?: string;
  /** Border radius (number → px) */
  borderRadius?: string | number;

  /** Shadow preset — maps to a CSS class */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /** Opacity (0–1) */
  opacity?: number;
  /** z-index */
  zIndex?: number;

  /** Top offset (number → px) */
  top?: string | number;
  /** Right offset (number → px) */
  right?: string | number;
  /** Bottom offset (number → px) */
  bottom?: string | number;
  /** Left offset (number → px) */
  left?: string | number;

  /** flex-direction — maps to a CSS class */
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  /** justify-content — maps to a CSS class */
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  /** align-items — maps to a CSS class */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  /** flex-wrap — maps to a CSS class */
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  /** Gap between flex/grid items (number → px) */
  gap?: string | number;

  /** text-align — maps to a CSS class */
  textAlign?: 'left' | 'center' | 'right' | 'justify';

  children?: React.ReactNode;
}

/** Resolve a color token or raw CSS value to a usable CSS color string. */
const resolveColor = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl') || value.startsWith('var')) {
    return value;
  }
  if (value.includes('.')) {
    const [color, shade] = value.split('.');
    return `var(--lxs-color-${color}-${shade})`;
  }
  const themeColors = ['primary', 'secondary', 'success', 'warning', 'error', 'danger', 'info', 'neutral'];
  if (themeColors.includes(value)) {
    return `var(--lxs-color-${value}-600)`;
  }
  if (value === 'white') return 'var(--lxs-color-white)';
  if (value === 'black') return 'var(--lxs-color-black)';
  return value;
};

/** Convert a number to `{n}px`, pass strings through unchanged. */
const toCSSValue = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

/** Resolve border shorthand: number → `{n}px solid var(--lxs-color-border-default)`. */
const resolveBorder = (value: string | number): string => {
  if (typeof value === 'number') {
    return `${value}px solid var(--lxs-color-border-default, #e5e7eb)`;
  }
  return value;
};

/**
 * Box — flexible layout primitive that renders as any HTML element.
 *
 * Enum-valued props (`display`, `position`, `overflow`, `shadow`, `flexDirection`,
 * `justifyContent`, `alignItems`, `flexWrap`, `textAlign`) map to CSS classes.
 * Arbitrary-value props (`bg`, `color`, dimensions, spacing, `border`, `gap`, …)
 * are applied as inline styles. Anything else can be passed via `style` or `className`.
 */
const Box = React.forwardRef<HTMLElement, BoxProps>(
  (
    {
      as = 'div',
      display,
      position,
      overflow,
      bg,
      color,
      w, h,
      minW, maxW,
      minH, maxH,
      m, mt, mr, mb, ml, mx, my,
      p, pt, pr, pb, pl, px, py,
      border,
      borderColor,
      borderRadius,
      shadow,
      opacity,
      zIndex,
      top, right, bottom, left,
      flexDirection,
      justifyContent,
      alignItems,
      flexWrap,
      gap,
      textAlign,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    const Component = as;

    const classNames = [
      'lxs-box',
      display && `lxs-box--display-${display}`,
      position && `lxs-box--position-${position}`,
      overflow && `lxs-box--overflow-${overflow}`,
      shadow && `lxs-box--shadow-${shadow}`,
      flexDirection && `lxs-box--flex-dir-${flexDirection}`,
      justifyContent && `lxs-box--justify-${justifyContent}`,
      alignItems && `lxs-box--align-${alignItems}`,
      flexWrap && `lxs-box--flex-wrap-${flexWrap}`,
      textAlign && `lxs-box--text-${textAlign}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inlineStyles: CSSProperties = { ...style };

    // Colors
    if (bg) inlineStyles.backgroundColor = resolveColor(bg);
    if (color) inlineStyles.color = resolveColor(color);

    // Dimensions
    if (w !== undefined) inlineStyles.width = toCSSValue(w);
    if (h !== undefined) inlineStyles.height = toCSSValue(h);
    if (minW !== undefined) inlineStyles.minWidth = toCSSValue(minW);
    if (maxW !== undefined) inlineStyles.maxWidth = toCSSValue(maxW);
    if (minH !== undefined) inlineStyles.minHeight = toCSSValue(minH);
    if (maxH !== undefined) inlineStyles.maxHeight = toCSSValue(maxH);

    // Margin — shorthand wins; mx/my are overridden by individual sides
    if (m !== undefined) {
      inlineStyles.margin = toCSSValue(m);
    } else {
      if (my !== undefined) { inlineStyles.marginTop = toCSSValue(my); inlineStyles.marginBottom = toCSSValue(my); }
      if (mx !== undefined) { inlineStyles.marginLeft = toCSSValue(mx); inlineStyles.marginRight = toCSSValue(mx); }
      if (mt !== undefined) inlineStyles.marginTop = toCSSValue(mt);
      if (mr !== undefined) inlineStyles.marginRight = toCSSValue(mr);
      if (mb !== undefined) inlineStyles.marginBottom = toCSSValue(mb);
      if (ml !== undefined) inlineStyles.marginLeft = toCSSValue(ml);
    }

    // Padding — same precedence as margin
    if (p !== undefined) {
      inlineStyles.padding = toCSSValue(p);
    } else {
      if (py !== undefined) { inlineStyles.paddingTop = toCSSValue(py); inlineStyles.paddingBottom = toCSSValue(py); }
      if (px !== undefined) { inlineStyles.paddingLeft = toCSSValue(px); inlineStyles.paddingRight = toCSSValue(px); }
      if (pt !== undefined) inlineStyles.paddingTop = toCSSValue(pt);
      if (pr !== undefined) inlineStyles.paddingRight = toCSSValue(pr);
      if (pb !== undefined) inlineStyles.paddingBottom = toCSSValue(pb);
      if (pl !== undefined) inlineStyles.paddingLeft = toCSSValue(pl);
    }

    // Border
    if (border !== undefined) inlineStyles.border = resolveBorder(border);
    if (borderRadius !== undefined) inlineStyles.borderRadius = toCSSValue(borderRadius);
    if (borderColor) inlineStyles.borderColor = resolveColor(borderColor);

    // Visual
    if (opacity !== undefined) inlineStyles.opacity = opacity;
    if (zIndex !== undefined) inlineStyles.zIndex = zIndex;

    // Position offsets
    if (top !== undefined) inlineStyles.top = toCSSValue(top);
    if (right !== undefined) inlineStyles.right = toCSSValue(right);
    if (bottom !== undefined) inlineStyles.bottom = toCSSValue(bottom);
    if (left !== undefined) inlineStyles.left = toCSSValue(left);

    // Gap (arbitrary value, stays inline)
    if (gap !== undefined) inlineStyles.gap = toCSSValue(gap);

    return React.createElement(
      Component,
      { ref, className: classNames, style: inlineStyles, ...props },
      children
    );
  }
);

Box.displayName = 'Box';

export default Box as React.FC<BoxProps & React.RefAttributes<HTMLElement>>;
export { Box };
