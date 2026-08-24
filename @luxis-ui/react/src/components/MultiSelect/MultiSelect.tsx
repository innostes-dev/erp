"use client";

import { ChevronDownIcon, SpinnerIcon, CheckIcon } from '../../icons/IconComponents';
import React, { useEffect, useRef, useState } from 'react';
import { useId } from '../../hooks';
import { useThemeContext } from '../../theme/ThemeProvider';
import { Chip } from '../Chip';
import './MultiSelect.css';

export interface MultiSelectOption {
  /**
   * Value of the option
   */
  value: string | number;
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

export interface MultiSelectProps {
  /**
   * Label text displayed above the select
   */
  label?: string;
  /**
   * Helper text displayed below the select
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
   * @default 'medium'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * If true, select will take full width of its container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Options to display in the select dropdown
   */
  options: MultiSelectOption[];
  /**
   * Selected values
   */
  value?: (string | number)[];
  /**
   * Default selected values for uncontrolled component
   */
  defaultValue?: (string | number)[];
  /**
   * Placeholder text shown when no option is selected
   */
  placeholder?: string;
  /**
   * Custom class name for the wrapper element
   */
  className?: string;
  /**
   * If true, options will be grouped
   * @default false
   */
  grouped?: boolean;
  /**
   * Property name or function to extract the display label from each option
   */
  getOptionLabel?: string | ((option: any) => string);
  /**
   * Property name or function to extract the value from each option
   */
  getOptionValue?: string | ((option: any) => string | number);
  /**
   * Property name or function to determine if an option is disabled
   */
  getOptionDisabled?: string | ((option: any) => boolean);
  /**
   * Property name or function to extract the group from each option
   */
  getOptionGroup?: string | ((option: any) => string);
  /**
   * Callback fired when selection changes
   */
  onChange?: (values: (string | number)[], selectedOptions: MultiSelectOption[]) => void;
  /**
   * If true, component is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * If true, field is required
   * @default false
   */
  required?: boolean;
  /**
   * Unique identifier
   */
  id?: string;
  /**
   * Name attribute for form integration
   */
  name?: string;
  /**
   * Selection style
   * @default 'checkbox'
   */
  selectionStyle?: 'checkbox' | 'checkmark';
  /**
   * If true, shows a searchable input in the dropdown
   * @default false
   */
  searchable?: boolean;
  /**
   * If true, shows Select All / Clear All actions
   * @default false
   */
  showSelectAll?: boolean;
  /**
   * Maximum number of chips to display before showing "+N more"
   * @default undefined (shows all)
   */
  maxChipsDisplay?: number;
  /**
   * Custom chip color
   * @default 'primary'
   */
  chipColor?: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';
  /**
   * Custom chip variant
   * @default 'light'
   */
  chipVariant?: 'filled' | 'outlined' | 'light';
  /**
   * If true, shows a loading spinner in the dropdown
   * @default false
   */
  loading?: boolean;
}

/**
 * MultiSelect component - Multi-selection dropdown with chips display
 *
 * A professional multi-select component supporting checkbox or checkmark styles,
 * with chips display, search functionality, and group support.
 *
 * @example
 * Basic usage with checkbox style
 * ```tsx
 * <MultiSelect
 *   label="Select Technologies"
 *   placeholder="Choose technologies"
 *   options={technologies}
 *   onChange={(values) => console.log(values)}
 * />
 * ```
 *
 * @example
 * With checkmark style
 * ```tsx
 * <MultiSelect
 *   label="Select Skills"
 *   options={skills}
 *   selectionStyle="checkmark"
 *   searchable
 *   showSelectAll
 * />
 * ```
 *
 * @example
 * Customize loading spinner via CSS
 * ```css
 * .lxs-multiselect-icon-spinner {
 *   --lxs-multiselect-loader-color: #10b981;
 *   --lxs-multiselect-loader-speed: 1.2s;
 *   --lxs-multiselect-loader-track-opacity: 0.15;
 *   --lxs-multiselect-loader-path-opacity: 0.85;
 * }
 * ```
 */
const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size: sizeProp,
      fullWidth = false,
      options,
      value: controlledValue,
      defaultValue = [],
      placeholder = 'Select...',
      className = '',
      grouped = false,
      getOptionLabel = 'label',
      getOptionValue = 'value',
      getOptionDisabled = 'disabled',
      getOptionGroup = 'group',
      onChange,
      disabled = false,
      required = false,
      id: providedId,
      name,
      selectionStyle = 'checkbox',
      searchable = false,
      showSelectAll = false,
      maxChipsDisplay,
      chipColor = 'primary',
      chipVariant = 'light',
      loading = false,
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const generatedId = useId('multiselect');
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const successId = `${id}-success`;

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [internalValue, setInternalValue] = useState<(string | number)[]>(defaultValue);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedValues = controlledValue !== undefined ? controlledValue : internalValue;

