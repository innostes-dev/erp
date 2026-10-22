import {
  addDays,
  addMonths,
  endOfMonth,
  startOfDay,
  startOfMonth,
  type DateRange,
} from '../../../lib/date';

/** A shortcut shown next to the calendar in `DateRangePicker`. */
export interface DateRangePreset {
  /** Label, e.g. "Last 7 days". */
  label: string;
  /** Returns the range. Called when the preset is chosen, so "today" is always current. */
  range: () => DateRange;
}

/**
 * Common admin presets: Today, Yesterday, Last 7 / 30 days, This / Last month, This year.
 * Pass your own array to `presets` for other ranges or translated labels. Server-safe.
 */
export const defaultDateRangePresets: DateRangePreset[] = [
  {
    label: 'Today',
    range: () => ({ from: startOfDay(new Date()), to: startOfDay(new Date()) }),
  },
  {
    label: 'Yesterday',
    range: () => {
      const d = addDays(startOfDay(new Date()), -1);
      return { from: d, to: d };
    },
  },
  {
    label: 'Last 7 days',
    range: () => ({
      from: addDays(startOfDay(new Date()), -6),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 days',
    range: () => ({
      from: addDays(startOfDay(new Date()), -29),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: 'This month',
    range: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Last month',
    range: () => {
      const last = addMonths(startOfMonth(new Date()), -1);
      return { from: last, to: endOfMonth(last) };
    },
  },
  {
    label: 'This year',
    range: () => ({
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(new Date().getFullYear(), 11, 31),
    }),
  },
];
