"use client";

import React, { useId, useRef, useImperativeHandle } from 'react';
import { useThemeContext } from '../../theme/ThemeProvider';
import './ToggleButton.css';

export interface ToggleButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * If true, the toggle button is checked
   */
  checked?: boolean;
  /**
   * If true, the toggle button is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * The label for the toggle button
   */
  label?: React.ReactNode;
  /**
   * Placement of the label relative to the toggle switch
   * @default 'end'
   */
  labelPlacement?: 'start' | 'end' | 'top' | 'bottom';
  /**
   * The size of the toggle button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * The variant of the toggle button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  /**
   * If true, displays error styling
   * @default false
   */
  error?: boolean;
  /**
   * Helper text displayed below the toggle button
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
  /**
   * Icon to display inside the toggle knob (thumb)
   */
  icon?: React.ReactNode;
  /**
   * Icon to display inside the toggle knob when checked. Overrides `icon` when checked.
   */
  checkedIcon?: React.ReactNode;
}

/**
 * ToggleButton component - Allows users to toggle a binary state on or off.
 *
 * The ToggleButton component provides a customizable switch input with support
 * for labels, error states, and three sizes.
 *
 * ## CSS Customization
 *
 * You can customize the toggle button appearance using CSS custom properties:
 *
 * ```css
 * :root {
 *   --lxs-toggle-color: #1976d2;
 *   --lxs-toggle-width: 40px;
 *   --lxs-toggle-height: 24px;
 *   --lxs-toggle-thumb-size: 20px;
 * }
 * ```
 *
 * @example
 * Basic toggle button
 * ```tsx
 * <ToggleButton label="Enable notifications" />
 * ```
 *
 * @example
 * Controlled toggle button with size and variant
 * ```tsx
 * const [checked, setChecked] = useState(false);
 * <ToggleButton
 *   checked={checked}
 *   onChange={(e) => setChecked(e.target.checked)}
 *   label="Dark Mode"
 *   size="lg"
 *   variant="secondary"
 * />
 * ```
 *
 * @example
 * With icons
 * ```tsx
 * <ToggleButton
 *   label="WiFi"
 *   icon={<WifiOffIcon />}
 *   checkedIcon={<WifiIcon />}
 * />
 * ```
 */
const ToggleButton = React.forwardRef<HTMLInputElement, ToggleButtonProps>(
  (
    {
      checked,
      disabled = false,
      label,
      labelPlacement = 'end',
      size,
      variant = 'primary',
      error = false,
      helperText,
      onChange,
      className = '',
      inputClassName = '',
      icon,
      checkedIcon,
      id,
      ...props
    },
    ref
  ) => {
    // Get theme default size if size prop is not provided
    const { theme } = useThemeContext();
    const toggleSize = size || theme.global.size || 'md';

    const generatedId = useId();
    const toggleId = id || generatedId;

    // Build class names
    const containerClassNames = [
      'lxs-toggle-button',
      `lxs-toggle-button--${toggleSize}`,
      `lxs-toggle-button--${variant}`,
      disabled && 'lxs-toggle-button--disabled',
      error && 'lxs-toggle-button--error',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const labelClassNames = [
      'lxs-toggle-button-label',
      `lxs-toggle-button-label--${labelPlacement}`,
    ].filter(Boolean).join(' ');

    const inputClassNames = ['lxs-toggle-button-input', inputClassName].filter(Boolean).join(' ');

    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current ?? document.createElement('input'));

    const displayIcon = (checked && checkedIcon) ? checkedIcon : icon;

    return (
      <div className={containerClassNames}>
        <label className={labelClassNames} htmlFor={toggleId}>
          <span className="lxs-toggle-button-wrapper">
            <input
              ref={inputRef}
              type="checkbox"
              role="switch"
              id={toggleId}
              className={inputClassNames}
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              {...props}
            />
            <span className="lxs-toggle-button-track">
              <span className="lxs-toggle-button-thumb">
                {displayIcon && <span className="lxs-toggle-button-icon">{displayIcon}</span>}
              </span>
            </span>
          </span>
          {label && <span className="lxs-toggle-button-label-text">{label}</span>}
        </label>
        {helperText && <div className="lxs-toggle-button-helper-text">{helperText}</div>}
      </div>
    );
  }
);

ToggleButton.displayName = 'ToggleButton';

export default ToggleButton;
export { ToggleButton };
