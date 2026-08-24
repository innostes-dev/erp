import * as React from 'react';
import { CSSProperties } from 'react';
import './Typography.css';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body1'
  | 'body2'
  | 'subtitle1'
  | 'subtitle2'
  | 'caption'
  | 'overline'
  | 'button'
  | 'label';

export type TypographyAlign = 'left' | 'center' | 'right' | 'justify';
export type TypographyTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type TypographyDecoration = 'none' | 'underline' | 'line-through' | 'overline';
export type TypographyWeight =
  | 'thin'
  | 'extralight'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold'
  | 'black';
export type TypographyAs =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'strong'
  | 'em'
  | 'small';

export interface TypographyProps extends Omit<React.HTMLAttributes<HTMLElement>, 'color'> {
  /**
   * Typography variant that applies preset styles
   * @default 'body1'
   */
  variant?: TypographyVariant;

  /**
   * HTML element to render as
   * Automatically inferred from variant if not specified
   */
  as?: TypographyAs;

  /**
   * Typography alignment
   */
  align?: TypographyAlign;

  /**
   * Semantic text color - applies predefined theme colors via CSS classes
   * - `primary` / `secondary` / `success` / `error` / `warning` / `info` — brand & status colors
   * - `muted` — secondary text (`--lxs-text-secondary`)
   * - `disabled` — disabled/ low-emphasis text (`--lxs-text-disabled`)
   * - `inherit` — pass-through (default behaviour, no class added)
   */
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'muted' | 'disabled' | 'inherit';

  /**
   * Direct text color override - accepts any CSS color value
   * Examples: '#000', 'rgb(0,0,0)', '#primary.500'
   * Overrides semantic color if both are provided
   */
  textColor?: string;

  /**
   * Font weight override
   */
  weight?: TypographyWeight | number;

  /**
   * Typography transform
   */
  transform?: TypographyTransform;

  /**
   * Typography decoration
   */
  decoration?: TypographyDecoration;

  /**
   * Enable text truncation with ellipsis
   * @default false
   */
  truncate?: boolean;

  /**
   * Number of lines to show before truncating (requires truncate or clamp)
   * Uses -webkit-line-clamp for multi-line truncation
   */
  lineClamp?: number;

  /**
   * Enable word break for long words
   * @default false
   */
  breakWord?: boolean;

  /**
   * Enable italic style
   * @default false
   */
  italic?: boolean;

  /**
   * Enable underline
   * @default false
   */
  underline?: boolean;

  /**
   * Enable strikethrough
   * @default false
   */
  strikethrough?: boolean;

  /**
   * Make text gradient with specified colors
   * Example: ['#667eea', '#764ba2']
   */
  gradient?: string[];

  /**
   * Disable user selection
   * @default false
   */
  noSelect?: boolean;

  /**
   * Custom font size (overrides variant)
   */
  size?: string | number;

  /**
   * Custom line height (overrides variant)
   */
  lineHeight?: string | number;

  /**
   * Custom letter spacing (overrides variant)
   */
  letterSpacing?: string | number;

  /**
   * Remove default margin
   * @default false
   */
  noMargin?: boolean;

  /**
   * Remove default padding
   * @default false
   */
  noPadding?: boolean;

  /**
   * Children content to render
   */
  children?: React.ReactNode;

  /**
   * For usage when rendered as a label
   */
  htmlFor?: string;
}

/**
 * Pre-computed base class names for each variant (performance optimization)
 */
const CLASS_VARIANTS: Record<TypographyVariant, string> = {
  h1: 'lxs-typography lxs-typography--h1',
  h2: 'lxs-typography lxs-typography--h2',
  h3: 'lxs-typography lxs-typography--h3',
  h4: 'lxs-typography lxs-typography--h4',
  h5: 'lxs-typography lxs-typography--h5',
  h6: 'lxs-typography lxs-typography--h6',
  body1: 'lxs-typography lxs-typography--body1',
  body2: 'lxs-typography lxs-typography--body2',
  subtitle1: 'lxs-typography lxs-typography--subtitle1',
  subtitle2: 'lxs-typography lxs-typography--subtitle2',
  caption: 'lxs-typography lxs-typography--caption',
  overline: 'lxs-typography lxs-typography--overline',
  button: 'lxs-typography lxs-typography--button',
  label: 'lxs-typography lxs-typography--label',
};

