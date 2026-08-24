"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../Input';
import { Calendar } from './Calendar';
import { CalendarIcon } from '../../icons/IconComponents';
import { Size } from '../../theme';
import './DatePicker.css';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  /**
   * The selected date range value
   */
  value?: DateRange;
  /**
   * Callback fired when the date range changes
   */
  onChange?: (range: DateRange) => void;
  /**
   * Label text displayed above the input
   */
  label?: string;
  /**
   * Placeholder text for start date
   */
  startPlaceholder?: string;
  /**
   * Placeholder text for end date
   */
  endPlaceholder?: string;
  /**
   * Helper text displayed below the input
   */
  helperText?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Success message
   */
  success?: string;
  /**
   * Size of the input
   */
  size?: Size;
  /**
   * If true, input will take full width of its container
   */
  fullWidth?: boolean;
  /**
   * If true, the input is disabled
   */
  disabled?: boolean;
  /**
   * If true, the field is required
   */
  required?: boolean;
  /**
   * Minimum selectable date
   */
  minDate?: Date;
  /**
   * Maximum selectable date
   */
  maxDate?: Date;
  /**
   * Array of disabled dates
   */
  disabledDates?: Date[];
  /**
   * Custom function to determine if a date should be disabled
   */
  isDateDisabled?: (date: Date) => boolean;
  /**
   * Date format for display
   * @default 'MM/DD/YYYY'
   */
  format?: string;
  /**
   * Range separator text
   * @default 'to'
   */
  separator?: string;
  /**
   * Preset date ranges
   */
  presets?: {
    label: string;
    range: DateRange;
  }[];
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Custom class name for the input
   */
  inputClassName?: string;
  /**
   * Custom class name for the dropdown
   */
  dropdownClassName?: string;
  /**
   * If true, shows a clear button when input has value
   * @default false
   */
  clearable?: boolean;
}

const formatDate = (date: Date | null, format: string = 'MM/DD/YYYY'): string => {
  if (!date) return '';
  
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  return format
    .replace('MM', month)
    .replace('DD', day)
    .replace('YYYY', year)
    .replace('M', (date.getMonth() + 1).toString())
    .replace('D', date.getDate().toString())
    .replace('YY', year.slice(-2));
};

const formatDateRange = (range: DateRange, format: string, separator: string): string => {
  const startStr = formatDate(range.start, format);
  const endStr = formatDate(range.end, format);
  
  if (startStr && endStr) {
    return `${startStr} ${separator} ${endStr}`;
  }
  if (startStr) {
    return startStr;
  }
  return '';
};

const getDefaultPresets = (): { label: string; range: DateRange }[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  
  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 6);
  
  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 29);

  return [
    {
      label: 'Today',
      range: { start: new Date(today), end: new Date(today) },
    },
    {
      label: 'Yesterday',
      range: { start: new Date(yesterday), end: new Date(yesterday) },
    },
    {
      label: 'Last 7 days',
      range: { start: new Date(last7Days), end: new Date(today) },
    },
    {
      label: 'Last 30 days',
      range: { start: new Date(last30Days), end: new Date(today) },
    },
    {
      label: 'This week',
      range: { start: new Date(thisWeekStart), end: new Date(today) },
    },
    {
      label: 'Last week',
      range: { start: new Date(lastWeekStart), end: new Date(lastWeekEnd) },
    },
    {
      label: 'This month',
      range: { start: new Date(thisMonthStart), end: new Date(today) },
    },
    {
      label: 'Last month',
      range: { start: new Date(lastMonthStart), end: new Date(lastMonthEnd) },
    },
  ];
};

