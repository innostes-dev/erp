import { CloseSmallIcon } from '../../icons/IconComponents';
import React, { InputHTMLAttributes } from 'react';
import { useId } from '../../hooks';
import { Size, useThemeContext } from '../../theme';
import './Input.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Label text displayed above the input
   */
  label?: string;
  /**
   * Helper text displayed below the input
   * Provides additional context or instructions
   */
  helperText?: string;
  /**
   * Error message - when provided, input is shown in error state
   * Takes precedence over helperText when both are present
   */
  error?: string;
  /**
   * Success message - when provided, input is shown in success state
   */
  success?: string;
  /**
   * Size of the input
   * @default theme.global.size
   */
  size?: Size;
  /**
   * If true, input will take full width of its container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Icon or element to display at the start of the input
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon or element to display at the end of the input
   */
  rightIcon?: React.ReactNode;
  /**
   * If true, shows a clear button when input has value
   * @default false
   */
  clearable?: boolean;
  /**
   * Callback fired when clear button is clicked
   */
  onClear?: () => void;
  /**
   * If true, adds a character counter below the input
   * Requires maxLength prop to be set
   * @default false
   */
  showCount?: boolean;
  /**
   * Custom class name for the wrapper element
   */
  wrapperClassName?: string;
  /**
   * Custom class name for the label element
   */
  labelClassName?: string;
  /**
   * Custom class name for the input element itself
   */
  inputClassName?: string;
  /**
   * Prefix text to display before input value
   */
  prefix?: string;
  /**
   * Suffix text to display after input value
   */
  suffix?: string;
}

/**
 * Input component - Text input field with label, helper text, validation states, and rich features
 *
 * A comprehensive input component with support for icons, prefixes, suffixes, character counting,
 * clear functionality, and various validation states.
 *
 * @example
 * Basic usage
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   helperText="We'll never share your email"
 * />
 * ```
 *
 * @example
 * With error state
 * ```tsx
 * <Input
 *   label="Username"
 *   error="Username is already taken"
 *   value={username}
 *   onChange={(e) => setUsername(e.target.value)}
 * />
 * ```
 *
 * @example
 * With icons and clear button
 * ```tsx
 * <Input
 *   label="Search"
 *   leftIcon={<SearchIcon />}
 *   clearable
 *   onClear={() => setSearch('')}
 * />
 * ```
 *
 * @example
 * With character counter
 * ```tsx
 * <Input
 *   label="Bio"
 *   maxLength={100}
 *   showCount
 *   value={bio}
 *   onChange={(e) => setBio(e.target.value)}
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size,
      fullWidth = false,
      leftIcon,
      rightIcon,
      clearable = false,
      onClear,
      showCount = false,
      className = '',
      wrapperClassName = '',
      labelClassName = '',
      inputClassName = '',
      prefix,
      suffix,
      id: providedId,
      disabled = false,
      required = false,
      value,
      maxLength,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const inputSize = size || theme.global.size;
    
    const generatedId = useId('input');
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const successId = `${id}-success`;

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const showClearButton = clearable && value && String(value).length > 0 && !disabled;

    const describedBy = [
      helperText && !error && !success && helperId,
      error && errorId,
      success && successId,
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClassNames = [
      'lxs-input-wrapper',
      fullWidth && 'lxs-input-wrapper--full-width',
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const inputContainerClassNames = [
      'lxs-input-container',
      `lxs-input-container--${inputSize}`,
      hasError && 'lxs-input-container--error',
      hasSuccess && 'lxs-input-container--success',
      disabled && 'lxs-input-container--disabled',
      (leftIcon || prefix) && 'lxs-input-container--with-left-element',
      (rightIcon || suffix || showClearButton) && 'lxs-input-container--with-right-element',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleClear = () => {
      onClear?.();
    };

    const currentLength = value ? String(value).length : 0;
    const showCounter = showCount && maxLength;

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={id} className={`lxs-input-label ${labelClassName}`.trim()}>
            {label}
            {required && (
              <span className="lxs-input-label__required" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <div className={inputContainerClassNames}>
          {leftIcon && (
            <span className="lxs-input-icon lxs-input-icon--left" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          {prefix && (
            <span className="lxs-input-prefix" aria-hidden="true">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={`lxs-input ${inputClassName}`.trim()}
            disabled={disabled}
            required={required}
            value={value}
            maxLength={maxLength}
            aria-invalid={hasError}
            aria-describedby={describedBy || undefined}
            {...props}
          />
          {suffix && (
            <span className="lxs-input-suffix" aria-hidden="true">
              {suffix}
            </span>
          )}
          {showClearButton && (
            <button
              type="button"
              className="lxs-input-clear"
              onClick={handleClear}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <CloseSmallIcon size={16} />
            </button>
          )}
          {rightIcon && !showClearButton && (
            <span className="lxs-input-icon lxs-input-icon--right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {helperText && !error && !success && (
          <p id={helperId} className="lxs-input-helper">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="lxs-input-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p id={successId} className="lxs-input-success" role="status">
            {success}
          </p>
        )}
        {showCounter && (
          <p className="lxs-input-counter" aria-live="polite">
            {currentLength} / {maxLength}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input as React.FC<InputProps & React.RefAttributes<HTMLInputElement>>;
export { Input };
