const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

/**
 * Formats a date relative to now, in the user's language: "2 min ago", "yesterday", "in 3 days".
 * Under a minute shows "just now" (localised via `Intl.RelativeTimeFormat` "now"). Strings are
 * returned unchanged, so you can pass pre-formatted text. Server-safe.
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 120_000)) // "2 min. ago" (en, style 'short')
 */
export function formatRelativeTime(
  value: Date | string | number,
  options: { locale?: string; now?: Date; style?: Intl.RelativeTimeFormatStyle } = {},
): string {
  if (typeof value === 'string') return value;
  const date = typeof value === 'number' ? new Date(value) : value;
  const now = options.now ?? new Date();
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(options.locale, { numeric: 'auto', style: options.style ?? 'short' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, 'second');
}
