"use client";

import React, { useId } from 'react';
import { Size, useThemeContext } from '../../theme';
import './Radio.css';

export interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> {
  /**
   * If true, the radio is checked
   */
  checked?: boolean;
  /**
   * If true, the radio is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * The label for the radio
   */
  label?: React.ReactNode;
  /**
   * The size of the radio
   * @default theme.global.size
   */
  size?: Size;
  /**
   * The variant of the radio
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  /**
   * If true, displays error styling
   * @default false
   */
  error?: boolean;
  /**
   * Helper text displayed below the radio
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
   * Additional CSS class name for the input element
   */
  inputClassName?: string;
}

/**
 * Radio component - Allows users to select a single option from a set
 *
 * The Radio component provides a customizable radio input with support
 * for labels, error states, variants, and three sizes.
 *
 * ## CSS Customization
 *
 * You can customize the radio appearance using CSS custom properties:
 *
 * ```css
 * :root {
 *   --lxs-radio-color: #1976d2;
 *   --lxs-radio-size: 20px;
 *   --lxs-radio-border-width: 2px;
 * }
 * ```
 *
 * @example
 * Basic radio
 * ```tsx
 * <Radio label="Option 1" name="options" value="1" />
 * ```
 *
 * @example
 * Controlled radio
 * ```tsx
 * const [selected, setSelected] = useState('1');
 * <Radio
 *   checked={selected === '1'}
 *   onChange={(e) => setSelected(e.target.value)}
 *   label="Option 1"
 *   value="1"
 * />
 * ```
 *
 * @example
 * With error state
 * ```tsx
 * <Radio
 *   label="Required option"
 *   error
 *   helperText="Please select an option"
 * />
 * ```
 *
 * @example
 * Different variants
 * ```tsx
 * <Radio label="Primary" variant="primary" />
 * <Radio label="Success" variant="success" />
 * <Radio label="Error" variant="error" />
 * ```
 */
const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      checked,
      disabled = false,
      label,
      size,
      variant = 'primary',
      error = false,
      helperText,
      onChange,
      className = '',
      inputClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const radioSize = size || theme.global.size;
    
    const generatedId = useId();
    const radioId = id || generatedId;
    const helperTextId = helperText ? `${radioId}-helper-text` : undefined;

    // Build class names
    const containerClassNames = [
      'lxs-radio',
      `lxs-radio--${radioSize}`,
      `lxs-radio--${variant}`,
      disabled && 'lxs-radio--disabled',
      error && 'lxs-radio--error',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClassNames = ['lxs-radio-input', inputClassName].filter(Boolean).join(' ');

    const radioElement = (
      <div className="lxs-radio-wrapper">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={inputClassNames}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          aria-describedby={helperTextId}
          {...props}
        />
        <span className="lxs-radio-circle">
          <span className="lxs-radio-dot" />
        </span>
      </div>
    );

    if (label) {
      return (
        <div className={containerClassNames}>
          <label htmlFor={radioId} className="lxs-radio-label">
            {radioElement}
            <span className="lxs-radio-label-text">{label}</span>
          </label>
          {helperText && (
            <span id={helperTextId} className="lxs-radio-helper-text">
              {helperText}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={containerClassNames}>
        {radioElement}
        {helperText && (
          <span id={helperTextId} className="lxs-radio-helper-text">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio as React.FC<RadioProps & React.RefAttributes<HTMLInputElement>>;
export { Radio };