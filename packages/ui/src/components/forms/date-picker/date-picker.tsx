'use client';

import { forwardRef, useState, type ReactNode } from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { cn } from '../../../lib/cn';
import { CalendarIcon, XIcon } from '../../../lib/icons';
import { popupSurface } from '../../../lib/styles';
import { useControllableState } from '../../../lib/use-controllable-state';
import { isSameDay, toISODate, type DateRange } from '../../../lib/date';
import { Calendar, type CalendarSingleProps } from '../calendar/calendar';
import { inputVariants, type InputSize } from '../input/input-variants';
import {
    defaultDateRangePresets,
    type DateRangePreset,
} from './date-range-presets';

type CalendarPassthrough = Pick<
    CalendarSingleProps,
    | 'min'
    | 'max'
    | 'isDateDisabled'
    | 'locale'
    | 'weekStartsOn'
    | 'showOutsideDays'
    | 'captionLayout'
    | 'fromYear'
    | 'toYear'
    | 'labels'
>;

interface PickerTriggerProps {
    /** Text shown when nothing is selected. */
    placeholder?: string;
    /** Height and text size, matching `Input`. @default 'md' */
    size?: InputSize;
    /** Disable the picker. */
    disabled?: boolean;
    /** Mark the value as required (for forms and assistive technology). */
    required?: boolean;
    /** Show the invalid state (sets `aria-invalid`). */
    invalid?: boolean;
    /** Show a button that clears the value. @default true */
    clearable?: boolean;
    /** Accessible label for the clear button. @default 'Clear date' */
    clearLabel?: string;
    /** Id of the trigger button, for `<Label htmlFor>`. */
    id?: string;
    /** Accessible name when there's no visible label. */
    'aria-label'?: string;
    /** Ids of elements that describe the field (help text, errors). */
    'aria-describedby'?: string;
    /** Popup open state (controlled). */
    open?: boolean;
    /** Called when the popup opens or closes. */
    onOpenChange?: (open: boolean) => void;
    /** Popup alignment against the trigger. @default 'start' */
    align?: 'start' | 'center' | 'end';
    /** Extra classes for the trigger. */
    className?: string;
}

function PickerTrigger({
    id,
    size,
    disabled,
    invalid,
    required,
    className,
    label,
    isEmpty,
    ariaLabel,
    ariaDescribedBy,
}: {
    id?: string;
    size?: InputSize;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    className?: string;
    label: ReactNode;
    isEmpty: boolean;
    ariaLabel?: string;
    ariaDescribedBy?: string;
}) {
    return (
        <BasePopover.Trigger
            id={id}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            data-slot="date-picker-trigger"
            className={cn(
                inputVariants({ size }),
                'flex cursor-pointer items-center gap-2 pe-9 text-start',
                'data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/25',
                className,
            )}
        >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn('truncate', isEmpty && 'text-muted-foreground')}>
                {label}
            </span>
        </BasePopover.Trigger>
    );
}

function ClearButton({
    onClear,
    hidden,
    ariaLabel = 'Clear date',
}: {
    onClear: () => void;
    hidden: boolean;
    ariaLabel?: string;
}) {
    if (hidden) return null;
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            onClick={onClear}
            className="absolute end-1.5 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
            <XIcon className="size-4" />
        </button>
    );
}

const popupClass = cn(popupSurface, 'max-w-[calc(100vw-1rem)] overflow-auto');

export interface DatePickerProps
    extends CalendarPassthrough, PickerTriggerProps {
    /** Selected date (controlled). */
    value?: Date | null;
    /** Initially selected date (uncontrolled). */
    defaultValue?: Date | null;
    /** Called when the date changes (null when cleared). */
    onValueChange?: (value: Date | null) => void;
    /**
     * How the date is shown: `Intl.DateTimeFormat` options, or a function.
     * @default { dateStyle: 'medium' }
     */
    format?: Intl.DateTimeFormatOptions | ((date: Date) => string);
    /** Form field name. Submitted as `YYYY-MM-DD`. */
    name?: string;
}

