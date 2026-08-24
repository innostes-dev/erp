import { CloseSmallIcon } from '../../icons/IconComponents';
import React, { TextareaHTMLAttributes, useCallback, useEffect, useRef } from 'react';
import { useId } from '../../hooks';
import { Size, useThemeContext } from '../../theme';
import './Textarea.css';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /**
   * Label text displayed above the textarea
   */
  label?: string;
  /**
   * Helper text displayed below the textarea
   * Provides additional context or instructions
   */
  helperText?: string;
  /**
   * Error message - when provided, textarea is shown in error state
   * Takes precedence over helperText when both are present
   */
  error?: string;
  /**
   * Success message - when provided, textarea is shown in success state
   */
  success?: string;
  /**
   * Size of the textarea
   * @default theme.global.size
   */
  size?: Size;
  /**
   * If true, textarea will take full width of its container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * If true, shows a clear button when textarea has value
   * @default false
   */
  clearable?: boolean;
  /**
   * Callback fired when clear button is clicked
   */
  onClear?: () => void;
  /**
   * If true, shows a character counter below the textarea.
   * Counter is also shown automatically when maxLength is set.
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
   * Custom class name for the textarea element itself
   */
  textareaClassName?: string;
  /**
   * Number of visible text rows
   * @default 4
   */
  rows?: number;
  /**
   * Controls resize behaviour of the textarea
   * @default 'vertical'
   */
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  /**
   * If true, the textarea grows automatically to fit its content
   * @default false
   */
  autoResize?: boolean;
}

/**
 * Textarea component - Multi-line text input with label, helper text, validation states, and rich features
 *
 * A comprehensive textarea component with support for character counting, clear functionality,
 * auto-resize, and various validation states.
 *
 * @example
 * Basic usage
 * ```tsx
 * <Textarea
 *   label="Message"
 *   placeholder="Enter your message"
 *   helperText="Be as detailed as you like"
 * />
 * ```
 *
 * @example
 * With character counter
 * ```tsx
 * <Textarea
 *   label="Bio"
 *   maxLength={200}
 *   value={bio}
 *   onChange={(e) => setBio(e.target.value)}
 * />
 * ```
 *
 * @example
 * With error state
 * ```tsx
 * <Textarea
 *   label="Description"
 *   error="Description is required"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 * />
 * ```
 *
 * @example
 * Auto-resize
 * ```tsx
 * <Textarea
 *   label="Notes"
 *   autoResize
 *   value={notes}
 *   onChange={(e) => setNotes(e.target.value)}
 * />
 * ```
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size,
      fullWidth = false,
      clearable = false,
      onClear,
      showCount = false,
      className = '',
      wrapperClassName = '',
      labelClassName = '',
      textareaClassName = '',
      rows = 4,
      resize = 'vertical',
      autoResize = false,
      id: providedId,
      disabled = false,
      required = false,
      value,
      maxLength,
      onChange,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const textareaSize = size || theme.global.size;

    const generatedId = useId('textarea');
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const successId = `${id}-success`;

    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const currentLength = value === undefined ? 0 : String(value).length;
    // Show counter whenever maxLength is explicitly set, or when showCount is true
    const showCounter = showCount || maxLength !== undefined;
    const showClearButton = clearable && value !== undefined && String(value).length > 0 && !disabled;

    const describedBy = [
      helperText && !error && !success && helperId,
      error && errorId,
      success && successId,
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClassNames = [
      'lxs-textarea-wrapper',
      fullWidth && 'lxs-textarea-wrapper--full-width',
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const containerClassNames = [
      'lxs-textarea-container',
      `lxs-textarea-container--${textareaSize}`,
      hasError && 'lxs-textarea-container--error',
      hasSuccess && 'lxs-textarea-container--success',
      disabled && 'lxs-textarea-container--disabled',
      showClearButton && 'lxs-textarea-container--clearable',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const applyAutoResize = useCallback((el: HTMLTextAreaElement) => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    // Apply auto-resize on mount and value changes
    useEffect(() => {
      if (autoResize && internalRef.current) {
        applyAutoResize(internalRef.current);
      }
    }, [value, autoResize, applyAutoResize]);

    const handleRef = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        applyAutoResize(e.currentTarget);
      }
      onChange?.(e);
    };

    const handleClear = () => {
      if (internalRef.current) {
        // Trigger a synthetic change event so controlled state updates
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          'value'
        )?.set;
        nativeInputValueSetter?.call(internalRef.current, '');
        internalRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
      onClear?.();
      internalRef.current?.focus();
    };

    const isNearLimit = maxLength !== undefined && currentLength >= maxLength * 0.9;
    const isAtLimit = maxLength !== undefined && currentLength >= maxLength;

    const getCounterClass = (): string => {
      if (isAtLimit) return 'lxs-textarea-counter lxs-textarea-counter--at-limit';
      if (isNearLimit) return 'lxs-textarea-counter lxs-textarea-counter--near-limit';
      return 'lxs-textarea-counter';
    };

    const counterDisplay = maxLength === undefined
      ? `${currentLength}`
      : `${currentLength} / ${maxLength}`;

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={id} className={`lxs-textarea-label ${labelClassName}`.trim()}>
            {label}
            {required && (
              <span className="lxs-textarea-label__required" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <div className={containerClassNames}>
          <textarea
            ref={handleRef}
            id={id}
            className={`lxs-textarea ${textareaClassName}`.trim()}
            disabled={disabled}
            required={required}
            value={value}
            maxLength={maxLength}
            rows={autoResize ? undefined : rows}
            aria-invalid={hasError}
            aria-describedby={describedBy || undefined}
            style={{ resize: autoResize ? 'none' : resize }}
            onChange={handleChange}
            {...props}
          />
          {showClearButton && (
            <button
              type="button"
              className="lxs-textarea-clear"
              onClick={handleClear}
              aria-label="Clear textarea"
              tabIndex={-1}
            >
              <CloseSmallIcon size={16} />
            </button>
          )}
        </div>
        <div className="lxs-textarea-footer">
          <div className="lxs-textarea-footer-left">
            {helperText && !error && !success && (
              <p id={helperId} className="lxs-textarea-helper">
                {helperText}
              </p>
            )}
            {error && (
              <p id={errorId} className="lxs-textarea-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <output id={successId} className="lxs-textarea-success">
                {success}
              </output>
            )}
          </div>
          {showCounter && (
            <p className={getCounterClass()} aria-live="polite">
              {counterDisplay}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea as React.FC<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;
export { Textarea };
