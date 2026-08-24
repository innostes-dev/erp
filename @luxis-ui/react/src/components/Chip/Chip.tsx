"use client";

import { CloseSmallIcon } from '../../icons/IconComponents';
import React, { ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { Size } from '../../theme';
import './Chip.css';

export interface ChipProps {
  /**
   * The label text to display inside the chip
   */
  label: string;
  /**
   * Size of the chip
   * @default 'md'
   */
  size?: Size;
  /**
   * Visual style variant
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined' | 'light';
  /**
   * Color theme of the chip
   * @default 'default'
   */
  color?: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';
  /**
   * Icon to display at the start of the chip
   */
  icon?: ReactNode;
  /**
   * Avatar image URL to display at the start
   */
  avatar?: string;
  /**
   * If true, shows a delete/close button
   * @default false
   */
  onDelete?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Callback when chip is clicked
   */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /**
   * If true, chip cannot be interacted with
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Custom aria-label for accessibility
   */
  'aria-label'?: string;
  /**
   * Data attribute for testing
   */
  'data-testid'?: string;
}

/**
 * Chip component - Compact element for displaying tags, labels, or selections
 *
 * A versatile chip component for representing small pieces of information like tags,
 * filters, selections, or categories with optional delete functionality.
 *
 * @example
 * Basic usage
 * ```tsx
 * <Chip label="React" />
 * ```
 *
 * @example
 * With delete functionality
 * ```tsx
 * <Chip
 *   label="JavaScript"
 *   onDelete={() => handleRemove('js')}
 * />
 * ```
 *
 * @example
 * With avatar
 * ```tsx
 * <Chip
 *   label="John Doe"
 *   avatar="https://avatar.url/john.jpg"
 *   variant="outlined"
 * />
 * ```
 */

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      label,
      size = 'md',
      variant = 'filled',
      color = 'default',
      icon,
      avatar,
      onDelete,
      onClick,
      disabled = false,
      className = '',
      'aria-label': ariaLabel,
      'data-testid': dataTestId
    },
    ref
  ) => {
    const chipClassNames = [
      'lxs-chip',
      `lxs-chip--${size}`,
      `lxs-chip--${variant}`,
      `lxs-chip--${color}`,
      onClick && !disabled && 'lxs-chip--clickable',
      disabled && 'lxs-chip--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
      if (!disabled && onClick) {
        onClick(event);
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (!disabled) {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick(event as any);
        }
        if (onDelete && (event.key === 'Delete' || event.key === 'Backspace')) {
          event.preventDefault();
          onDelete(event as any);
        }
      }
    };

    const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!disabled && onDelete) {
        onDelete(event);
      }
    };

    const handleDeleteKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled && onDelete) {
          onDelete(event as any);
        }
      }
    };

    return (
      <div
        ref={ref}
        className={chipClassNames}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={(onClick || onDelete) && !disabled ? 0 : undefined}
        aria-label={ariaLabel || label}
        aria-disabled={disabled}
        data-testid={dataTestId}
      >
        {avatar && <img src={avatar} alt="" className="lxs-chip__avatar" aria-hidden="true" />}
        {icon && !avatar && (
          <span className="lxs-chip__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="lxs-chip__label">{label}</span>
        {onDelete && (
          <button
            type="button"
            className="lxs-chip__delete"
            onClick={handleDeleteClick}
            onKeyDown={handleDeleteKeyDown}
            disabled={disabled}
            aria-label={`Remove ${label}`}
            tabIndex={-1}
          >
            <CloseSmallIcon size={16} />
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = 'Chip';

export default Chip as React.FC<ChipProps & React.RefAttributes<HTMLDivElement>>;
export { Chip };