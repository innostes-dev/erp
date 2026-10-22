/**
 * Small, dependency-free date helpers for the calendar components. All functions work on
 * local calendar days (time is ignored) and never mutate their input. Server-safe.
 *
 * @internal
 */

/** A date range. Either end may be missing while the user is still picking. */
export interface DateRange {
  from: Date | null;
  to: Date | null;
}

/** Day of the week, 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Adds months, clamping the day so Jan 31 + 1 month = Feb 28/29 (not Mar 3). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay),
  );
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfWeek(date: Date, weekStartsOn: Weekday): Date {
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(date, -diff);
}

export function endOfWeek(date: Date, weekStartsOn: Weekday): Date {
  return addDays(startOfWeek(date, weekStartsOn), 6);
}

export function isSameDay(
  a: Date | null | undefined,
  b: Date | null | undefined,
): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Compares calendar days: negative if a is before b, 0 if the same day, positive after. */
export function compareDays(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

/** True if `date` is between `from` and `to`, inclusive, in either order. */
export function isWithinRange(date: Date, from: Date, to: Date): boolean {
  const [start, end] = compareDays(from, to) <= 0 ? [from, to] : [to, from];
  return compareDays(date, start) >= 0 && compareDays(date, end) <= 0;
}

/** Clamps a day between optional min and max days. */
export function clampDay(
  date: Date,
  min?: Date | null,
  max?: Date | null,
): Date {
  if (min && compareDays(date, min) < 0) return startOfDay(min);
  if (max && compareDays(date, max) > 0) return startOfDay(max);
  return date;
}

/**
 * The 6×7 grid of days shown for a month, starting on `weekStartsOn`. Always 42 days, so
 * the calendar height doesn't jump between months.
 */
export function getMonthGrid(month: Date, weekStartsOn: Weekday): Date[][] {
  const first = startOfWeek(startOfMonth(month), weekStartsOn);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(first, week * 7 + day)),
  );
}

/**
 * First day of the week for a locale (e.g. Monday for en-GB and de, Sunday for en-US),
 * using `Intl.Locale#weekInfo` where supported. Falls back to Monday (ISO 8601).
 */
export function getWeekStartsOn(locale?: string): Weekday {
  try {
    const loc = new Intl.Locale(
      locale ?? Intl.DateTimeFormat().resolvedOptions().locale,
    ) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info) return (info.firstDay % 7) as Weekday;
  } catch {
    // Unsupported locale or API: fall through.
  }
  return 1;
}

/** Formats a date as `YYYY-MM-DD` in local time (for form values and `<input type="date">`). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses `YYYY-MM-DD` as a local date. Returns null if invalid. */
export function fromISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return date.getMonth() === Number(match[2]) - 1 ? date : null;
}