    // Helper to extract value from option
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

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }

      return undefined;
    }, [isOpen]);

    // Handle option selection
    const handleOptionClick = (optionValue: string | number) => {
      if (disabled) return;

      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];

      if (controlledValue === undefined) {
        setInternalValue(newValues);
      }

      if (onChange) {
        const selectedOptions = options.filter((opt) =>
          newValues.includes(extractValue(opt, getOptionValue))
        );
        onChange(newValues, selectedOptions);
      }
    };

    // Handle chip removal
    const handleChipDelete = (valueToRemove: string | number) => {
      if (disabled) return;

      const newValues = selectedValues.filter((v) => v !== valueToRemove);

      if (controlledValue === undefined) {
        setInternalValue(newValues);
      }

      if (onChange) {
        const selectedOptions = options.filter((opt) =>
          newValues.includes(extractValue(opt, getOptionValue))
        );
        onChange(newValues, selectedOptions);
      }
    };

    // Handle Select All
    const handleSelectAll = () => {
      const allValues = options
        .filter((opt) => !extractValue(opt, getOptionDisabled))
        .map((opt) => extractValue(opt, getOptionValue));

      if (controlledValue === undefined) {
        setInternalValue(allValues);
      }

      if (onChange) {
        onChange(
          allValues,
          options.filter((opt) => !extractValue(opt, getOptionDisabled))
        );
      }
    };

    // Handle Clear All
    const handleClearAll = () => {
      if (controlledValue === undefined) {
        setInternalValue([]);
      }

      if (onChange) {
        onChange([], []);
      }
    };

    // Filter options based on search
    const filteredOptions = searchQuery
      ? options.filter((option) => {
          const label = extractValue(option, getOptionLabel);
          return label.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : options;

    // Group options if needed
    const groupedOptions = grouped
      ? filteredOptions.reduce(
          (acc, option) => {
            const group = extractValue(option, getOptionGroup) || 'Other';
            if (!acc[group]) {
              acc[group] = [];
            }
            acc[group].push(option);
            return acc;
          },
          {} as Record<string, any[]>
        )
      : { '': filteredOptions };

    // Get selected options for chip display
    const selectedOptions = options.filter((opt) =>
      selectedValues.includes(extractValue(opt, getOptionValue))
    );

    const displayedChips = maxChipsDisplay
      ? selectedOptions.slice(0, maxChipsDisplay)
      : selectedOptions;
    const remainingCount = maxChipsDisplay ? selectedOptions.length - maxChipsDisplay : 0;

    const wrapperClassNames = [
      'lxs-multiselect-wrapper',
      fullWidth && 'lxs-multiselect-wrapper--full-width',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const size: 'sm' | 'md' | 'lg' = sizeProp || theme?.global?.size || 'md';
    const containerClassNames = [
      'lxs-multiselect-container',
      `vtx-multiselect-container--${size}`,
      hasError && 'lxs-multiselect-container--error',
      hasSuccess && 'lxs-multiselect-container--success',
      disabled && 'lxs-multiselect-container--disabled',
      isOpen && 'lxs-multiselect-container--open',
    ]
      .filter(Boolean)
      .join(' ');

    // Pass the same size to Chip for consistency
    const chipSize: 'sm' | 'md' | 'lg' = size;

    return (
      <div className={wrapperClassNames} ref={ref}>
        {label && (
          <label htmlFor={id} className="lxs-multiselect-label">
            {label}
            {required && (
              <span className="lxs-multiselect-label__required" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}

        <div
          ref={containerRef}
          className={containerClassNames}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-describedby={describedBy || undefined}
          aria-disabled={disabled}
        >
          <div
            className="lxs-multiselect-input-area"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setIsOpen(!isOpen);
              }
            }}
          >
            {selectedOptions.length === 0 ? (
              <span className="lxs-multiselect-placeholder">{placeholder}</span>
            ) : (
              <div className="lxs-multiselect-chips">
                {displayedChips.map((option) => {
                  const value = extractValue(option, getOptionValue);
                  const label = extractValue(option, getOptionLabel);
                  return (
                    <Chip
                      key={value}
                      label={label}
                      size={chipSize}
                      color={chipColor}
                      variant={chipVariant}
                      onDelete={(e) => {
                        e.stopPropagation();
                        handleChipDelete(value);
                      }}
                    />
                  );
                })}
                {remainingCount > 0 && (
                  <Chip
                    label={`+${remainingCount} more`}
                    size={chipSize}
                    color="default"
                    variant="outlined"
                  />
                )}
              </div>
            )}
          </div>

          <span className="lxs-multiselect-icon" aria-hidden="true">
            {loading ? (
              <SpinnerIcon size={16} />
            ) : (
              <ChevronDownIcon size={16} />
            )}
          </span>

          {isOpen && (
            <div ref={dropdownRef} className="lxs-multiselect-dropdown" role="listbox">
              {searchable && (
                <div className="lxs-multiselect-search">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {showSelectAll && (
                <div className="lxs-multiselect-actions">
                  <button
                    type="button"
                    className="lxs-multiselect-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAll();
                    }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="lxs-multiselect-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAll();
                    }}
                  >
                    Clear All
                  </button>
                </div>
              )}

              <div className="lxs-multiselect-options">
                {filteredOptions.length === 0 ? (
                  <div className="lxs-multiselect-empty">No options found</div>
                ) : (
                  Object.entries(groupedOptions).map(([group, groupOptions]) => (
                    <div key={group}>
                      {grouped && group && <div className="lxs-multiselect-optgroup">{group}</div>}
                      {groupOptions.map((option) => {
                        const value = extractValue(option, getOptionValue);
                        const label = extractValue(option, getOptionLabel);
                        const isDisabled = extractValue(option, getOptionDisabled);
                        const isSelected = selectedValues.includes(value);

                        const optionClassNames = [
                          'lxs-multiselect-option',
                          isSelected && 'lxs-multiselect-option--selected',
                          isDisabled && 'lxs-multiselect-option--disabled',
                        ]
                          .filter(Boolean)
                          .join(' ');

                        return (
                          <div
                            key={value}
                            className={optionClassNames}
                            onClick={() => !isDisabled && handleOptionClick(value)}
                            role="option"
                            aria-selected={isSelected}
                            aria-disabled={isDisabled}
                            tabIndex={isDisabled ? -1 : 0}
                            onKeyDown={(e) => {
                              if (isDisabled) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOptionClick(value);
                              }
                            }}
                          >
                            {selectionStyle === 'checkbox' && (
                              <div
                                className={`vtx-multiselect-checkbox ${
                                  isSelected ? 'lxs-multiselect-checkbox--checked' : ''
                                }`}
                              >
                                {isSelected && <CheckIcon size={16} />}
                              </div>
                            )}

                            <span className="lxs-multiselect-option-label">{label}</span>

                            {selectionStyle === 'checkmark' && (
                              <div className="lxs-multiselect-checkmark">
                                {isSelected && <CheckIcon size={20} />}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hidden select for form integration */}
        {name && (
          <select
            multiple
            name={name}
            value={selectedValues.map(String)}
            onChange={() => {}}
            className="lxs-multiselect-hidden-select"
            required={required}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
          >
            {options.map((option) => {
              const value = extractValue(option, getOptionValue);
              return (
                <option key={value} value={String(value)}>
                  {extractValue(option, getOptionLabel)}
                </option>
              );
            })}
          </select>
        )}

        {helperText && !error && !success && (
          <p id={helperId} className="lxs-multiselect-helper">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="lxs-multiselect-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p id={successId} className="lxs-multiselect-success" role="status">
            {success}
          </p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';

export default MultiSelect as React.FC<MultiSelectProps & React.RefAttributes<HTMLDivElement>>;
export { MultiSelect };