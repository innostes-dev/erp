"use client";

import React, { useId, useRef, useImperativeHandle, useEffect } from 'react';
import { useThemeContext } from '../../theme/ThemeProvider';
import './Checkbox.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * If true, the checkbox is checked
   */
  checked?: boolean;
  /**
   * If true, the checkbox appears indeterminate
   * @default false
   */
  indeterminate?: boolean;
  /**
   * If true, the checkbox is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * The label for the checkbox
   */
  label?: React.ReactNode;
  /**
   * The size of the checkbox
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * The variant of the checkbox
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  /**
   * If true, displays error styling
   * @default false
   */
  error?: boolean;
  /**
   * Helper text displayed below the checkbox
   */
  helperText?: React.ReactNode;
  /**
   * Callback fired when the state is changed
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Additional CSS class name for the container
   */
  className?: string;
  /**
   * Additional CSS class name for the visual checkbox box
   */
  boxClassName?: string;
}

/**
 * Checkbox component - Allows users to select one or more items from a set
 *
 * The Checkbox component provides a customizable checkbox input with support
 * for labels, error states, indeterminate state, and three sizes.
 *
 * ## CSS Customization
 *
 * You can customize the checkbox appearance using CSS custom properties:
 *
 * ```css
 * :root {
 *   --lxs-checkbox-color: #1976d2;
 *   --lxs-checkbox-size: 20px;
 *   --lxs-checkbox-border-width: 2px;
 *   --lxs-checkbox-border-radius: 4px;
 * }
 * ```
 *
 * @example
 * Basic checkbox
 * ```tsx
 * <Checkbox label="Accept terms and conditions" />
 * ```
 *
 * @example
 * Controlled checkbox with size
 * ```tsx
 * const [checked, setChecked] = useState(false);
 * <Checkbox
 *   checked={checked}
 *   onChange={(e) => setChecked(e.target.checked)}
 *   label="Subscribe to newsletter"
 *   size="lg"
 *   variant="secondary"
 * />
 * ```
 *
 * @example
 * With error state
 * ```tsx
 * <Checkbox
 *   label="I agree"
 *   error
 *   helperText="You must agree to continue"
 * />
 * ```
 *
 * @example
 * Indeterminate state
 * ```tsx
 * <Checkbox
 *   label="Select all"
 *   indeterminate
 * />
 * ```
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      indeterminate = false,
      disabled = false,
      label,
      size,
      variant = 'primary',
      error = false,
      helperText,
      onChange,
      className = '',
      boxClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    // Get theme default size if size prop is not provided
    const { theme } = useThemeContext();
    const checkboxSize = size || theme.global.size || 'md';
    
    const generatedId = useId();
    const checkboxId = id || generatedId;

    // Build class names
    const containerClassNames = [
      'lxs-checkbox',
      `lxs-checkbox--${checkboxSize}`,
      `lxs-checkbox--${variant}`,
      disabled && 'lxs-checkbox--disabled',
      error && 'lxs-checkbox--error',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Handle ref for indeterminate state
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current!);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <div className={containerClassNames}>
        <label className="lxs-checkbox-label" htmlFor={checkboxId}>
          <span className="lxs-checkbox-wrapper">
            <input
              ref={inputRef}
              type="checkbox"
              id={checkboxId}
              className="lxs-checkbox-input"
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              {...props}
            />
            <span className={['lxs-checkbox-box', boxClassName].filter(Boolean).join(' ')}>
              {/* Check icon */}
              <svg
                className="lxs-checkbox-icon lxs-checkbox-icon--check"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {/* Indeterminate icon */}
              <svg
                className="lxs-checkbox-icon lxs-checkbox-icon--indeterminate"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </span>
          {label && <span className="lxs-checkbox-label-text">{label}</span>}
        </label>
        {helperText && <div className="lxs-checkbox-helper-text">{helperText}</div>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox as React.FC<CheckboxProps & React.RefAttributes<HTMLInputElement>>;
export { Checkbox };