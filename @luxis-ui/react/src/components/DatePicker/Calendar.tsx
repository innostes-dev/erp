"use client";

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons/IconComponents';

export interface CalendarProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  isDateDisabled?: (date: Date) => boolean;
  rangeValue?: [Date | null, Date | null];
  onRangeChange?: (range: [Date | null, Date | null]) => void;
  isRangeMode?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabledDates = [],
  currentMonth,
  onMonthChange,
  isDateDisabled,
  rangeValue,
  onRangeChange,
  isRangeMode = false,
}) => {
  const today = new Date();
  const [viewDate, setViewDate] = React.useState(currentMonth || value || today);

  React.useEffect(() => {
    if (currentMonth) {
      setViewDate(currentMonth);
    }
  }, [currentMonth]);

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + increment, 1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled?.(date) || isDateDisabledInternal(date)) {
      return;
    }

    if (isRangeMode && onRangeChange) {
      const [start, end] = rangeValue || [null, null];
      
      if (!start || (start && end)) {
        // Start new range
        onRangeChange([date, null]);
      } else if (start && !end) {
        // Complete range
        if (date >= start) {
          onRangeChange([start, date]);
        } else {
          onRangeChange([date, start]);
        }
      }
    } else {
      onChange?.(date);
    }
  };

  const isDateDisabledInternal = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(disabled => isSameDay(disabled, date))) return true;
    return false;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isInRange = (date: Date): boolean => {
    if (!isRangeMode || !rangeValue) return false;
    const [start, end] = rangeValue;
    if (!start || !end) return false;
    return date >= start && date <= end;
  };

  const isRangeStart = (date: Date): boolean => {
    if (!isRangeMode || !rangeValue) return false;
    const [start] = rangeValue;
    return start ? isSameDay(date, start) : false;
  };

  const isRangeEnd = (date: Date): boolean => {
    if (!isRangeMode || !rangeValue) return false;
    const [, end] = rangeValue;
    return end ? isSameDay(date, end) : false;
  };

  const getDaysInMonth = (): Date[] => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41); // 6 weeks * 7 days
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === viewDate.getMonth() && date.getFullYear() === viewDate.getFullYear();
  };

  const days = getDaysInMonth();

  return (
    <div className="lxs-datepicker__calendar">
      <div className="lxs-datepicker__header">
        <button
          className="lxs-datepicker__nav-button"
          onClick={() => handleMonthChange(-1)}
          type="button"
          aria-label="Previous month"
        >
          <ChevronLeftIcon size={16} />
        </button>
        
        <div className="lxs-datepicker__month-year">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </div>
        
        <button
          className="lxs-datepicker__nav-button"
          onClick={() => handleMonthChange(1)}
          type="button"
          aria-label="Next month"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>
      
      <div className="lxs-datepicker__weekdays">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="lxs-datepicker__weekday">
            {weekday}
          </div>
        ))}
      </div>
      
      <div className="lxs-datepicker__days">
        {days.map((date, index) => {
          const isSelected = value ? isSameDay(date, value) : false;
          const isToday = isSameDay(date, today);
          const isOtherMonth = !isCurrentMonth(date);
          const isDisabled = isDateDisabledInternal(date) || isDateDisabled?.(date) || false;
          const inRange = isInRange(date);
          const rangeStart = isRangeStart(date);
          const rangeEnd = isRangeEnd(date);
          
          return (
            <button
              key={index}
              className={[
                'lxs-datepicker__day',
                isSelected && 'lxs-datepicker__day--selected',
                isToday && 'lxs-datepicker__day--today',
                isOtherMonth && 'lxs-datepicker__day--other-month',
                isDisabled && 'lxs-datepicker__day--disabled',
                inRange && 'lxs-datepicker__day--in-range',
                rangeStart && 'lxs-datepicker__day--range-start',
                rangeEnd && 'lxs-datepicker__day--range-end',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              type="button"
              aria-label={date.toLocaleDateString()}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};