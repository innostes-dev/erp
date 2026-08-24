"use client";

import { CloseSmallIcon } from '../../icons/IconComponents';
import React, { useMemo, HTMLAttributes } from 'react';
import { Size, useThemeContext } from '../../theme';
import './Badge.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Visual variant of the badge
   * @default 'neutral'
   */
  variant?: 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /**
   * Size of the badge
   * @default theme.global.size
   */
  size?: Size;
  /**
   * If true, badge will be pill-shaped with rounded ends
   * @default false
   */
  pill?: boolean;
  /**
   * If true, applies larger border radius for rounded appearance
   * @default false
   */
  rounded?: boolean;
  /**
   * If true, displays a dot indicator before the content
   * Useful for status indicators
   * @default false
   */
  dot?: boolean;
  /**
   * If true, displays the badge with an outline style instead of filled
   * @default false
   */
  outline?: boolean;
  /**
   * If false, uses solid variant color as background with contrasting text
   * If true, uses light variant color with darker text
   * @default true
   */
  lightMode?: boolean;
  /**
   * If true/false, applies dark or light text color class
   * Overrides automatic contrast color selection
   */
  darkText?: boolean;
  /**
   * Maximum content length before truncation
   * Useful for limiting badge text length
   */
  maxLength?: number;
  /**
   * Icon to display before the badge content
   */
  icon?: React.ReactNode;
  /**
   * Badge content - text, numbers, or custom elements
   */
  children: React.ReactNode;
  /**
   * Callback fired when badge is clicked
   */
  onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Badge component - Small labels and indicators for status, counts, or categories
 *
 * A versatile badge component that can display status indicators, counts, tags, or any short text
 * with various visual styles and customization options.
 *
 * @example
 * Basic status badges
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error" dot>Error</Badge>
 * <Badge variant="primary" pill>NEW</Badge>
 * ```
 *
 * @example
 * With icon and outline
 * ```tsx
 * <Badge variant="info" icon={<InfoIcon />} outline>
 *   Information
 * </Badge>
 * ```
 *
 * @example
 * Removable badge
 * ```tsx
 * <Badge variant="primary" onRemove={(e) => handleRemove()}>
 *   Tag 1
 * </Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      size,
      pill = false,
      rounded = false,
      dot = false,
      outline = false,
      lightMode = false,
      darkText = false,
      maxLength,
      icon,
      children,
      className = '',
      onRemove,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const badgeSize = size || theme.global.size;

    // Determine text color based on theme's color contrast configuration
    const getTextColorClass = () => {
      // Skip contrast logic if outline mode or lightMode is true
      if (outline || lightMode) return null;

      if (darkText === true) return 'lxs-badge--dark-text';
      if (darkText === false) return 'lxs-badge--light-text';

      // Use theme's colorContrast configuration
      const contrast = theme.contrast[variant as keyof typeof theme.contrast];
      if (contrast === 'light') {
        return 'lxs-badge--dark-text'; // Light background needs dark text
      } else if (contrast === 'dark') {
        return 'lxs-badge--light-text'; // Dark background needs light text
      }

      return null;
    };

    const classNames = [
      'lxs-badge',
      `lxs-badge--${variant}`,
      `lxs-badge--${badgeSize}`,
      pill && 'lxs-badge--pill',
      rounded && 'lxs-badge--rounded',
      dot && 'lxs-badge--with-dot',
      outline && 'lxs-badge--outline',
      !lightMode && !outline && 'lxs-badge--solid',
      onRemove && 'lxs-badge--removable',
      getTextColorClass(),
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Truncate content if maxLength is specified
    const truncatedContent = useMemo(() => {
      if (maxLength && typeof children === 'string' && children.length > maxLength) {
        return `${children.slice(0, maxLength)}...`;
      }
      return children;
    }, [children, maxLength]);

    return (
      <span ref={ref} className={classNames} {...props}>
        {dot && <span className="lxs-badge-dot" aria-hidden="true" />}
        {icon && (
          <span className="lxs-badge-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="lxs-badge-content">{truncatedContent}</span>
        {onRemove && (
          <button
            type="button"
            className="lxs-badge-remove"
            onClick={onRemove}
            aria-label="Remove badge"
          >
            <CloseSmallIcon />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge as React.FC<BadgeProps & React.RefAttributes<HTMLSpanElement>>;
export { Badge };
