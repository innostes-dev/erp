'use client';

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { cn } from '../../../lib/cn';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../lib/icons';
import { useControllableState } from '../../../lib/use-controllable-state';
import { useId } from '../../../lib/use-id';
import {
  addDays,
  addMonths,
  addYears,
  clampDay,
  compareDays,
  endOfWeek,
  getMonthGrid,
  getWeekStartsOn,
  isSameDay,
  isSameMonth,
  isWithinRange,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toISODate,
  type DateRange,
  type Weekday,
} from '../../../lib/date';

export type { DateRange, Weekday };

interface CalendarSharedProps {
  /** Month shown first (controlled). Any day in the month works. */
  month?: Date;
  /** Month shown first initially (uncontrolled). @default the selected date, or today */
  defaultMonth?: Date;
  /** Called when the visible month changes. */
  onMonthChange?: (month: Date) => void;
  /** Earliest selectable day. */
  min?: Date | null;
  /** Latest selectable day. */
  max?: Date | null;
  /** Return `true` to disable a day, e.g. weekends or holidays. */
  isDateDisabled?: (date: Date) => boolean;
  /**
   * BCP 47 locale for month and weekday names, e.g. `"en-IN"`.
   * @default the browser's locale
   */
  locale?: string;
  /**
   * First day of the week, 0 = Sunday … 6 = Saturday.
   * @default from the locale (Monday for most of the world, Sunday for en-US)
   */
  weekStartsOn?: Weekday;
  /**
   * Months shown side by side. Two is handy for ranges.
   * @default 1
   */
  numberOfMonths?: 1 | 2;
  /**
   * Show days of the previous and next month to fill the grid.
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * `dropdown` adds month and year selects to the caption, for dates far from today
   * (e.g. a date of birth).
   * @default 'label'
   */
  captionLayout?: 'label' | 'dropdown';
  /** First year in the year dropdown. @default 100 years ago */
  fromYear?: number;
  /** Last year in the year dropdown. @default 10 years from now */
  toYear?: number;
  /** Move focus to the selected day (or today) when the calendar mounts, e.g. in a popover. */
  autoFocus?: boolean;
  /**
   * Labels, for translation.
   * @default { previousMonth: 'Previous month', nextMonth: 'Next month', month: 'Month', year: 'Year' }
   */
  labels?: {
    previousMonth?: string;
    nextMonth?: string;
    month?: string;
    year?: string;
  };
  /** Extra classes for the root. */
  className?: string;
}

export interface CalendarSingleProps extends CalendarSharedProps {
  /** Pick one day. @default 'single' */
  mode?: 'single';
  /** Selected day (controlled). */
  value?: Date | null;
  /** Initially selected day (uncontrolled). */
  defaultValue?: Date | null;
  /** Called when a day is picked. */
  onValueChange?: (value: Date | null) => void;
}

