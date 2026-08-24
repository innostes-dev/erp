"use client";

import React, { useState, useEffect } from 'react';
import './Rating.css';
import {
  StarFullIcon,
  StarHalfIcon,
  StarEmptyIcon
} from '../../icons/IconComponents';
import { useThemeContext } from '../../theme';

export type RatingSize = 'sm' | 'md' | 'lg' | 'xl';

export interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Current rating value (0-max)
   * @default 0
   */
  value?: number;
  /**
   * Maximum number of stars
   * @default 5
   */
  max?: number;
  /**
   * Size of the rating stars. Falls back to theme defaultSize if not provided.
   * @default theme.global.size
   */
  size?: RatingSize;
  /**
   * Color of filled stars
   * @default 'warning'
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  /**
   * If true, user can select rating
   * @default false
   */
  selectable?: boolean;
  /**
   * If true, allows half-star ratings
   * @default false
   */
  allowHalf?: boolean;
  /**
   * If true, shows the numeric value next to stars
   * @default false
   */
  showValue?: boolean;
  /**
   * Custom format for the displayed value
   * @example (value) => `${value}/5`
   */
  valueFormat?: (value: number) => string;
  /**
   * Callback when rating changes (only for selectable)
   */
  onChange?: (value: number) => void;
  /**
   * If true, rating is read-only even if selectable is true
   * @default false
   */
  readOnly?: boolean;
  /**
   * If true, rating is disabled and non-interactive
   * @default false
   */
  disabled?: boolean;
  /**
   * Custom filled star icon
   */
  filledIcon?: React.ReactNode;
  /**
   * Custom empty star icon
   */
  emptyIcon?: React.ReactNode;
  /**
   * Custom half star icon
   */
  halfIcon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Rating component - Display and input star ratings
 *
 * A versatile rating component that can display star ratings or allow users to select ratings.
 * Supports different sizes, colors, half-star ratings, and custom icons.
 *
 * @example
 * Display rating
 * ```tsx
 * <Rating value={4.5} showValue />
 * ```
 *
 * @example
 * Selectable rating
 * ```tsx
 * <Rating
 *   value={rating}
 *   selectable
 *   onChange={(value) => setRating(value)}
 * />
 * ```
 *
 * @example
 * Half-star ratings
 * ```tsx
 * <Rating value={3.5} allowHalf showValue />
 * ```
 *
 * @example
 * Different sizes and colors
 * ```tsx
 * <Rating value={5} size="lg" color="error" />
 * ```
 */
