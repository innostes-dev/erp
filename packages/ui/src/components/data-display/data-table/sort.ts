/** Sort direction. */
export type SortDirection = 'asc' | 'desc';

/** Which column the table is sorted by, and in which direction. */
export interface SortState {
  columnId: string;
  direction: SortDirection;
}

/** A value a column can be sorted by. */
export type SortValue =
  string | number | bigint | boolean | Date | null | undefined;

const collator =
  typeof Intl !== 'undefined'
    ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    : null;

/**
 * Compares two sort values. `null`/`undefined` always sort last; strings use natural,
 * locale-aware order ("Item 2" before "Item 10"). Server-safe.
 */
export function compareSortValues(a: SortValue, b: SortValue): number {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;

  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'bigint' && typeof b === 'bigint')
    return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === 'boolean' && typeof b === 'boolean')
    return Number(a) - Number(b);

  const as = String(a);
  const bs = String(b);
  return collator ? collator.compare(as, bs) : as.localeCompare(bs);
}

/** Next state when a sortable header is clicked: asc → desc → unsorted. */
export function nextSortState(
  current: SortState | null,
  columnId: string,
): SortState | null {
  if (!current || current.columnId !== columnId)
    return { columnId, direction: 'asc' };
  if (current.direction === 'asc') return { columnId, direction: 'desc' };
  return null;
}