export interface CalendarRangeProps extends CalendarSharedProps {
  /** Pick a start and end day. */
  mode: 'range';
  /** Selected range (controlled). */
  value?: DateRange;
  /** Initially selected range (uncontrolled). */
  defaultValue?: DateRange;
  /** Called on each click: first with `{ from, to: null }`, then with both ends. */
  onValueChange?: (value: DateRange) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

const emptyRange: DateRange = { from: null, to: null };

/**
 * A month grid for picking a day or a range. Fully keyboard accessible (arrows, Home/End,
 * PageUp/PageDown, Shift+PageUp/PageDown for years) and locale-aware through `Intl`.
 * Use it inline, or through `DatePicker` / `DateRangePicker`.
 *
 * @example
 * <Calendar value={date} onValueChange={setDate} min={new Date()} />
 * <Calendar mode="range" numberOfMonths={2} value={range} onValueChange={setRange} />
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(props, ref) {
    const {
      month: monthProp,
      defaultMonth,
      onMonthChange,
      min,
      max,
      isDateDisabled,
      locale,
      weekStartsOn: weekStartsOnProp,
      numberOfMonths = 1,
      showOutsideDays = true,
      captionLayout = 'label',
      fromYear,
      toYear,
      autoFocus = false,
      labels,
      className,
    } = props;
    const isRange = props.mode === 'range';
    const today = useMemo(() => startOfDay(new Date()), []);
    const weekStartsOn = weekStartsOnProp ?? getWeekStartsOn(locale);
    const id = useId();

    const [single, setSingle] = useControllableState<Date | null>({
      value: isRange ? undefined : (props as CalendarSingleProps).value,
      defaultValue: isRange
        ? null
        : ((props as CalendarSingleProps).defaultValue ?? null),
      onChange: isRange
        ? undefined
        : (props as CalendarSingleProps).onValueChange,
    });
    const [range, setRange] = useControllableState<DateRange>({
      value: isRange ? (props as CalendarRangeProps).value : undefined,
      defaultValue: isRange
        ? ((props as CalendarRangeProps).defaultValue ?? emptyRange)
        : emptyRange,
      onChange: isRange
        ? (props as CalendarRangeProps).onValueChange
        : undefined,
    });

    const anchor = (isRange ? range.from : single) ?? today;
    const [month, setMonth] = useControllableState<Date>({
      value: monthProp ? startOfMonth(monthProp) : undefined,
      defaultValue: startOfMonth(defaultMonth ?? anchor),
      onChange: onMonthChange,
    });
    const [focused, setFocused] = useState<Date>(() =>
      clampDay(anchor, min, max),
    );
    const [hovered, setHovered] = useState<Date | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const shouldFocus = useRef(autoFocus);

    const lastVisibleMonth = addMonths(month, numberOfMonths - 1);

    // Keep the focused day inside the visible months when the month changes from outside.
    useEffect(() => {
      if (
        compareDays(focused, month) < 0 ||
        compareDays(focused, addMonths(lastVisibleMonth, 1)) >= 0
      ) {
        setFocused(
          clampDay(isSameMonth(anchor, month) ? anchor : month, min, max),
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month]);

    // Move DOM focus to the focused day after keyboard navigation.
    useEffect(() => {
      if (!shouldFocus.current) return;
      shouldFocus.current = false;
      gridRef.current
        ?.querySelector<HTMLButtonElement>(
          `[data-date="${toISODate(focused)}"]`,
        )
        ?.focus();
    }, [focused, month]);

    const isDisabled = (date: Date) =>
      (!!min && compareDays(date, min) < 0) ||
      (!!max && compareDays(date, max) > 0) ||
      !!isDateDisabled?.(date);

    function showMonthOf(date: Date) {
      if (compareDays(date, month) < 0) setMonth(startOfMonth(date));
      else if (compareDays(date, addMonths(lastVisibleMonth, 1)) >= 0)
        setMonth(addMonths(startOfMonth(date), -(numberOfMonths - 1)));
    }

    function moveFocus(date: Date) {
      const next = clampDay(date, min, max);
      shouldFocus.current = true;
      setFocused(next);
      showMonthOf(next);
    }

    function select(date: Date) {
      if (isDisabled(date)) return;
      showMonthOf(date);
      setFocused(date);
      if (!isRange) {
        setSingle(date);
        return;
      }
      if (!range.from || range.to) {
        setRange({ from: date, to: null });
      } else {
        const [from, to] =
          compareDays(date, range.from) < 0
            ? [date, range.from]
            : [range.from, date];
        setRange({ from, to });
        setHovered(null);
      }
    }

    function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
      const keys: Record<string, () => Date> = {
        ArrowLeft: () => addDays(date, -1),
        ArrowRight: () => addDays(date, 1),
        ArrowUp: () => addDays(date, -7),
        ArrowDown: () => addDays(date, 7),
        Home: () => startOfWeek(date, weekStartsOn),
        End: () => endOfWeek(date, weekStartsOn),
        PageUp: () =>
          event.shiftKey ? addYears(date, -1) : addMonths(date, -1),
        PageDown: () =>
          event.shiftKey ? addYears(date, 1) : addMonths(date, 1),
      };
      const isRtl = getComputedStyle(event.currentTarget).direction === 'rtl';
      const key =
        isRtl && event.key === 'ArrowLeft'
          ? 'ArrowRight'
          : isRtl && event.key === 'ArrowRight'
            ? 'ArrowLeft'
            : event.key;
      const target = keys[key];
      if (target) {
        event.preventDefault();
        moveFocus(target());
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(date);
      }
    }

    const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: 'long' });
    const captionFormat = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    });
    const monthName = new Intl.DateTimeFormat(locale, { month: 'long' });
    const dayLabel = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const dayNumber = new Intl.DateTimeFormat(locale, { day: 'numeric' });
    const weekdays = getMonthGrid(today, weekStartsOn)[0]!;

    // Disable paging past min/max: the previous month ends before min, or the next starts after max.
    const prevDisabled = !!min && compareDays(month, startOfMonth(min)) <= 0;
    const nextDisabled =
      !!max && compareDays(addMonths(lastVisibleMonth, 1), max) > 0;

    const previewEnd = isRange && range.from && !range.to ? hovered : null;

    const navButton =
      'inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40';

    const nowYear = today.getFullYear();
    const years = Array.from(
      { length: (toYear ?? nowYear + 10) - (fromYear ?? nowYear - 100) + 1 },
      (_, i) => (fromYear ?? nowYear - 100) + i,
    );

    return (
      <div
        ref={ref}
        data-slot="calendar"
        data-mode={isRange ? 'range' : 'single'}
        className={cn(
          'inline-flex w-fit flex-col gap-4 p-3 text-sm select-none',
          className,
        )}
      >
        <div ref={gridRef} className="flex flex-col gap-6 sm:flex-row">
          {Array.from({ length: numberOfMonths }, (_, index) => {
            const shown = addMonths(month, index);
            const captionId = `${id}-caption-${index}`;
            return (
              <div key={index} className="flex flex-col gap-3">
                <div className="relative flex h-8 items-center justify-center">
                  {index === 0 && (
                    <button
                      type="button"
                      className={cn(navButton, 'absolute start-0')}
                      aria-label={labels?.previousMonth ?? 'Previous month'}
                      disabled={prevDisabled}
                      onClick={() => setMonth(addMonths(month, -1))}
                    >
                      <ChevronLeftIcon className="size-4 rtl:rotate-180" />
                    </button>
                  )}
                  {captionLayout === 'dropdown' && numberOfMonths === 1 ? (
                    <div
                      className="flex items-center gap-1"
                      id={captionId}
                      aria-live="polite"
                    >
                      <span className="sr-only">
                        {captionFormat.format(shown)}
                      </span>
                      <select
                        aria-label={labels?.month ?? 'Month'}
                        className="h-8 cursor-pointer rounded-md bg-transparent px-1 text-sm font-medium outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                        value={shown.getMonth()}
                        onChange={(e) =>
                          setMonth(
                            new Date(
                              shown.getFullYear(),
                              Number(e.target.value),
                              1,
                            ),
                          )
                        }
                      >
                        {Array.from({ length: 12 }, (_, m) => (
                          <option key={m} value={m}>
                            {monthName.format(new Date(2000, m, 1))}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label={labels?.year ?? 'Year'}
                        className="h-8 cursor-pointer rounded-md bg-transparent px-1 text-sm font-medium tabular-nums outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                        value={shown.getFullYear()}
                        onChange={(e) =>
                          setMonth(
                            new Date(
                              Number(e.target.value),
                              shown.getMonth(),
                              1,
                            ),
                          )
                        }
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div
                      id={captionId}
                      aria-live="polite"
                      className="text-sm font-medium"
                    >
                      {captionFormat.format(shown)}
                    </div>
                  )}
                  {index === numberOfMonths - 1 && (
                    <button
                      type="button"
                      className={cn(navButton, 'absolute end-0')}
                      aria-label={labels?.nextMonth ?? 'Next month'}
                      disabled={nextDisabled}
                      onClick={() => setMonth(addMonths(month, 1))}
                    >
                      <ChevronRightIcon className="size-4 rtl:rotate-180" />
                    </button>
                  )}
                </div>

                <table
                  role="grid"
                  aria-labelledby={captionId}
                  className="border-collapse"
                >
                  <thead>
                    <tr>
                      {weekdays.map((day) => (
                        <th
                          key={day.getDay()}
                          scope="col"
                          abbr={weekdayLong.format(day)}
                          className="size-9 p-0 text-xs font-normal text-muted-foreground"
                        >
                          {weekdayFormat.format(day)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getMonthGrid(shown, weekStartsOn).map((week) => (
                      <tr key={toISODate(week[0]!)}>
                        {week.map((date) => {
                          const outside = !isSameMonth(date, shown);
                          if (outside && !showOutsideDays)
                            return (
                              <td
                                key={toISODate(date)}
                                className="size-9 p-0"
                              />
                            );

                          const disabled = isDisabled(date);
                          const isToday = isSameDay(date, today);
                          const rangeEnd = isRange
                            ? (range.to ?? previewEnd)
                            : null;
                          const isStart =
                            isRange && isSameDay(date, range.from);
                          const isEnd =
                            isRange && !!rangeEnd && isSameDay(date, rangeEnd);
                          const inRange =
                            isRange &&
                            !!range.from &&
                            !!rangeEnd &&
                            isWithinRange(date, range.from, rangeEnd);
                          const selected = isRange
                            ? isStart || (!!range.to && isEnd)
                            : isSameDay(date, single);
                          const edge = isStart || isEnd;
                          const tabbable =
                            isSameDay(date, focused) &&
                            isSameMonth(date, shown);

                          return (
                            <td
                              key={toISODate(date)}
                              role="gridcell"
                              aria-selected={
                                selected || (inRange && !!range.to) || undefined
                              }
                              className={cn(
                                'relative size-9 p-0 text-center pointer-coarse:size-10',
                                inRange && !outside && 'bg-primary/10',
                                inRange &&
                                  isSameDay(
                                    date,
                                    compareDays(range.from!, rangeEnd!) <= 0
                                      ? range.from
                                      : rangeEnd,
                                  ) &&
                                  'rounded-s-md',
                                inRange &&
                                  isSameDay(
                                    date,
                                    compareDays(range.from!, rangeEnd!) <= 0
                                      ? rangeEnd
                                      : range.from,
                                  ) &&
                                  'rounded-e-md',
                              )}
                            >
                              <button
                                type="button"
                                data-date={toISODate(date)}
                                tabIndex={tabbable ? 0 : -1}
                                aria-label={dayLabel.format(date)}
                                aria-current={isToday ? 'date' : undefined}
                                aria-disabled={disabled || undefined}
                                data-selected={selected || undefined}
                                data-outside={outside || undefined}
                                data-today={isToday || undefined}
                                onClick={() => select(date)}
                                onKeyDown={(e) => onKeyDown(e, date)}
                                onFocus={() =>
                                  !isSameDay(date, focused) && setFocused(date)
                                }
                                onMouseEnter={() => isRange && setHovered(date)}
                                className={cn(
                                  'inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-sm tabular-nums transition-colors outline-none pointer-coarse:size-10',
                                  'hover:bg-accent hover:text-accent-foreground',
                                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                                  outside && 'text-muted-foreground/60',
                                  isToday &&
                                    !selected &&
                                    'font-semibold text-primary',
                                  (selected || (edge && inRange)) &&
                                    'bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground',
                                  disabled &&
                                    'cursor-not-allowed text-muted-foreground/40 line-through hover:bg-transparent',
                                )}
                              >
                                {dayNumber.format(date)}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
