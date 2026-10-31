/** Why a file was not added to a `FileDropzone`. */
export type FileRejectionReason = 'type' | 'size' | 'count';

/** A file that was dropped or picked but not accepted. */
export interface FileRejection {
  file: File;
  reasons: FileRejectionReason[];
}

/**
 * Whether a file matches an `accept` string like the native input's: extensions (`.pdf`),
 * exact MIME types (`application/pdf`) or wildcards (`image/*`).
 */
export function fileMatchesAccept(
  file: File,
  accept: string | undefined,
): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

/**
 * Formats a byte count for people, e.g. `1.5 MB`.
 *
 * @example
 * formatBytes(1536) // → '1.5 kB'
 */
export function formatBytes(bytes: number, locale?: string): string {
  const units = [
    'byte',
    'kilobyte',
    'megabyte',
    'gigabyte',
    'terabyte',
  ] as const;
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: units[unit],
    unitDisplay: unit === 0 ? 'long' : 'short',
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}
