"use client";

import React, { InputHTMLAttributes, useRef, useState, useEffect } from 'react';
import { useId } from '../../hooks';
import { Size, useThemeContext } from '../../theme';
import { SearchIcon, CloseSmallIcon } from '../../icons/IconComponents';
import './Autocomplete.css';

export interface AutocompleteOption {
  /**
   * Value of the option
   */
  value: string;
  /**
   * Display label for the option
   */
  label: string;
  /**
   * Optional description or secondary text
   */
  description?: string;
  /**
   * If true, option cannot be selected
   * @default false
   */
  disabled?: boolean;
  /**
   * Icon to display before label
   */
  icon?: React.ReactNode;
}

export interface AutocompleteProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange' | 'onSelect'> {
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
   * Options to display in the autocomplete dropdown
   */
  options: any[];
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
  getOptionValue?: string | ((option: any) => string);
  /**
   * Property name or function to determine if an option is disabled
   * @default 'disabled'
   * @example
   * getOptionDisabled="isInactive" // uses option.isInactive
   * getOptionDisabled={(option) => option.stock === 0}
   */
  getOptionDisabled?: string | ((option: any) => boolean);
  /**
   * Property name or function to extract the description from each option
   * @default 'description'
   */
  getOptionDescription?: string | ((option: any) => string | undefined);
  /**
   * Property name or function to extract the icon from each option
   * @default 'icon'
   */
  getOptionIcon?: string | ((option: any) => React.ReactNode);
  /**
   * Message to display when no options are available
   * @default 'No options'
   */
  noOptionsMessage?: string;
  /**
   * If true, shows a loading spinner
   * @default false
   */
  loading?: boolean;
  /**
   * Loading message to display
   * @default 'Loading...'
   */
  loadingMessage?: string;
  /**
   * Callback fired when input value changes
   */
  onChange?: (value: string) => void;
  /**
   * Callback fired when an option is selected
   * Provides the selected option and its value
   */
  onSelect?: (value: string, option: any) => void;
  /**
   * If true, shows search icon on the left
   * @default false
   */
  showSearchIcon?: boolean;
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
   * Custom class name for the dropdown element
   */
  dropdownClassName?: string;
  /**
   * Custom render function for options
   */
  renderOption?: (option: any, index: number) => React.ReactNode;
  /**
   * Input value (controlled)
   */
  value?: string;
  /**
   * If true, opens dropdown on focus even if input is empty
   * @default true
   */
  openOnFocus?: boolean;
  /**
   * Minimum characters to type before showing options
   * @default 0
   */
  minSearchLength?: number;
  /**
   * If true, disables built-in client-side filtering.
   * Use this for async/server-side search where you supply pre-filtered options via `onChange`.
   * @default false
   */
  disableClientFilter?: boolean;
}

/**
 * Autocomplete component - Text input with dropdown suggestions
 *
 * A comprehensive autocomplete component with support for custom option rendering,
 * validation states, loading states, and rich features like icons and descriptions.
 *
 * @example
 * Basic usage
 * ```tsx
 * <Autocomplete
 *   label="Search"
 *   placeholder="Type to search..."
 *   options={searchResults}
 *   onSelect={(value, option) => console.log('Selected:', value, option)}
 *   onChange={(value) => fetchResults(value)}
 * />
 * ```
 *
 * @example
 * With custom getters
 * ```tsx
 * <Autocomplete
 *   options={products}
 *   getOptionLabel={(opt) => opt.name}
 *   getOptionValue={(opt) => opt.id}
 *   getOptionDescription={(opt) => opt.category}
 *   onSelect={(value, option) => navigate(`/product/${value}`)}
 * />
 * ```
 *
 * @example
 * With loading state
 * ```tsx
 * <Autocomplete
 *   loading={isLoading}
 *   loadingMessage="Searching..."
 *   options={results}
 *   showSearchIcon
 * />
 * ```
 */
