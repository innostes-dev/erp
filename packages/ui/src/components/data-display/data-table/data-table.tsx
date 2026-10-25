'use client';

import {
  forwardRef,
  useMemo,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../../../lib/cn';
import type { SlotClassNames } from '../../../lib/slots';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
} from '../../../lib/icons';
import { useControllableState } from '../../../lib/use-controllable-state';
import { Checkbox } from '../../forms/checkbox/checkbox';
import { Skeleton } from '../../feedback/skeleton/skeleton';
import { Pagination } from '../../navigation/pagination/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table/table';
import {
  compareSortValues,
  nextSortState,
  type SortState,
  type SortValue,
} from './sort';

/** Describes one column of a `DataTable`. */
export interface DataTableColumn<TRow> {
  /** Unique, stable id. Used for sorting state and React keys. */
  id: string;
  /** Header content. */
  header: ReactNode;
  /**
   * Plain-text column name, used as the cell label in `responsive="stack"` mode.
   * @default `header` when it's a string, otherwise `id`
   */
  label?: string;
  /**
   * Returns the raw value of this column for a row. Used for sorting, and rendered as text
   * when there's no `cell`.
   */
  accessor?: (row: TRow) => SortValue;
  /** Custom cell content, e.g. a `Badge` or row actions. */
  cell?: (row: TRow) => ReactNode;
  /** Allow sorting by this column. Needs `accessor` unless `manualSorting` is on. */
  sortable?: boolean;
  /** Horizontal alignment. Use `end` for numbers and money. @default 'start' */
  align?: 'start' | 'center' | 'end';
  /** CSS width, e.g. `'120px'` or `'20%'`. */
  width?: string;
  /** Extra classes for this column's cells. */
  className?: string;
  /** Extra classes for this column's header. */
  headerClassName?: string;
}

/** Inner parts of a `DataTable`, for `classNames`. */
export type DataTableSlot = 'wrapper' | 'table' | 'header' | 'headerCell' | 'row' | 'cell' | 'footer';

export interface DataTableProps<TRow> {
  /** The rows to show. With client-side pagination, pass all rows. */
  data: readonly TRow[];
  /** Column definitions. */
  columns: readonly DataTableColumn<TRow>[];
  /** Returns a stable unique id for a row (e.g. its database id). */
  getRowId: (row: TRow) => string;

  /** Sorting state (controlled). `null` = unsorted. */
  sort?: SortState | null;
  /** Initial sorting state (uncontrolled). */
  defaultSort?: SortState | null;
  /** Called when the user changes sorting. */
  onSortChange?: (sort: SortState | null) => void;
  /** Don't sort locally; you sort the data (e.g. on the server) in `onSortChange`. */
  manualSorting?: boolean;

  /** Show a checkbox column for selecting rows. */
  selectable?: boolean;
  /** Selected row ids (controlled). */
  selectedIds?: readonly string[];
  /** Initially selected row ids (uncontrolled). */
  defaultSelectedIds?: readonly string[];
  /** Called with the new selection. */
  onSelectedIdsChange?: (ids: string[]) => void;

  /** Rows per page. Turns on pagination when set. */
  pageSize?: number;
  /** Current page, from 1 (controlled). */
  page?: number;
  /** Initial page (uncontrolled). @default 1 */
  defaultPage?: number;
  /** Called with the new page number. */
  onPageChange?: (page: number) => void;
  /**
   * Don't paginate locally; `data` is already the current page (server-side pagination).
   * Pass `totalCount` so the table knows how many pages there are.
   */
  manualPagination?: boolean;
  /** Total rows across all pages, for `manualPagination`. */
  totalCount?: number;

  /** Show skeleton rows instead of data. */
  loading?: boolean;
  /** Number of skeleton rows while loading. @default 5 */
  loadingRowCount?: number;
  /** Shown when there are no rows. @default "No results." */
  emptyState?: ReactNode;
  /** Called when a row is clicked. Make sure the same action is reachable by keyboard. */
  onRowClick?: (row: TRow) => void;
  /** Accessible name for the table. Required unless the table is labelled another way. */
  'aria-label'?: string;
  /** Keep the header visible while the body scrolls (give the table a max height). */
  stickyHeader?: boolean;
  /**
   * On narrow containers: `scroll` keeps the table and scrolls sideways; `stack` turns each row into
   * a card of label/value pairs (container query, so it follows the table's own width).
   * @default 'scroll'
   */
  responsive?: 'scroll' | 'stack';
  /** Classes for inner parts. */
  classNames?: SlotClassNames<DataTableSlot>;
  /** Class for the outer wrapper. */
  className?: string;
}