const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value = 0,
      max = 5,
      size,
      color = 'warning',
      selectable = false,
      allowHalf = false,
      showValue = false,
      valueFormat,
      onChange,
      readOnly = false,
      disabled = false,
      filledIcon,
      emptyIcon,
      halfIcon,
      className = '',
      style,
      onKeyDown: externalKeyDown,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const resolvedSize: RatingSize = size ?? (theme.global.size as RatingSize);

    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const [selectedValue, setSelectedValue] = useState(value);

    // Sync external value changes (controlled component support)
    useEffect(() => {
      setSelectedValue(value);
    }, [value]);

    const currentValue = hoverValue ?? selectedValue; // NOSONAR — hoverValue is intentionally null (not undefined) when unset
    const isInteractive = selectable && !readOnly && !disabled;

    const handleClick = (starIndex: number, isHalf: boolean) => {
      if (!isInteractive) return;
      const newValue = allowHalf && isHalf ? starIndex + 0.5 : starIndex + 1;
      setSelectedValue(newValue);
      onChange?.(newValue);
    };

    const handleMouseEnter = (starIndex: number, isHalf: boolean) => {
      if (!isInteractive) return;
      const newValue = allowHalf && isHalf ? starIndex + 0.5 : starIndex + 1;
      setHoverValue(newValue);
    };

    // On the stars container — avoids flicker when moving between adjacent stars
    const handleStarsMouseLeave = () => {
      if (!isInteractive) return;
      setHoverValue(null);
    };

    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number.parseFloat(e.target.value);
      setSelectedValue(newValue);
      onChange?.(newValue);
    };

    const getStarIcon = (filled: boolean, halfFilled: boolean): React.ReactNode => {
      if (filled && filledIcon) return filledIcon;
      if (halfFilled && halfIcon) return halfIcon;
      if (!filled && !halfFilled && emptyIcon) return emptyIcon;
      if (filled) return <StarFullIcon />;
      if (halfFilled) return <StarHalfIcon />;
      return <StarEmptyIcon />;
    };

    const getStarStateClass = (filled: boolean, halfFilled: boolean): string => {
      if (filled) return 'lxs-rating-star--filled';
      if (halfFilled) return 'lxs-rating-star--half';
      return 'lxs-rating-star--empty';
    };

    const renderStar = (starIndex: number) => {
      const starValue = starIndex + 1;
      const filled = currentValue >= starValue;
      const halfFilled = allowHalf && currentValue >= starIndex + 0.5 && currentValue < starValue;
      const wrapperClass = `lxs-rating-star-wrapper${isInteractive ? ' lxs-rating-star-wrapper--interactive' : ''}`;
      const starClass = `lxs-rating-star ${getStarStateClass(filled, halfFilled)}`;

      return (
        <div key={starIndex} className={wrapperClass}>
          {/* Half-click overlay — aria-hidden; keyboard nav handled by the hidden range input */}
          {allowHalf && (
            <div
              className="lxs-rating-star-half"
              aria-hidden="true"
              onClick={() => handleClick(starIndex, true)}
              onMouseEnter={() => handleMouseEnter(starIndex, true)}
            />
          )}

          {/* Full-click overlay — aria-hidden; keyboard nav handled by the hidden range input */}
          <div
            className="lxs-rating-star-full"
            aria-hidden="true"
            onClick={() => handleClick(starIndex, false)}
            onMouseEnter={() => handleMouseEnter(starIndex, false)}
          />

          <span className={starClass} aria-hidden="true">
            {getStarIcon(filled, halfFilled)}
          </span>
        </div>
      );
    };

    const decimalPlaces = allowHalf ? 1 : 0;
    const displayValue = valueFormat ? valueFormat(currentValue) : currentValue.toFixed(decimalPlaces);

    const ratingClasses = [
      'lxs-rating',
      `lxs-rating--${resolvedSize}`,
      `lxs-rating--${color}`,
      isInteractive && 'lxs-rating--selectable',
      readOnly && 'lxs-rating--readonly',
      disabled && 'lxs-rating--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const defaultAriaLabel = `Rating: ${selectedValue} out of ${max}`;

    return (
      <div
        aria-label={defaultAriaLabel}
        aria-disabled={disabled || undefined}
        {...props}
        ref={ref}
        className={ratingClasses}
        style={style}
      >
        {/* Hidden native range input — provides keyboard navigation and screen reader support */}
        {isInteractive && (
          <input
            type="range"
            className="lxs-rating-input"
            min={0}
            max={max}
            step={allowHalf ? 0.5 : 1}
            value={selectedValue}
            aria-label={defaultAriaLabel}
            aria-valuetext={`${selectedValue} out of ${max} stars`}
            onChange={handleRangeChange}
            onKeyDown={externalKeyDown}
          />
        )}
        {/* aria-hidden — screen readers use the range input above; these stars are purely visual */}
        <div className="lxs-rating-stars" aria-hidden="true" onMouseLeave={handleStarsMouseLeave}>
          {Array.from({ length: max }, (_, index) => renderStar(index))}
        </div>
        {showValue && <span className="lxs-rating-value">{displayValue}</span>}
      </div>
    );
  }
);

Rating.displayName = 'Rating';

export default Rating;
export { Rating };