function formatWith(
    format: DatePickerProps['format'],
    locale: string | undefined,
    date: Date,
) {
    return typeof format === 'function'
        ? format(date)
        : new Intl.DateTimeFormat(locale, format ?? { dateStyle: 'medium' }).format(
            date,
        );
}

/**
 * A date field: a button that shows the date and opens a `Calendar` in a popover.
 * Submits `YYYY-MM-DD` under `name`, so it works in plain forms and server actions.
 *
 * @example
 * <Label htmlFor="due">Due date</Label>
 * <DatePicker id="due" name="dueDate" value={due} onValueChange={setDue} min={new Date()} />
 */
export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
    function DatePicker(
        {
            value: valueProp,
            defaultValue = null,
            onValueChange,
            format,
            name,
            placeholder = 'Pick a date',
            clearable = true,
            clearLabel = 'Clear date',
            open: openProp,
            onOpenChange,
            align = 'start',
            locale,
            id,
            size,
            disabled,
            required,
            invalid,
            className,
            'aria-label': ariaLabel,
            'aria-describedby': ariaDescribedBy,
            ...calendarProps
        },
        ref,
    ) {
        const [value, setValue] = useControllableState({
            value: valueProp,
            defaultValue,
            onChange: onValueChange,
        });
        const [open, setOpen] = useControllableState({
            value: openProp,
            defaultValue: false,
            onChange: onOpenChange,
        });

        return (
            <div ref={ref} data-slot="date-picker" className="relative w-full">
                <BasePopover.Root open={open} onOpenChange={(next) => setOpen(next)}>
                    <PickerTrigger
                        id={id}
                        size={size}
                        disabled={disabled}
                        invalid={invalid}
                        required={required}
                        className={className}
                        ariaLabel={ariaLabel}
                        ariaDescribedBy={ariaDescribedBy}
                        isEmpty={!value}
                        label={value ? formatWith(format, locale, value) : placeholder}
                    />
                    <BasePopover.Portal>
                        <BasePopover.Positioner
                            className="z-50"
                            side="bottom"
                            align={align}
                            sideOffset={4}
                        >
                            <BasePopover.Popup
                                data-slot="date-picker-content"
                                className={popupClass}
                            >
                                <Calendar
                                    {...calendarProps}
                                    locale={locale}
                                    autoFocus
                                    value={value}
                                    onValueChange={(date) => {
                                        setValue(date);
                                        setOpen(false);
                                    }}
                                />
                            </BasePopover.Popup>
                        </BasePopover.Positioner>
                    </BasePopover.Portal>
                </BasePopover.Root>
                <ClearButton
                    ariaLabel={clearLabel}
                    hidden={!clearable || !value || !!disabled}
                    onClear={() => setValue(null)}
                />
                {name && (
                    <input
                        type="hidden"
                        name={name}
                        value={value ? toISODate(value) : ''}
                    />
                )}
            </div>
        );
    },
);

export interface DateRangePickerProps
    extends CalendarPassthrough, PickerTriggerProps {
    /** Selected range (controlled). */
    value?: DateRange;
    /** Initially selected range (uncontrolled). */
    defaultValue?: DateRange;
    /** Called when a complete range is picked, or when cleared. */
    onValueChange?: (value: DateRange) => void;
    /**
     * Shortcuts next to the calendar. Pass `[]` to hide them.
     * @default defaultDateRangePresets (Today, Last 7 days, This month, …)
     */
    presets?: DateRangePreset[];
    /**
     * Months shown side by side.
     * @default 2 (1 on small screens)
     */
    numberOfMonths?: 1 | 2;
    /**
     * How each date is shown: `Intl.DateTimeFormat` options.
     * @default { dateStyle: 'medium' }
     */
    format?: Intl.DateTimeFormatOptions;
    /** Form field name for the start date (`YYYY-MM-DD`). */
    startName?: string;
    /** Form field name for the end date (`YYYY-MM-DD`). */
    endName?: string;
    /** Accessible label for the presets list. @default 'Presets' */
    presetsLabel?: string;
}