const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size,
      fullWidth = false,
      options = [],
      getOptionLabel = 'label',
      getOptionValue = 'value',
      getOptionDisabled = 'disabled',
      getOptionDescription = 'description',
      getOptionIcon = 'icon',
      noOptionsMessage = 'No options',
      loading = false,
      loadingMessage = 'Loading...',
      onChange,
      onSelect,
      showSearchIcon = false,
      clearable = false,
      onClear,
      className = '',
      wrapperClassName = '',
      labelClassName = '',
      inputClassName = '',
      dropdownClassName = '',
      renderOption,
      id: providedId,
      disabled = false,
      required = false,
      value: controlledValue,
      openOnFocus = true,
      minSearchLength = 0,
      disableClientFilter = false,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const inputSize = size || theme.global.size;

    const generatedId = useId('autocomplete');
    const id = providedId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const successId = `${id}-success`;
    const listboxId = `${id}-listbox`;

    const [internalValue, setInternalValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isFocused, setIsFocused] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const suppressNextOpenRef = useRef(false);

    const isControlled = controlledValue !== undefined;
    const inputValue = isControlled ? controlledValue : internalValue;
    const activeSearchQuery = isControlled ? controlledValue : searchQuery;

    // Helper to safely extract value from option using string key or function
    const extractValue = (option: any, getter: string | ((option: any) => any)): any => {
      if (typeof getter === 'function') {
        return getter(option);
      }
      return typeof option === 'object' ? option[getter] : option;
    };

    const filteredOptions =
      disableClientFilter || !activeSearchQuery
        ? options
        : options.filter((option) => {
            const label = String(extractValue(option, getOptionLabel));
            return label.toLowerCase().includes(activeSearchQuery.toLowerCase());
          });

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const showClearButton = clearable && inputValue && String(inputValue).length > 0 && !disabled;
    const shouldShowDropdown =
      isOpen &&
      isFocused &&
      !disabled &&
      inputValue.length >= minSearchLength;

    const describedBy = [
      helperText && !error && !success && helperId,
      error && errorId,
      success && successId,
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClassNames = [
      'lxs-autocomplete-wrapper',
      fullWidth && 'lxs-autocomplete-wrapper--full-width',
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const inputContainerClassNames = [
      'lxs-autocomplete-container',
      `lxs-autocomplete-container--${inputSize}`,
      hasError && 'lxs-autocomplete-container--error',
      hasSuccess && 'lxs-autocomplete-container--success',
      disabled && 'lxs-autocomplete-container--disabled',
      isFocused && 'lxs-autocomplete-container--focused',
      shouldShowDropdown && 'lxs-autocomplete-container--open',
      (showSearchIcon || loading) && 'lxs-autocomplete-container--with-left-icon',
      showClearButton && 'lxs-autocomplete-container--with-right-icon',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const dropdownClassNames = [
      'lxs-autocomplete-dropdown',
      shouldShowDropdown && 'lxs-autocomplete-dropdown--open',
      dropdownClassName,
    ]
      .filter(Boolean)
      .join(' ');

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setIsFocused(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlighted index when filtered options change
    useEffect(() => {
      setHighlightedIndex(-1);
    }, [filteredOptions.length]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
        setSearchQuery(newValue);
      }
      setIsOpen(true);
      setHighlightedIndex(-1);
      onChange?.(newValue);
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (openOnFocus && !suppressNextOpenRef.current) {
        setIsOpen(true);
      }
      suppressNextOpenRef.current = false;
      onFocus?.(e);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Delay to allow option click to register
      setTimeout(() => {
        if (!wrapperRef.current?.contains(document.activeElement)) {
          setIsFocused(false);
          setIsOpen(false);
        }
      }, 200);
      onBlur?.(e);
    };

    const handleOptionClick = (option: any) => {
      if (extractValue(option, getOptionDisabled)) {
        return;
      }

      const value = String(extractValue(option, getOptionValue));
      const label = String(extractValue(option, getOptionLabel));

      if (!isControlled) {
        setInternalValue(label);
        setSearchQuery('');
      }
      setIsOpen(false);
      onSelect?.(value, option);

      suppressNextOpenRef.current = true;
      inputRef.current?.focus();
    };

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue('');
        setSearchQuery('');
      }
      setIsOpen(false);
      onClear?.();
      onChange?.('');
      suppressNextOpenRef.current = true;
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!shouldShowDropdown || filteredOptions.length === 0) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
            if (extractValue(filteredOptions[next], getOptionDisabled)) {
              return next < filteredOptions.length - 1 ? next + 1 : 0;
            }
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
            if (extractValue(filteredOptions[next], getOptionDisabled)) {
              return next > 0 ? next - 1 : filteredOptions.length - 1;
            }
            return next;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            handleOptionClick(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    const renderDefaultOption = (option: any, index: number) => {
      const label = String(extractValue(option, getOptionLabel));
      const value = String(extractValue(option, getOptionValue));
      const description = extractValue(option, getOptionDescription);
      const icon = extractValue(option, getOptionIcon);
      const isDisabled = extractValue(option, getOptionDisabled);
      const isHighlighted = index === highlightedIndex;

      return (
        <div
          key={value || index}
          role="option"
          aria-selected={isHighlighted}
          aria-disabled={isDisabled}
          className={[
            'lxs-autocomplete-option',
            isHighlighted && 'lxs-autocomplete-option--highlighted',
            isDisabled && 'lxs-autocomplete-option--disabled',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => handleOptionClick(option)}
          onMouseDown={(e) => {
            e.preventDefault(); // prevent input blur before click registers
            handleOptionClick(option);
          }}
          onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
        >
          {icon && <span className="lxs-autocomplete-option__icon">{icon}</span>}
          <div className="lxs-autocomplete-option__content">
            <div className="lxs-autocomplete-option__label">{label}</div>
            {description && (
              <div className="lxs-autocomplete-option__description">{description}</div>
            )}
          </div>
        </div>
      );
    };

    const renderDropdownContent = () => {
      if (loading) {
        return (
          <div className="lxs-autocomplete-message lxs-autocomplete-message--loading">
            <svg
              className="lxs-autocomplete-spinner"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle
                className="lxs-autocomplete-spinner__track"
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                className="lxs-autocomplete-spinner__path"
                fill="currentColor"
                d="M10 2C5.582 2 2 5.582 2 10h2c0-3.314 2.686-6 6-6V2z"
              />
            </svg>
            <span>{loadingMessage}</span>
          </div>
        );
      }

      if (filteredOptions.length === 0) {
        return (
          <div className="lxs-autocomplete-message lxs-autocomplete-message--empty">
            {noOptionsMessage}
          </div>
        );
      }

      return (
        <div
          role="listbox"
          id={listboxId}
          className="lxs-autocomplete-options"
          ref={dropdownRef}
        >
          {filteredOptions.map((option, index) =>
            renderOption ? renderOption(option, index) : renderDefaultOption(option, index)
          )}
        </div>
      );
    };

    return (
      <div className={wrapperClassNames} ref={wrapperRef}>
        {label && (
          <label htmlFor={id} className={`lxs-autocomplete-label ${labelClassName}`.trim()}>
            {label}
            {required && (
              <span className="lxs-autocomplete-label__required" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <div className={inputContainerClassNames}>
          {showSearchIcon && !loading && (
            <span className="lxs-autocomplete-icon lxs-autocomplete-icon--left" aria-hidden="true">
              <SearchIcon size={16} />
            </span>
          )}
          {loading && (
            <span className="lxs-autocomplete-icon lxs-autocomplete-icon--left" aria-hidden="true">
              <svg
                className="lxs-autocomplete-icon-spinner"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle
                  className="lxs-autocomplete-icon-spinner__track"
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="lxs-autocomplete-icon-spinner__path"
                  fill="currentColor"
                  d="M8 2C4.686 2 2 4.686 2 8h2c0-2.21 1.79-4 4-4V2z"
                />
              </svg>
            </span>
          )}
          <input
            ref={(node) => {
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            id={id}
            type="text"
            className={`lxs-autocomplete-input ${inputClassName}`.trim()}
            disabled={disabled}
            required={required}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={hasError}
            aria-describedby={describedBy || undefined}
            aria-autocomplete="list"
            aria-controls={shouldShowDropdown ? listboxId : undefined}
            aria-expanded={shouldShowDropdown}
            role="combobox"
            autoComplete="off"
            {...props}
          />
          {showClearButton && (
            <button
              type="button"
              className="lxs-autocomplete-clear"
              onClick={handleClear}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <CloseSmallIcon size={16} />
            </button>
          )}
          {shouldShowDropdown && (
            <div className={dropdownClassNames}>{renderDropdownContent()}</div>
          )}
        </div>
        {helperText && !error && !success && (
          <p id={helperId} className="lxs-autocomplete-helper">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="lxs-autocomplete-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p id={successId} className="lxs-autocomplete-success" role="status">
            {success}
          </p>
        )}
      </div>
    );
  }
);

Autocomplete.displayName = 'Autocomplete';

export default Autocomplete as React.FC<AutocompleteProps & React.RefAttributes<HTMLInputElement>>;
export { Autocomplete };