// "stack" mode: below a 42rem-wide container, rows become cards of label/value pairs.
const stackRow =
  '@max-2xl:block @max-2xl:rounded-lg @max-2xl:border @max-2xl:border-border @max-2xl:bg-card @max-2xl:p-2 @max-2xl:last:border-b';
const stackCell =
  '@max-2xl:flex @max-2xl:items-center @max-2xl:justify-between @max-2xl:gap-4 @max-2xl:px-2 @max-2xl:py-1.5 @max-2xl:text-end @max-2xl:whitespace-normal ' +
  '@max-2xl:before:shrink-0 @max-2xl:before:text-start @max-2xl:before:text-xs @max-2xl:before:font-medium @max-2xl:before:text-muted-foreground @max-2xl:before:content-[attr(data-label)]';

const alignClass = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
} as const;

/**
 * A data grid for admin lists: typed columns, sorting, row selection, pagination,
 * loading and empty states. Works client-side out of the box, or server-side with
 * `manualSorting` / `manualPagination`.
 *
 * Every piece of state is optionally controlled (`sort`, `selectedIds`, `page`), so you can
 * sync it with the URL or a data-fetching library.
 *
 * @example
 * const columns: DataTableColumn<Invoice>[] = [
 *   { id: 'number', header: 'Invoice', accessor: (r) => r.number, sortable: true },
 *   { id: 'status', header: 'Status', cell: (r) => <Badge variant={tone[r.status]}>{r.status}</Badge> },
 *   { id: 'amount', header: 'Amount', accessor: (r) => r.amount, sortable: true, align: 'end',
 *     cell: (r) => money.format(r.amount) },
 * ];
 *
 * <DataTable aria-label="Invoices" data={invoices} columns={columns} getRowId={(r) => r.id}
 *   selectable pageSize={10} />
 */