/**
 * A date range field with presets: pick a start and end day on a two-month calendar, or one
 * click on "Last 30 days". `onValueChange` fires once the range is complete.
 *
 * @example
 * <DateRangePicker aria-label="Report period" value={range} onValueChange={setRange} />
 */
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
    function DateRangePicker(
        {
            value: valueProp,
            defaultValue = { from: null, to: null },
            onValueChange,
            presets = defaultDateRangePresets,
            numberOfMonths = 2,
            format,
            startName,
            endName,
            placeholder = 'Pick a date range',
            clearable = true,
            clearLabel = 'Clear date',
            presetsLabel = 'Presets',
            open: openProp,
            onOpenChange,
            align = 'start',
            locale,
            id,
            size,
            disabled,
            required,
            invalid,
            className,
            'aria-label': ariaLabel,
            'aria-describedby': ariaDescribedBy,
            ...calendarProps
        },
        ref,
    ) {
        const [value, setValue] = useControllableState({
            value: valueProp,
            defaultValue,
            onChange: onValueChange,
        });
        const [open, setOpen] = useControllableState({
            value: openProp,
            defaultValue: false,
            onChange: onOpenChange,
        });
        // The in-progress selection while the popup is open; committed when both ends are picked.
        const [draft, setDraft] = useState<DateRange>(value);

        const formatter = new Intl.DateTimeFormat(
            locale,
            format ?? { dateStyle: 'medium' },
        );
        const label =
            value.from && value.to
                ? isSameDay(value.from, value.to)
                    ? formatter.format(value.from)
                    : formatter.formatRange(value.from, value.to)
                : placeholder;

        function commit(range: DateRange) {
            setValue(range);
            setOpen(false);
        }

        return (
            <div ref={ref} data-slot="date-range-picker" className="relative w-full">
                <BasePopover.Root
                    open={open}
                    onOpenChange={(next) => {
                        if (next) setDraft(value);
                        setOpen(next);
                    }}
                >
                    <PickerTrigger
                        id={id}
                        size={size}
                        disabled={disabled}
                        invalid={invalid}
                        required={required}
                        className={className}
                        ariaLabel={ariaLabel}
                        ariaDescribedBy={ariaDescribedBy}
                        isEmpty={!(value.from && value.to)}
                        label={label}
                    />
                    <BasePopover.Portal>
                        <BasePopover.Positioner
                            className="z-50"
                            side="bottom"
                            align={align}
                            sideOffset={4}
                        >
                            <BasePopover.Popup
                                data-slot="date-range-picker-content"
                                className={cn(popupClass, 'flex flex-col sm:flex-row')}
                            >
                                {presets.length > 0 && (
                                    <div
                                        role="group"
                                        aria-label={presetsLabel}
                                        className="flex gap-1 overflow-x-auto border-b border-border p-2 sm:w-40 sm:flex-col sm:border-e sm:border-b-0"
                                    >
                                        {presets.map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => commit(preset.range())}
                                                className="cursor-pointer rounded-md px-2.5 py-1.5 text-start text-sm whitespace-nowrap hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <Calendar
                                    {...calendarProps}
                                    mode="range"
                                    locale={locale}
                                    autoFocus
                                    numberOfMonths={numberOfMonths}
                                    value={draft}
                                    onValueChange={(range) => {
                                        setDraft(range);
                                        if (range.from && range.to) commit(range);
                                    }}
                                />
                            </BasePopover.Popup>
                        </BasePopover.Positioner>
                    </BasePopover.Portal>
                </BasePopover.Root>
                <ClearButton
                    ariaLabel={clearLabel}
                    hidden={!clearable || !value.from || !!disabled}
                    onClear={() => setValue({ from: null, to: null })}
                />
                {startName && (
                    <input
                        type="hidden"
                        name={startName}
                        value={value.from ? toISODate(value.from) : ''}
                    />
                )}
                {endName && (
                    <input
                        type="hidden"
                        name={endName}
                        value={value.to ? toISODate(value.to) : ''}
                    />
                )}
            </div>
        );
    },
);
