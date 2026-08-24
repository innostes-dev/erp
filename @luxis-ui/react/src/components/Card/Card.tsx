"use client";

import React from 'react';
import { useThemeContext, Size } from '../../theme';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content of the card
   */
  children: React.ReactNode;
  /**
   * The variant of the card
   * @default 'elevated'
   */
  variant?: 'elevated' | 'outlined' | 'filled';
  /**
   * Size of the card
   * @default 'md'
   */
  size?: Size;
  /**
   * If true, removes padding from the card
   * @default false
   */
  noPadding?: boolean;
  /**
   * Custom padding value (e.g., '16px', '1rem', '0')
   * Overrides noPadding when provided
   */
  padding?: string;
  /**
   * If true, makes the card hoverable with interaction effects
   * @default false
   */
  hoverable?: boolean;
  /**
   * If true, makes the card clickable (adds cursor pointer)
   * @default false
   */
  clickable?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Header content for the card
   */
  header?: React.ReactNode;
  /**
   * Footer content for the card
   */
  footer?: React.ReactNode;
  /**
   * If true, adds dividers between header, content, and footer
   * @default false
   */
  divider?: boolean;
}

/**
 * Card component - Container for grouping related content
 *
 * A versatile card component with support for variants, padding control,
 * headers, footers, and interactive states.
 *
 * @example
 * Basic card
 * ```tsx
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 *
 * @example
 * Card without padding
 * ```tsx
 * <Card noPadding>
 *   <img src="image.jpg" alt="Full bleed image" />
 * </Card>
 * ```
 *
 * @example
 * Card with custom padding
 * ```tsx
 * <Card padding="32px">
 *   <p>Card with custom padding</p>
 * </Card>
 * ```
 *
 * @example
 * Card with header and footer
 * ```tsx
 * <Card
 *   header={<h3>Card Header</h3>}
 *   footer={<button>Action</button>}
 *   divider
 * >
 *   <p>Card content</p>
 * </Card>
 * ```
 *
 * @example
 * Interactive card
 * ```tsx
 * <Card hoverable clickable onClick={() => console.log('clicked')}>
 *   <p>Click me!</p>
 * </Card>
 * ```
 *
 * @example
 * Customize appearance with CSS
 * ```css
 * .lxs-card {
 *   --lxs-card-bg: #ffffff;
 *   --lxs-card-border-radius: 8px;
 *   --lxs-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
 *   --lxs-card-padding: 16px;
 * }
 * ```
 */

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'elevated',
      size,
      noPadding = false,
      padding,
      hoverable = false,
      clickable = false,
      className = '',
      header,
      footer,
      divider = false,
      style,
      onClick,
      tabIndex,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const cardSize = size || theme?.global?.size || 'md';

    // Compose class names
    const cardClassNames = [
      'lxs-card',
      `lxs-card--${variant}`,
      `lxs-card--${cardSize}`,
      hoverable ? 'lxs-card--hoverable' : '',
      clickable ? 'lxs-card--clickable' : '',
      noPadding && !padding ? 'lxs-card--no-padding' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Compose style, ensuring custom property is set if padding is provided
    const customStyle: React.CSSProperties = {
      ...(style || {}),
      ...(padding ? { ['--lxs-card-padding' as any]: padding } : {}),
    };

    // If clickable, set tabIndex to 0 by default unless provided
    const computedTabIndex = clickable ? (typeof tabIndex === 'number' ? tabIndex : 0) : tabIndex;

    return (
      <div
        ref={ref}
        className={cardClassNames}
        style={customStyle}
        onClick={onClick}
        tabIndex={computedTabIndex}
        {...props}
      >
        {header && (
          <div className={`lxs-card-header${divider ? ' lxs-card-header--divider' : ''}`}>
            {header}
          </div>
        )}
        <div className="lxs-card-content">{children}</div>
        {footer && (
          <div className={`lxs-card-footer${divider ? ' lxs-card-footer--divider' : ''}`}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card as React.FC<CardProps & React.RefAttributes<HTMLDivElement>>;
export { Card };