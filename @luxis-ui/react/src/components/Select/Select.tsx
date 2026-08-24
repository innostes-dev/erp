"use client";

import React, { SelectHTMLAttributes } from 'react';
import { useId } from '../../hooks';
import { Size, useThemeContext } from '../../theme';
import './Select.css';

export interface SelectOption {
  /**
   * Value of the option
   */
  value: string;
  /**
   * Display label for the option
   */
  label: string;
  /**
   * If true, option cannot be selected
   * @default false
   */
  disabled?: boolean;
  /**
   * Optional group this option belongs to
   */
  group?: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Label text displayed above the select
   */
  label?: string;
  /**
   * Helper text displayed below the select
   * Provides additional context or instructions
   */
  helperText?: string;
  /**
   * Error message - when provided, select is shown in error state
   */
  error?: string;
  /**
   * Success message - when provided, select is shown in success state
   */
  success?: string;
  /**
   * Size of the select
   * @default theme.global.size
   */
  size?: Size;
  /**
   * If true, select will take full width of its container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Options to display in the select dropdown
   */
  options: SelectOption[];
  /**
   * Placeholder text shown when no option is selected
   */
  placeholder?: string;
  /**
   * Custom class name for the wrapper element
   */
  wrapperClassName?: string;
  /**
   * If true, groups options by their group property
   * @default false
   */
  grouped?: boolean;
  /**
   * Property name or function to extract the display label from each option
   * @default 'label'
   * @example
   * getOptionLabel="productName" // uses option.productName
   * getOptionLabel={(option) => option.firstName + ' ' + option.lastName}
   */
  getOptionLabel?: string | ((option: any) => string);
  /**
   * Property name or function to extract the value from each option
   * @default 'value'
   * @example
   * getOptionValue="id" // uses option.id
   * getOptionValue={(option) => option.uuid}
   */
  getOptionValue?: string | ((option: any) => string | number);
  /**
   * Property name or function to determine if an option is disabled
   * @default 'disabled'
   * @example
   * getOptionDisabled="isInactive" // uses option.isInactive
   * getOptionDisabled={(option) => option.stock === 0}
   */
  getOptionDisabled?: string | ((option: any) => boolean);
  /**
   * Property name or function to extract the group from each option
   * @default 'group'
   * @example
   * getOptionGroup="category" // uses option.category
   * getOptionGroup={(option) => option.department}
   */
  getOptionGroup?: string | ((option: any) => string);
  /**
   * Callback fired when selection changes
   * Provides both event and selected option
   */
  onSelectChange?: (value: string, option: SelectOption | undefined) => void;
  /**
   * If true, shows a loading spinner in place of the dropdown icon
   * @default false
   */
  loading?: boolean;
  /**
   * The default value for uncontrolled usage
   * Sets the initially selected option by its value
   * @example
   * defaultValue="us" // Selects the option with value 'us'
   */
  defaultValue?: string;
}