/**
 * DateRangePicker component - A professional date range picker with calendar dropdown
 *
 * Features:
 * - Calendar view with range selection
 * - Preset date ranges (Today, Last 7 days, etc.)
 * - Keyboard navigation support
 * - Customizable date ranges and disabled dates
 * - Professional design following modern UI patterns
 * - Accessibility support
 *
 * @example
 * Basic usage
 * ```tsx
 * <DateRangePicker
 *   label="Date Range"
 *   value={dateRange}
 *   onChange={setDateRange}
 *   startPlaceholder="Start date"
 *   endPlaceholder="End date"
 * />
 * ```
 *
 * @example
 * With presets
 * ```tsx
 * <DateRangePicker
 *   label="Reporting Period"
 *   value={reportingRange}
 *   onChange={setReportingRange}
 *   presets={[
 *     { label: 'Last Quarter', range: { start: lastQuarterStart, end: lastQuarterEnd } },
 *     { label: 'This Year', range: { start: yearStart, end: new Date() } },
 *   ]}
 * />
 * ```
 */
const DateRangePicker = React.forwardRef<HTMLInputElement, DateRangePickerProps>(
  (
    {
      value = { start: null, end: null },
      onChange,
      label,
      startPlaceholder = 'Start date',
      endPlaceholder = 'End date',
      helperText,
      error,
      success,
      size,
      fullWidth = false,
      disabled = false,
      required = false,
      minDate,
      maxDate,
      disabledDates,
      isDateDisabled,
      format = 'MM/DD/YYYY',
      separator = 'to',
      presets = getDefaultPresets(),
      className = '',
      inputClassName = '',
      dropdownClassName = '',
      clearable = false,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(() => formatDateRange(value, format, separator));
    const [currentMonth, setCurrentMonth] = useState(() => value.start || new Date());
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setInputValue(formatDateRange(value, format, separator));
      if (value.start) {
        setCurrentMonth(value.start);
      }
      
      // Update active preset
      const matchingPreset = presets.find(preset => 
        preset.range.start?.getTime() === value.start?.getTime() &&
        preset.range.end?.getTime() === value.end?.getTime()
      );
      setActivePreset(matchingPreset?.label || null);
    }, [value, format, separator, presets]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen]);

    const handleInputClick = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleRangeChange = (range: [Date | null, Date | null]) => {
      const [start, end] = range;
      const newRange = { start, end };
      onChange?.(newRange);
      
      if (start && end) {
        setIsOpen(false);
      }
    };

    const handlePresetClick = (preset: { label: string; range: DateRange }) => {
      onChange?.(preset.range);
      setActivePreset(preset.label);
      setIsOpen(false);
    };

    const handleClear = () => {
      onChange?.({ start: null, end: null });
      setInputValue('');
      setActivePreset(null);
      setIsOpen(false);
    };

    return (
      <div
        ref={containerRef}
        className={`lxs-datepicker ${className}`.trim()}
      >
        <Input
          ref={ref}
          label={label}
          value={inputValue}
          onClick={handleInputClick}
          placeholder={`${startPlaceholder} ${separator} ${endPlaceholder}`}
          helperText={helperText}
          error={error}
          success={success}
          size={size}
          fullWidth={fullWidth}
          disabled={disabled}
          required={required}
          readOnly
          rightIcon={<CalendarIcon size={16} />}
          className={`lxs-datepicker__input ${inputClassName}`.trim()}
          clearable={clearable}
          onClear={handleClear}
          {...props}
        />
        
        {isOpen && (
          <div
            ref={dropdownRef}
            className={`lxs-datepicker__dropdown ${dropdownClassName}`.trim()}
          >
            <div className="lxs-datepicker__content">
              {presets.length > 0 && (
                <div className="lxs-datepicker__presets">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={[
                        'lxs-datepicker__preset-button',
                        activePreset === preset.label && 'lxs-datepicker__preset-button--active',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handlePresetClick(preset)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="lxs-datepicker__calendar-container">
                <Calendar
                  rangeValue={[value.start, value.end]}
                  onRangeChange={handleRangeChange}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                  minDate={minDate}
                  maxDate={maxDate}
                  disabledDates={disabledDates}
                  isDateDisabled={isDateDisabled}
                  isRangeMode
                  onChange={() => {}} // Required prop but not used in range mode
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker as React.FC<DateRangePickerProps & React.RefAttributes<HTMLInputElement>>;
export { DateRangePicker };