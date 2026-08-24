import React from 'react';
import { useId } from '../../hooks';
import { Size } from '../../theme';
import './FormControl.css';

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Label text displayed above the form field
   */
  label?: string;
  /**
   * Helper text displayed below the form field
   * Provides additional context or instructions
   */
  helperText?: string;
  /**
   * Error message - when provided, field is shown in error state
   * Takes precedence over helperText when both are present
   */
  error?: string;
  /**
   * Success message - when provided, field is shown in success state
   */
  success?: string;
  /**
   * Size of the form control
   * Passed to child components if they support size prop
   * @default theme.global.size
   */
  size?: Size;
  /**
   * If true, form control will take full width of its container
   * @default true
   */
  fullWidth?: boolean;
  /**
   * If true, adds required indicator to label
   * @default false
   */
  required?: boolean;
  /**
   * If true, applies disabled styling
   * @default false
   */
  disabled?: boolean;
  /**
   * Custom class name for the wrapper element
   */
  wrapperClassName?: string;
  /**
   * Custom class name for the label element
   */
  labelClassName?: string;
  /**
   * Spacing between form controls when stacked
   * @default 'md'
   */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Form control children (Input, Textarea, Select, etc.)
   */
  children: React.ReactNode;
  /**
   * Custom id for accessibility
   */
  id?: string;
  /**
   * Position of the label
   * @default 'top'
   */
  labelPosition?: 'top' | 'left';
}

/**
 * FormControl component - Wrapper for form inputs with consistent spacing and layout
 *
 * Provides consistent label, helper text, error handling, and spacing for all form inputs.
 * Works with Input, Textarea, Select, RichTextEditor, and custom form components.
 *
 * @example
 * Basic usage
 * ```tsx
 * <FormControl label="Email" helperText="Enter your email address">
 *   <Input type="email" placeholder="you@example.com" />
 * </FormControl>
 * ```
 *
 * @example
 * With error state
 * ```tsx
 * <FormControl label="Password" error="Password is required" required>
 *   <Input type="password" />
 * </FormControl>
 * ```
 *
 * @example
 * Form with multiple fields
 * ```tsx
 * <div>
 *   <FormControl label="First Name" required>
 *     <Input />
 *   </FormControl>
 *   <FormControl label="Last Name" required>
 *     <Input />
 *   </FormControl>
 *   <FormControl label="Bio" helperText="Tell us about yourself">
 *     <Textarea />
 *   </FormControl>
 * </div>
 * ```
 *
 * @example
 * Horizontal label
 * ```tsx
 * <FormControl label="Email" labelPosition="left">
 *   <Input type="email" />
 * </FormControl>
 * ```
 */
const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size,
      fullWidth = true,
      required = false,
      disabled = false,
      wrapperClassName = '',
      labelClassName = '',
      spacing = 'md',
      children,
      id: providedId,
      labelPosition = 'top',
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId('form-control');
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const successId = `${id}-success`;

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;

    const wrapperClassNames = [
      'lxs-form-control',
      `lxs-form-control--spacing-${spacing}`,
      `lxs-form-control--label-${labelPosition}`,
      fullWidth && 'lxs-form-control--full-width',
      hasError && 'lxs-form-control--error',
      hasSuccess && 'lxs-form-control--success',
      disabled && 'lxs-form-control--disabled',
      wrapperClassName,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={wrapperClassNames} {...props}>
        <div className="lxs-form-control__inner">
          {label && (
            <label
              htmlFor={`${id}-input`}
              className={`lxs-form-control__label ${labelClassName}`.trim()}
            >
              {label}
              {required && (
                <span className="lxs-form-control__label-required" aria-label="required">
                  {' '}
                  *
                </span>
              )}
            </label>
          )}
          <div className="lxs-form-control__field">{children}</div>
        </div>
        {(helperText || error || success) && (
          <div className="lxs-form-control__messages">
            {helperText && !error && !success && (
              <p id={helperId} className="lxs-form-control__helper">
                {helperText}
              </p>
            )}
            {error && (
              <p id={errorId} className="lxs-form-control__error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p id={successId} className="lxs-form-control__success" role="status">
                {success}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

FormControl.displayName = 'FormControl';

export default FormControl as React.FC<FormControlProps & React.RefAttributes<HTMLDivElement>>;
export { FormControl };