/**
 * Select component - Dropdown selection control with label, validation states, and grouping support
 *
 * A comprehensive select component with support for grouped options, validation states,
 * and enhanced accessibility features.
 *
 * @example
 * Basic usage
 * ```tsx
 * <Select
 *   label="Country"
 *   placeholder="Select a country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'uk', label: 'United Kingdom' },
 *   ]}
 * />
 * ```
 *
 * @example
 * With grouped options
 * ```tsx
 * <Select
 *   label="Framework"
 *   grouped
 *   options={[
 *     { value: 'react', label: 'React', group: 'Frontend' },
 *     { value: 'vue', label: 'Vue', group: 'Frontend' },
 *     { value: 'node', label: 'Node.js', group: 'Backend' },
 *     { value: 'django', label: 'Django', group: 'Backend' },
 *   ]}
 * />
 * ```
 *
 * @example
 * With change callback
 * ```tsx
 * <Select
 *   label="Status"
 *   options={statusOptions}
 *   onSelectChange={(value, option) => {
 *     console.log('Selected:', value, option);
 *   }}
 * />
 * ```
 *
 * @example
 * With default value
 * ```tsx
 * <Select
 *   label="Country"
 *   options={countryOptions}
 *   defaultValue="us"
 * />
 * ```
 *
 * @example
 * Customize loading spinner via CSS
 * ```css
 * .lxs-select-icon-spinner {
 *   --lxs-select-loader-color: #10b981;
 *   --lxs-select-loader-speed: 1.2s;
 *   --lxs-select-loader-track-opacity: 0.15;
 *   --lxs-select-loader-path-opacity: 0.85;
 * }
 * ```
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size,
      fullWidth = false,
      options,
      placeholder,
      className = '',
      wrapperClassName = '',
      id: providedId,
      disabled = false,
      required = false,
      grouped = false,
      getOptionLabel = 'label',
      getOptionValue = 'value',
      getOptionDisabled = 'disabled',
      getOptionGroup = 'group',
      onSelectChange,
      onChange,
      loading = false,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const selectSize = size || theme.global.size;
    
    const generatedId = useId('select');
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const successId = `${id}-success`;

    // Helper to safely extract value from option using string key or function
    const extractValue = (option: any, getter: string | ((option: any) => any)): any => {
      if (typeof getter === 'function') {
        return getter(option);
      }
      return typeof option === 'object' ? option[getter] : option;
    };

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;

    const describedBy = [
      helperText && !error && !success && helperId,
      error && errorId,
      success && successId,
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClassNames = [
      'lxs-select-wrapper',
      fullWidth && 'lxs-select-wrapper--full-width',
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const selectContainerClassNames = [
      'lxs-select-container',
      `lxs-select-container--${selectSize}`,
      hasError && 'lxs-select-container--error',
      hasSuccess && 'lxs-select-container--success',
      disabled && 'lxs-select-container--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e);
      if (onSelectChange) {
        const selectedOption = options.find(
          (opt) => String(extractValue(opt, getOptionValue)) === e.target.value
        );
        onSelectChange(e.target.value, selectedOption);
      }
    };

    const renderOptions = () => {
      if (!grouped) {
        return options.map((option, index) => {
          const value = extractValue(option, getOptionValue);
          const label = extractValue(option, getOptionLabel);
          const isDisabled = extractValue(option, getOptionDisabled);

          return (
            <option key={value || index} value={value} disabled={isDisabled}>
              {label}
            </option>
          );
        });
      }

      // Group options using custom getter
      const groupedOptions = options.reduce(
        (acc, option) => {
          const group = extractValue(option, getOptionGroup) || 'Other';
          if (!acc[group]) {
            acc[group] = [];
          }
          acc[group].push(option);
          return acc;
        },
        {} as Record<string, any[]>
      );

      return Object.entries(groupedOptions).map(([group, groupOptions]) => (
        <optgroup key={group} label={group}>
          {groupOptions.map((option, index) => {
            const value = extractValue(option, getOptionValue);
            const label = extractValue(option, getOptionLabel);
            const isDisabled = extractValue(option, getOptionDisabled);

            return (
              <option key={value || index} value={value} disabled={isDisabled}>
                {label}
              </option>
            );
          })}
        </optgroup>
      ));
    };

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={id} className="lxs-select-label">
            {label}
            {required && (
              <span className="lxs-select-label__required" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <div className={selectContainerClassNames}>
          <select
            ref={ref}
            id={id}
            className="lxs-select"
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={describedBy || undefined}
            onChange={handleChange}
            defaultValue={defaultValue}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {renderOptions()}
          </select>
          <span className="lxs-select-icon" aria-hidden="true">
            {loading ? (
              <svg
                className="lxs-select-icon-spinner"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle
                  className="lxs-select-icon-spinner-track"
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="lxs-select-icon-spinner-path"
                  fill="currentColor"
                  d="M8 2C4.686 2 2 4.686 2 8h2c0-2.21 1.79-4 4-4V2z"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </div>
        {helperText && !error && !success && (
          <p id={helperId} className="lxs-select-helper">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="lxs-select-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p id={successId} className="lxs-select-success" role="status">
            {success}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select as React.FC<SelectProps & React.RefAttributes<HTMLSelectElement>>;
export { Select };