/**
 * Default HTML element mapping for each variant
 */
const ELEMENT_MAP: Record<TypographyVariant, TypographyAs> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  subtitle1: 'p',
  subtitle2: 'p',
  caption: 'span',
  overline: 'span',
  button: 'span',
  label: 'label',
};

/**
 * Typography component - Versatile typography component with theme integration
 *
 * A comprehensive text component that provides consistent typography across your application
 * with full theming support and extensive customization options.
 */
const TypographyComponent = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = 'body1',
      as,
      align,
      color,
      textColor,
      weight,
      transform,
      decoration,
      truncate = false,
      lineClamp,
      breakWord = false,
      italic = false,
      underline = false,
      strikethrough = false,
      gradient,
      noSelect = false,
      size,
      lineHeight,
      letterSpacing,
      noMargin = false,
      noPadding = false,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    // Determine the HTML element to render
    const Component = as || ELEMENT_MAP[variant] || 'p';

    // Build class names — array filtering avoids branching, keeps cognitive complexity low.
    const classNames = React.useMemo(() =>
      [
        CLASS_VARIANTS[variant],
        align                                         && `lxs-typography--align-${align}`,
        typeof weight === 'string'                    && `lxs-typography--weight-${weight}`,
        color && color !== 'inherit'                  && `lxs-typography--color-${color}`,
        transform                                     && `lxs-typography--transform-${transform}`,
        decoration                                    && `lxs-typography--decoration-${decoration}`,
        // When lineClamp is active, skip the `truncate` class — lineClamp handles clipping itself.
        truncate && !lineClamp                        && 'lxs-typography--truncate',
        lineClamp                                     && 'lxs-typography--line-clamp',
        breakWord                                     && 'lxs-typography--break-word',
        italic                                        && 'lxs-typography--italic',
        underline                                     && 'lxs-typography--underline',
        strikethrough                                 && 'lxs-typography--strikethrough',
        gradient                                      && 'lxs-typography--gradient',
        noSelect                                      && 'lxs-typography--no-select',
        noMargin                                      && 'lxs-typography--no-margin',
        noPadding                                     && 'lxs-typography--no-padding',
        className || undefined,
      ]
        .filter(Boolean)
        .join(' '),
      [variant, align, weight, color, transform, decoration, truncate, lineClamp, breakWord, italic, underline, strikethrough, gradient, noSelect, noMargin, noPadding, className]
    );

    // Build inline styles — spreads `style` prop first, then applies prop-driven overrides.
    const inlineStyles = React.useMemo(() => {
      const s: CSSProperties = { ...style };

      if (textColor) s.color = textColor;
      if (typeof weight === 'number') s.fontWeight = weight;
      if (lineClamp) s.WebkitLineClamp = lineClamp;

      if (gradient?.length) {
        s.backgroundImage = gradient.length === 1
          ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[0]})`
          : `linear-gradient(135deg, ${gradient.join(', ')})`;
      }

      if (size) s.fontSize = typeof size === 'number' ? `${size}px` : size;
      if (lineHeight) s.lineHeight = typeof lineHeight === 'number' ? `${lineHeight}` : lineHeight;
      // Inline — avoids an extra nesting level that would breach the complexity budget
      if (letterSpacing) s.letterSpacing = typeof letterSpacing === 'number' ? `${letterSpacing}px` : letterSpacing;

      // React omits style={} from the DOM, so returning an empty object is safe and avoids a ternary.
      return s;
    }, [style, textColor, weight, lineClamp, gradient, size, lineHeight, letterSpacing]);

    return React.createElement(
      Component,
      {
        ref,
        className: classNames,
        style: inlineStyles,
        ...props,
      },
      children
    );
  }
);

TypographyComponent.displayName = 'Typography';

// React.memo preserves prop-equality short-circuit; forwardRef types are preserved automatically.
const Typography = React.memo(TypographyComponent);

export { Typography };
export default Typography;
