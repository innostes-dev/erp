import React, { AnchorHTMLAttributes, useContext } from 'react';
import { ThemeContext } from '../../theme/ThemeProvider';
import './Link.css';

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /**
   * URL to navigate to
   */
  href?: string;
  /**
   * Custom Link component to use (e.g., Next.js Link or React Router Link)
   * @example
   * import { Link as RouterLink } from 'react-router-dom'
   * <Link component={RouterLink} to="/page">Link</Link>
   * @example
   * import NextLink from 'next/link'
   * <Link component={NextLink} href="/page">Link</Link>
   */
  component?: React.ElementType;
  /**
   * Props to pass to the custom component.
   * Lowest priority — explicit Link props and the consumer's own {...props} take precedence.
   */
  componentProps?: Record<string, unknown>;
  /**
   * Text variant (size/style)
   * @default 'body1'
   */
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'small';
  /**
   * If true, removes underline decoration
   * @default true
   */
  noUnderline?: boolean;
  /**
   * If true, link is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Link color variant
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'neutral' | 'inherit';
  /**
   * Icon to display before link text
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after link text
   */
  rightIcon?: React.ReactNode;
  /**
   * If true, opens link in new tab
   * @default false
   */
  external?: boolean;
  /**
   * If true or string, triggers browser download
   * @default false
   */
  download?: boolean | string;

  /**
   * Hover color variant or custom color string.
   * Preset tokens get theme-aware CSS classes; any other string is applied as a CSS custom property.
   */
  hoverColor?: 'primary' | 'secondary' | 'neutral' | 'inherit' | (string & {});

  children?: React.ReactNode;
}

/**
 * Link component - Hyperlink with routing library support
 *
 * A flexible link component that works with native anchors, React Router, Next.js,
 * or any custom routing library. Supports text variants and theming.
 *
 * @example
 * Basic usage (native link)
 * ```tsx
 * <Link href="/about">About Us</Link>
 * ```
 *
 * @example
 * With React Router
 * ```tsx
 * import { Link as RouterLink } from 'react-router-dom'
 * <Link component={RouterLink} to="/dashboard">Dashboard</Link>
 * ```
 *
 * @example
 * With Next.js
 * ```tsx
 * import NextLink from 'next/link'
 * <Link component={NextLink} href="/profile">Profile</Link>
 * ```
 *
 * @example
 * With variants and icons
 * ```tsx
 * <Link 
 *   href="/downloads" 
 *   variant="h6"
 *   leftIcon={<DownloadIcon />}
 * >
 *   Download
 * </Link>
 * ```
 *
 * @example
 * External link
 * ```tsx
 * <Link href="https://example.com" external>
 *   Visit Website
 * </Link>
 * ```
 */
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      children,
      href,
      component,
      componentProps = {},
      variant = 'body1',
      noUnderline = true,
      disabled = false,
      color = 'inherit',
      hoverColor,
      leftIcon,
      rightIcon,
      external = false,
      download,
      className = '',
      target,
      rel,
      style,
      onClick: onClickProp, // destructured so {...restProps} below never overrides the disabled guard
      ...restProps
    },
    ref
  ) => {
    // useContext returns undefined when no ThemeProvider wraps the tree — no try/catch needed.
    const themeContext = useContext(ThemeContext);

    // External links, target, or download always need a native <a> tag.
    const shouldUseAnchor = external || target !== undefined || download !== undefined;

    // When disabled, always fall back to native <a> without href so routing libraries
    // (React Router, Next.js) cannot trigger navigation via keyboard or programmatic calls.
    const effectiveComponent =
      disabled || shouldUseAnchor
        ? null
        : (component || themeContext?.theme.adapters.linkComponent);

    const isStandardHoverColor =
      hoverColor && ['primary', 'secondary', 'neutral', 'inherit'].includes(hoverColor);
    const isCustomHoverColor = hoverColor && !isStandardHoverColor;

    const classNames = [
      'lxs-link',
      `lxs-link--${variant}`,
      `lxs-link--${color}`,
      isStandardHoverColor && `lxs-link--hover-${hoverColor}`,
      isCustomHoverColor   && 'lxs-link--hover-custom',
      noUnderline          && 'lxs-link--no-underline',
      disabled             && 'lxs-link--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const combinedStyle = isCustomHoverColor
      ? { ...style, '--lxs-link-hover-color': hoverColor } as React.CSSProperties
      : style;

    const content = (
      <>
        {leftIcon  && <span className="lxs-link__icon-left">{leftIcon}</span>}
        <span className="lxs-link__content">{children}</span>
        {rightIcon && <span className="lxs-link__icon-right">{rightIcon}</span>}
      </>
    );

    // ── Custom component path (React Router, Next.js, etc.) ──────────────────
    if (effectiveComponent) {
      const Component = effectiveComponent;
      return (
        <Component
          ref={ref}
          // componentProps is lowest priority: explicit props & restProps win.
          {...componentProps}
          href={href}
          className={classNames}
          aria-disabled={disabled}
          style={combinedStyle}
          onClick={onClickProp}
          {...restProps}
        >
          {content}
        </Component>
      );
    }

    // ── Native <a> path (default, external, download, disabled) ─────────────
    const linkTarget = external ? '_blank' : target;
    const linkRel    = external ? 'noopener noreferrer' : rel;

    return (
      <a
        ref={ref}
        // Disabled anchors must not carry an href so browsers / AT treat them as inert.
        href={disabled ? undefined : href}
        target={linkTarget}
        rel={linkRel}
        className={classNames}
        aria-disabled={disabled}
        // Guard click BEFORE spreading restProps so users cannot accidentally re-enable it.
        onClick={disabled ? (e) => e.preventDefault() : onClickProp}
        download={download}
        style={combinedStyle}
        {...restProps}
      >
        {content}
      </a>
    );
  }
);

Link.displayName = 'Link';

export { Link };
export default Link;