function DataTableImpl<TRow>(
  {
    data,
    columns,
    getRowId,
    sort: sortProp,
    defaultSort = null,
    onSortChange,
    manualSorting = false,
    selectable = false,
    selectedIds: selectedProp,
    defaultSelectedIds = [],
    onSelectedIdsChange,
    pageSize,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    manualPagination = false,
    totalCount,
    loading = false,
    loadingRowCount = 5,
    emptyState = 'No results.',
    onRowClick,
    'aria-label': ariaLabel,
    stickyHeader = false,
    responsive = 'scroll',
    classNames,
    className,
  }: DataTableProps<TRow>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [sort, setSort] = useControllableState<SortState | null>({
    value: sortProp,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });
  const [selected, setSelected] = useControllableState<readonly string[]>({
    value: selectedProp,
    defaultValue: defaultSelectedIds,
    onChange: onSelectedIdsChange as
      ((ids: readonly string[]) => void) | undefined,
  });
  const [page, setPage] = useControllableState<number>({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });

  const sortedRows = useMemo(() => {
    if (manualSorting || !sort) return data;
    const column = columns.find((c) => c.id === sort.columnId);
    if (!column?.accessor) return data;
    const accessor = column.accessor;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...data].sort(
      (a, b) => compareSortValues(accessor(a), accessor(b)) * factor,
    );
  }, [data, columns, sort, manualSorting]);

  const paginated = pageSize !== undefined && pageSize > 0;
  const total = manualPagination
    ? (totalCount ?? data.length)
    : sortedRows.length;
  const pageCount = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const currentPage = Math.min(Math.max(1, page), pageCount);

  const visibleRows = useMemo(() => {
    if (!paginated || manualPagination) return sortedRows;
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, paginated, manualPagination, currentPage, pageSize]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const visibleIds = visibleRows.map(getRowId);
  const selectedOnPage = visibleIds.filter((id) => selectedSet.has(id)).length;
  const allOnPageSelected =
    visibleIds.length > 0 && selectedOnPage === visibleIds.length;
  const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected;

  function toggleAllOnPage(checked: boolean) {
    const next = new Set(selectedSet);
    for (const id of visibleIds) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    setSelected([...next]);
  }

  function toggleRow(id: string, checked: boolean) {
    const next = new Set(selectedSet);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected([...next]);
  }

  const columnCount = columns.length + (selectable ? 1 : 0);
  const stack = responsive === 'stack';
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * (pageSize ?? 0) + 1;
  const rangeEnd = paginated ? Math.min(currentPage * pageSize, total) : total;

  return (
    <div
      ref={ref}
      data-slot="data-table"
      data-responsive={responsive}
      className={cn('@container flex flex-col gap-3', className)}
    >
      <div
        data-slot="data-table-wrapper"
        className={cn('overflow-hidden rounded-lg border border-border', stack && '@max-2xl:border-0', classNames?.wrapper)}
      >
        <Table
          aria-label={ariaLabel}
          aria-busy={loading || undefined}
          className={cn(stack && '@max-2xl:block', classNames?.table)}
          containerClassName={cn(
            stickyHeader && 'max-h-[inherit] overflow-auto',
          )}
        >
          <TableHeader
            className={cn(
              'bg-muted/50',
              stickyHeader && 'sticky top-0 z-10 bg-muted',
              stack && '@max-2xl:sr-only',
              classNames?.header,
            )}
          >
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Select all rows on this page"
                    checked={allOnPageSelected}
                    indeterminate={someOnPageSelected}
                    disabled={loading || visibleIds.length === 0}
                    onCheckedChange={(checked) => toggleAllOnPage(checked)}
                  />
                </TableHead>
              )}
              {columns.map((column) => {
                const isSorted = sort?.columnId === column.id;
                const ariaSort = isSorted
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined;
                return (
                  <TableHead
                    key={column.id}
                    aria-sort={
                      column.sortable ? (ariaSort ?? 'none') : undefined
                    }
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      alignClass[column.align ?? 'start'],
                      classNames?.headerCell,
                      column.headerClassName,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => setSort(nextSortState(sort, column.id))}
                        className={cn(
                          '-mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1.5 py-1 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
                          isSorted && 'text-foreground',
                          column.align === 'end' && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        {isSorted ? (
                          sort.direction === 'asc' ? (
                            <ArrowUpIcon className="size-3.5" />
                          ) : (
                            <ArrowDownIcon className="size-3.5" />
                          )
                        ) : (
                          <ChevronsUpDownIcon className="size-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody className={cn(stack && '@max-2xl:flex @max-2xl:flex-col @max-2xl:gap-2')}>
            {loading ? (
              Array.from({ length: loadingRowCount }, (_, i) => (
                <TableRow key={`loading-${i}`} className="hover:bg-transparent">
                  {Array.from({ length: columnCount }, (_, j) => (
                    <TableCell key={j}>
                      <Skeleton
                        className={cn(
                          'h-4',
                          j === 0 && selectable ? 'w-4' : 'w-full max-w-40',
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : visibleRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columnCount}
                  className="h-32 text-center whitespace-normal text-muted-foreground"
                >
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const id = getRowId(row);
                const isSelected = selectedSet.has(id);
                return (
                  <TableRow
                    key={id}
                    data-state={isSelected ? 'selected' : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(onRowClick && 'cursor-pointer', stack && stackRow, classNames?.row)}
                  >
                    {selectable && (
                      <TableCell
                        data-label="Select"
                        className={cn(stack && stackCell, classNames?.cell)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          aria-label="Select row"
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleRow(id, checked)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        data-label={column.label ?? (typeof column.header === 'string' ? column.header : column.id)}
                        className={cn(
                          alignClass[column.align ?? 'start'],
                          column.align === 'end' && 'tabular-nums',
                          stack && stackCell,
                          classNames?.cell,
                          column.className,
                        )}
                      >
                        {column.cell
                          ? column.cell(row)
                          : formatValue(column.accessor?.(row))}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {(paginated || (selectable && selected.length > 0)) && (
        <div
          data-slot="data-table-footer"
          className={cn('flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground @md:flex-row', classNames?.footer)}
        >
          <div aria-live="polite">
            {selectable && selected.length > 0
              ? `${selected.length} selected`
              : paginated && `Showing ${rangeStart}–${rangeEnd} of ${total}`}
          </div>
          {paginated && pageCount > 1 && (
            <Pagination
              className="w-auto"
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
              showLabels={false}
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A data grid for admin lists: typed columns, sorting, row selection, pagination,
 * loading and empty states. Works client-side out of the box, or server-side with
 * `manualSorting` / `manualPagination`. See `DataTableProps` for every option.
 */
// forwardRef drops generics, so cast back to a generic component (TRow is inferred from `data`).
export const DataTable = forwardRef(DataTableImpl) as <TRow>(
  props: DataTableProps<TRow> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;

function formatValue(value: SortValue): ReactNode {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
