"use client";

import React, { ButtonHTMLAttributes } from 'react';
import { useThemeContext } from '../../theme/ThemeProvider';
import { Size } from '../../theme';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  /**
   * Size of the button
   * @default 'md'
   */
  size?: Size;
  /**
   * If true, button will take full width of its container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Loading state - shows loading indicator and disables interaction
   * When true, the button becomes unclickable and shows a spinner
   * @default false
   */
  loading?: boolean;
  /**
   * Icon to display before button text
   * Pass any React node (icon component, emoji, etc.)
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after button text
   * Pass any React node (icon component, emoji, etc.)
   */
  rightIcon?: React.ReactNode;
  /**
   * If true, renders the button as an icon-only button (no text padding)
   * Content should be an icon element
   * @default false
   */
  iconOnly?: boolean;
  /**
   * Custom loading text to display when loading is true
   * @default undefined (uses children content)
   */
  loadingText?: string;
  /**
   * If true, renders button as a link element with button styling
   * Requires href prop when true
   * @default false
   */
  asLink?: boolean;
  /**
   * URL when rendering as link (requires asLink=true)
   */
  href?: string;
  /**
   * Target attribute when rendering as link
   */
  target?: string;
  /**
   * Rel attribute when rendering as link
   */
  rel?: string;

  /**
   * Optional text color for the button
   */
  textColor?: string;

  /**
   * If true/false, applies dark or light text color class
   */
  darkText?: boolean;

  /**
   * Shape of the button
   * @default 'default'
   */
  shape?: 'default' | 'pill' | 'square';

  children?: React.ReactNode;
}

/**
 * Button component - Primary interactive element for user actions
 *
 * A comprehensive button component with multiple variants, sizes, loading states,
 * and icon support. Can also render as a link with button styling.
 *
 * @example
 * Basic usage
 * ```tsx
 * <Button variant="primary" size="medium" onClick={() => console.log('clicked')}>
 *   Click me
 * </Button>
 * ```
 *
 * @example
 * With icons
 * ```tsx
 * <Button variant="primary" leftIcon={<SaveIcon />}>
 *   Save Changes
 * </Button>
 * <Button variant="secondary" rightIcon={<ArrowIcon />}>
 *   Next
 * </Button>
 * ```
 *
 * @example
 * Loading state
 * ```tsx
 * <Button loading loadingText="Saving...">
 *   Save
 * </Button>
 * ```
 *
 * @example
 * As link
 * ```tsx
 * <Button asLink href="/dashboard" variant="primary">
 *   Go to Dashboard
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size,
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      loadingText,
      asLink = false,
      href,
      target,
      rel,
      className = '',
      type = 'button',
      darkText,
      textColor,
      shape = 'default',
      ...props
    },
    ref
  ) => {
    // Get theme default size if size prop is not provided
    const { theme } = useThemeContext();
    const buttonSize = size || theme.global.size || 'md';

    // Determine text color based on theme's color contrast configuration
    const getTextColorClass = () => {
      if (darkText === true) return 'lxs-button--dark-text';
      if (darkText === false) return 'lxs-button--light-text';
      
      // Use theme's colorContrast configuration
      const contrast = theme.contrast[variant];
      if (contrast === 'light') {
        return 'lxs-button--dark-text'; // Light background needs dark text
      } else if (contrast === 'dark') {
        return 'lxs-button--light-text'; // Dark background needs light text
      }
      
      return null;
    };

    const classNames = [
      'lxs-button',
      `lxs-button--${variant}`,
      `lxs-button--${buttonSize}`,
      shape !== 'default' && `lxs-button--shape-${shape}`,
      fullWidth && 'lxs-button--full-width',
      loading && 'lxs-button--loading',
      iconOnly && 'lxs-button--icon-only',
      getTextColorClass(),
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Inline style for text color override
    const style = props.style ? { ...props.style } : {};
    if (textColor) {
      style.color = textColor;
    }

    const content = (
      <>
        {loading && (
          <span className="lxs-button__spinner" role="status" aria-label="Loading">
            <svg className="lxs-button__spinner-icon" viewBox="0 0 24 24">
              <circle
                className="lxs-button__spinner-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="3"
              />
            </svg>
          </span>
        )}
        {!loading && leftIcon && <span className="lxs-button__icon-left">{leftIcon}</span>}
        {!iconOnly && (
          <span className="lxs-button__content">
            {loading && loadingText ? loadingText : children}
          </span>
        )}
        {iconOnly && !loading && children}
        {!loading && rightIcon && <span className="lxs-button__icon-right">{rightIcon}</span>}
      </>
    );

    if (asLink && href) {
      return (
        <a
          ref={ref as any}
          href={disabled ? undefined : href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : rel}
          className={classNames}
          aria-disabled={disabled || loading}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          style={style}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as any}
        type={type}
        className={classNames}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
        style={style}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
export { Button };
