import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import './DataGrid.css';

// ═══════════════════════════════════════════════
// Types & Interfaces
// ═══════════════════════════════════════════════

export type SortDir = 'asc' | 'desc';
export type PinPosition = 'left' | 'right';
export type GridDensity = 'compact' | 'standard' | 'comfortable';
export type SelectionMode = 'single' | 'multiple' | 'checkbox';

export type FilterOp =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'empty'
  | 'notEmpty';

export interface SortModel {
  key: string;
  dir: SortDir;
  priority: number;
}

export interface FilterModel {
  key: string;
  op: FilterOp;
  value: string;
  value2?: string; // used by 'between'
}

export interface CellRenderParams<T = Record<string, unknown>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any; // intentionally `any` — cell value type is not statically knowable per column
  row: T;
  rowIndex: number;
  col: ColDef<T>;
  isSelected: boolean;
  isEditing: boolean;
}

export interface ColDef<T = Record<string, unknown>> {
  key: string;
  header?: string | React.ReactNode;
  accessor?: keyof T | ((row: T, index: number) => unknown);
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  resizable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  pinned?: PinPosition;
  hidden?: boolean;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  editable?: boolean;
  /** Display type — affects default filter operators shown */
  type?: 'string' | 'number' | 'date' | 'boolean';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count' | ((vals: any[]) => any);
  /** Column group label rendered above this column */
  group?: string;
  /** Tooltip text shown on header hover */
  headerTooltip?: string;
  /** Lock column position; prevents drag reorder */
  lockPosition?: boolean;
  cellRenderer?: (params: CellRenderParams<T>) => React.ReactNode;
  headerRenderer?: (params: { col: ColDef<T>; sortDir?: SortDir | null }) => React.ReactNode;
}

export interface DataGridProps<T = Record<string, unknown>> {
  // ── Data ─────────────────────────────────────────────────────────────────
  rows: T[];
  columns: ColDef<T>[];
  getRowId?: (row: T, index: number) => string | number;

  // ── Feature flags ────────────────────────────────────────────────────────
  sorting?: boolean;
  multiSort?: boolean;
  filtering?: boolean;
  showColumnFilters?: boolean;
  selection?: SelectionMode | false;
  pagination?: boolean;
  columnResize?: boolean;
  columnReorder?: boolean;
  rowExpansion?: boolean;
  showAggregation?: boolean;
  grouped?: boolean;
  groupByKey?: string;
  keyboardNavigation?: boolean;

  // ── Controlled state ──────────────────────────────────────────────────────
  sortModel?: SortModel[];
  filterModel?: FilterModel[];
  selectedRowIds?: (string | number)[];
  page?: number;
  pageSize?: number;
  expandedRowIds?: (string | number)[];

  // ── Callbacks ─────────────────────────────────────────────────────────────
  onSortChange?: (model: SortModel[]) => void;
  onFilterChange?: (model: FilterModel[]) => void;
  onSelectionChange?: (ids: (string | number)[], rows: T[]) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRowExpand?: (id: string | number, expanded: boolean, row: T) => void;
  onRowClick?: (row: T, index: number, event: React.MouseEvent) => void;
  onCellClick?: (value: unknown, row: T, col: ColDef<T>, event: React.MouseEvent) => void;
  onEditCommit?: (row: T, col: ColDef<T>, newValue: unknown) => void;
  onColumnReorder?: (newOrder: string[]) => void;

  // ── Server-side ───────────────────────────────────────────────────────────
  totalRows?: number;
  loading?: boolean;
  serverSideSort?: boolean;
  serverSideFilter?: boolean;

  // ── Layout ────────────────────────────────────────────────────────────────
  height?: number | string;
  maxHeight?: number | string;
  density?: GridDensity;
  striped?: boolean;
  bordered?: boolean;
  stickyHeader?: boolean;

  // ── Toolbar / Footer ──────────────────────────────────────────────────────
  showToolbar?: boolean;
  showFooter?: boolean;
  pageSizeOptions?: number[];
  exportCsv?: boolean;
  exportFileName?: string;
  toolbarContent?: React.ReactNode;
  footerContent?: React.ReactNode;

  // ── Custom slots ──────────────────────────────────────────────────────────
  expandedRowContent?: (row: T) => React.ReactNode;
  emptyContent?: React.ReactNode;
  loadingContent?: React.ReactNode;

  // ── Virtualization ────────────────────────────────────────────────────────
  virtualized?: boolean;
  overscan?: number;
  rowHeight?: number;

  // ── Accessibility ─────────────────────────────────────────────────────────
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const ROW_HEIGHTS: Record<GridDensity, number> = {
  compact: 34,
  standard: 44,
  comfortable: 56,
};

const HEADER_HEIGHTS: Record<GridDensity, number> = {
  compact: 36,
  standard: 44,
  comfortable: 52,
};

const GROUP_ROW_HEIGHT = 36; // px — fixed height for group header rows

const DEFAULT_COL_WIDTH = 160;
const CHECKBOX_COL_WIDTH = 40;
const EXPAND_COL_WIDTH = 40;

// ═══════════════════════════════════════════════
// Internal State & Reducer
// ═══════════════════════════════════════════════

interface ColumnFilterEntry {
  op: FilterOp;
  value: string;
  value2: string;
}

interface GridState {
  sortModel: SortModel[];
  globalFilter: string;
  selectedIds: Set<string | number>;
  page: number;
  pageSize: number;
  expandedRowIds: Set<string | number>;
  collapsedGroups: Set<string>;
  columnWidths: Record<string, number>;
  hiddenColumns: Set<string>;
  columnOrder: string[];
  density: GridDensity;
  editingCell: { rowId: string | number; colKey: string } | null;
  editingValue: unknown;
  columnFilters: Record<string, ColumnFilterEntry>;
}

type GridAction =
  | { type: 'SET_SORT'; payload: SortModel[] }
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_COLUMN_FILTER'; payload: { key: string } & ColumnFilterEntry }
  | { type: 'TOGGLE_SELECT'; payload: { id: string | number; mode: SelectionMode } }
  | { type: 'SELECT_ALL'; payload: { ids: (string | number)[] } }
  | { type: 'SELECT_RANGE'; payload: { ids: (string | number)[] } }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'TOGGLE_ROW_EXPAND'; payload: string | number }
  | { type: 'TOGGLE_GROUP'; payload: string }
  | { type: 'SET_COLUMN_WIDTH'; payload: { key: string; width: number } }
  | { type: 'TOGGLE_COLUMN_VISIBILITY'; payload: string }
  | { type: 'SET_COLUMN_ORDER'; payload: string[] }
  | { type: 'SET_DENSITY'; payload: GridDensity }
  | { type: 'START_EDITING'; payload: { rowId: string | number; colKey: string; value: unknown } }
  | { type: 'SET_EDITING_VALUE'; payload: unknown }
  | { type: 'COMMIT_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'RESET_FILTERS' };

function gridReducer(state: GridState, action: GridAction): GridState {
  switch (action.type) {
    case 'SET_SORT':
      return { ...state, sortModel: action.payload, page: 0 };

    case 'SET_GLOBAL_FILTER':
      return { ...state, globalFilter: action.payload, page: 0 };

    case 'SET_COLUMN_FILTER':
      return {
        ...state,
        columnFilters: {
          ...state.columnFilters,
          [action.payload.key]: {
            op: action.payload.op,
            value: action.payload.value,
            value2: action.payload.value2,
          },
        },
        page: 0,
      };

    case 'TOGGLE_SELECT': {
      const { id, mode } = action.payload;
      const next = new Set(state.selectedIds);
      if (mode === 'single') {
        return { ...state, selectedIds: next.has(id) ? new Set() : new Set([id]) };
      }
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...state, selectedIds: next };
    }

    case 'SELECT_ALL':
      return { ...state, selectedIds: new Set(action.payload.ids) };

    case 'SELECT_RANGE': {
      const next = new Set(state.selectedIds);
      action.payload.ids.forEach((id) => next.add(id));
      return { ...state, selectedIds: next };
    }

    case 'DESELECT_ALL':
      return { ...state, selectedIds: new Set() };

    case 'SET_PAGE':
      return { ...state, page: action.payload };

    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, page: 0 };

    case 'TOGGLE_ROW_EXPAND': {
      const next = new Set(state.expandedRowIds);
      next.has(action.payload) ? next.delete(action.payload) : next.add(action.payload);
      return { ...state, expandedRowIds: next };
    }

    case 'TOGGLE_GROUP': {
      const next = new Set(state.collapsedGroups);
      next.has(action.payload) ? next.delete(action.payload) : next.add(action.payload);
      return { ...state, collapsedGroups: next };
    }

    case 'SET_COLUMN_WIDTH':
      return {
        ...state,
        columnWidths: { ...state.columnWidths, [action.payload.key]: action.payload.width },
      };

    case 'TOGGLE_COLUMN_VISIBILITY': {
      const next = new Set(state.hiddenColumns);
      next.has(action.payload) ? next.delete(action.payload) : next.add(action.payload);
      return { ...state, hiddenColumns: next };
    }

    case 'SET_COLUMN_ORDER':
      return { ...state, columnOrder: action.payload };

    case 'SET_DENSITY':
      return { ...state, density: action.payload };

    case 'START_EDITING':
      return {
        ...state,
        editingCell: { rowId: action.payload.rowId, colKey: action.payload.colKey },
        editingValue: action.payload.value,
      };

    case 'SET_EDITING_VALUE':
      return { ...state, editingValue: action.payload };

    case 'COMMIT_EDIT':
      return { ...state, editingCell: null, editingValue: null };

    case 'CANCEL_EDIT':
      return { ...state, editingCell: null, editingValue: null };

    case 'RESET_FILTERS':
      return { ...state, globalFilter: '', columnFilters: {}, page: 0 };

    default:
      return state;
  }
}

// ═══════════════════════════════════════════════
// Utility helpers
// ═══════════════════════════════════════════════

function getCellValue<T>(row: T, col: ColDef<T>, rowIndex: number): unknown {
  if (col.accessor) {
    return typeof col.accessor === 'function'
      ? col.accessor(row, rowIndex)
      : (row as Record<string, unknown>)[col.accessor as string];
  }
  return (row as Record<string, unknown>)[col.key];
}

function formatCellValue(value: unknown, type?: ColDef['type']): string {
  if (value === null || value === undefined) return '';
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (type === 'date' && value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

function applyGlobalFilter<T>(rows: T[], cols: ColDef<T>[], query: string): T[] {
  if (!query.trim()) return rows;
  const q = query.toLowerCase();
  return rows.filter((row, i) =>
    cols.some((col) => {
      if (col.hidden) return false;
      const val = getCellValue(row, col, i);
      return String(val ?? '').toLowerCase().includes(q);
    })
  );
}

function applyColumnFilters<T>(
  rows: T[],
  cols: ColDef<T>[],
  filters: Record<string, ColumnFilterEntry>
): T[] {
  const active = Object.entries(filters).filter(([, f]) => {
    if (f.op === 'empty' || f.op === 'notEmpty') return true;
    return f.value.trim() !== '';
  });
  if (!active.length) return rows;

  return rows.filter((row, i) =>
    active.every(([key, filter]) => {
      const col = cols.find((c) => c.key === key);
      if (!col) return true;
      const rawVal = getCellValue(row, col, i);
      const val = String(rawVal ?? '');
      const fv = filter.value;
      const fv2 = filter.value2 ?? '';

      switch (filter.op) {
        case 'contains': return val.toLowerCase().includes(fv.toLowerCase());
        case 'equals': return val.toLowerCase() === fv.toLowerCase();
        case 'startsWith': return val.toLowerCase().startsWith(fv.toLowerCase());
        case 'endsWith': return val.toLowerCase().endsWith(fv.toLowerCase());
        case 'gt': return Number(val) > Number(fv);
        case 'gte': return Number(val) >= Number(fv);
        case 'lt': return Number(val) < Number(fv);
        case 'lte': return Number(val) <= Number(fv);
        case 'between': return Number(val) >= Number(fv) && Number(val) <= Number(fv2);
        case 'empty': return val === '' || rawVal === null || rawVal === undefined;
        case 'notEmpty': return val !== '' && rawVal !== null && rawVal !== undefined;
        default: return val.toLowerCase().includes(fv.toLowerCase());
      }
    })
  );
}

function applySort<T>(rows: T[], cols: ColDef<T>[], sortModel: SortModel[]): T[] {
  if (!sortModel.length) return rows;
  const sorted = [...sortModel].sort((a, b) => a.priority - b.priority);

  return [...rows].sort((a, b) => {
    for (const s of sorted) {
      const col = cols.find((c) => c.key === s.key);
      if (!col) continue;
      const av = getCellValue(a, col, 0);
      const bv = getCellValue(b, col, 0);

      let cmp = 0;
      if (av === null || av === undefined) cmp = 1;
      else if (bv === null || bv === undefined) cmp = -1;
      else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });

      if (cmp !== 0) return s.dir === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

function exportToCsv<T>(rows: T[], cols: ColDef<T>[], filename: string): void {
  const visible = cols.filter((c) => !c.hidden);
  const header = visible.map((c) => `"${String(c.header ?? c.key)}"`).join(',');
  const body = rows
    .map((row, i) =>
      visible
        .map((col) => {
          const val = getCellValue(row, col, i);
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyRowsToClipboard<T>(rows: T[], cols: ColDef<T>[]): void {
  const visible = cols.filter((c) => !c.hidden);
  const text = rows
    .map((row, i) =>
      visible.map((col) => String(getCellValue(row, col, i) ?? '')).join('\t')
    )
    .join('\n');
  navigator.clipboard?.writeText(text).catch(() => { /* silent */ });
}

function computeAggregation<T>(rows: T[], col: ColDef<T>): string {
  if (!col.aggregate) return '';
  const values = rows
    .map((row, i) => getCellValue(row, col, i))
    .filter((v) => v !== null && v !== undefined);

  if (typeof col.aggregate === 'function') return String(col.aggregate(values));

  switch (col.aggregate) {
    case 'sum': return String(values.reduce<number>((a, b) => a + Number(b), 0));
    case 'avg': return values.length
      ? String((values.reduce<number>((a, b) => a + Number(b), 0) / values.length).toFixed(2))
      : '';
    case 'min': return String(Math.min(...values.map(Number)));
    case 'max': return String(Math.max(...values.map(Number)));
    case 'count': return String(values.length);
    default: return '';
  }
}

// ═══════════════════════════════════════════════
// Flat item types (for grouped + virtualized rendering)
// ═══════════════════════════════════════════════

type GridRow<T> = T & { __id: string | number };

interface FlatGroupHeader {
  kind: 'group';
  groupKey: string;
  groupValue: string;
  rowCount: number;
  isCollapsed: boolean;
}

interface FlatDataRow<T> {
  kind: 'row';
  row: GridRow<T>;
  absoluteIndex: number;
}

type FlatItem<T> = FlatGroupHeader | FlatDataRow<T>;

function buildFlatItems<T>(
  rows: GridRow<T>[],
  groupByKey: string,
  collapsedGroups: Set<string>
): FlatItem<T>[] {
  const groups = new Map<string, GridRow<T>[]>();
  rows.forEach((row) => {
    const val = String((row as Record<string, unknown>)[groupByKey] ?? '');
    if (!groups.has(val)) groups.set(val, []);
    groups.get(val)!.push(row);
  });

  const flat: FlatItem<T>[] = [];
  let absIdx = 0;

  groups.forEach((groupRows, groupValue) => {
    const isCollapsed = collapsedGroups.has(groupValue);
    flat.push({ kind: 'group', groupKey: groupByKey, groupValue, rowCount: groupRows.length, isCollapsed });
    if (!isCollapsed) {
      groupRows.forEach((row) => {
        flat.push({ kind: 'row', row, absoluteIndex: absIdx++ });
      });
    } else {
      absIdx += groupRows.length;
    }
  });

  return flat;
}

// ═══════════════════════════════════════════════
// Virtual Scroll Hook
// ═══════════════════════════════════════════════

function useVirtualScroll({
  totalCount,
  rowHeight,
  overscan = 5,
  containerRef,
  enabled = true,
  headerOffset = 0,
}: {
  totalCount: number;
  rowHeight: number;
  overscan?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  enabled?: boolean;
  headerOffset?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const onScroll = () => setScrollTop(el.scrollTop);
    const ro = new ResizeObserver(([entry]) => setViewportHeight(entry.contentRect.height));

    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);
    setViewportHeight(el.clientHeight);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [containerRef, enabled]);

  const effective = Math.max(0, viewportHeight - headerOffset);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visible = Math.ceil(effective / rowHeight) + overscan * 2;
  const endIndex = Math.min(totalCount - 1, startIndex + visible);
  const totalHeight = totalCount * rowHeight;
  const offsetTop = startIndex * rowHeight;

  return { startIndex, endIndex, totalHeight, offsetTop };
}

// ═══════════════════════════════════════════════
// Column Resize Hook
// ═══════════════════════════════════════════════

function useColumnResize(dispatch: React.Dispatch<GridAction>, enabled: boolean) {
  const startX = useRef(0);
  const startW = useRef(0);
  const activeKey = useRef('');

  const startResize = useCallback(
    (e: React.MouseEvent, colKey: string, currentWidth: number) => {
      if (!enabled) return;
      e.preventDefault();
      startX.current = e.clientX;
      startW.current = currentWidth;
      activeKey.current = colKey;

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX.current;
        const newWidth = Math.max(48, startW.current + delta);
        dispatch({ type: 'SET_COLUMN_WIDTH', payload: { key: activeKey.current, width: newWidth } });
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        activeKey.current = '';
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [dispatch, enabled]
  );

  return { startResize };
}

// ═══════════════════════════════════════════════
// Column Drag Reorder Hook
// ═══════════════════════════════════════════════

function useColumnDragReorder(
  columnOrder: string[],
  dispatch: React.Dispatch<GridAction>,
  onColumnReorder?: (newOrder: string[]) => void,
  enabled?: boolean
) {
  const draggingKey = useRef<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [dragSide, setDragSide] = useState<'left' | 'right'>('right');

  const onDragStart = useCallback((e: React.DragEvent, key: string) => {
    if (!enabled) return;
    draggingKey.current = key;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  }, [enabled]);

  const onDragOver = useCallback((e: React.DragEvent, key: string) => {
    if (!enabled || key === draggingKey.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const side = e.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
    setDragOverKey(key);
    setDragSide(side);
  }, [enabled]);

  const onDrop = useCallback((e: React.DragEvent, targetKey: string) => {
    if (!enabled) return;
    e.preventDefault();
    const srcKey = draggingKey.current;
    if (!srcKey || srcKey === targetKey) {
      setDragOverKey(null);
      return;
    }

    const newOrder = [...columnOrder];
    const fromIdx = newOrder.indexOf(srcKey);
    const toIdx = newOrder.indexOf(targetKey);
    if (fromIdx === -1 || toIdx === -1) { setDragOverKey(null); return; }

    newOrder.splice(fromIdx, 1);
    const insertAt = dragSide === 'left' ? toIdx : toIdx + (fromIdx < toIdx ? 0 : 1);
    newOrder.splice(Math.min(insertAt, newOrder.length), 0, srcKey);

    dispatch({ type: 'SET_COLUMN_ORDER', payload: newOrder });
    onColumnReorder?.(newOrder);
    draggingKey.current = null;
    setDragOverKey(null);
  }, [enabled, columnOrder, dragSide, dispatch, onColumnReorder]);

  const onDragEnd = useCallback(() => {
    draggingKey.current = null;
    setDragOverKey(null);
  }, []);

  return { onDragStart, onDragOver, onDrop, onDragEnd, dragOverKey, dragSide };
}

// ═══════════════════════════════════════════════
// SVG Icons
// ═══════════════════════════════════════════════

const SortIcon = ({ dir }: { dir?: SortDir | null }) => (
  <span className="lxs-datagrid__sort-icon" aria-hidden="true">
    {dir === 'asc' ? (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 2L10 8H2L6 2Z" fill="currentColor" />
      </svg>
    ) : dir === 'desc' ? (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 10L2 4H10L6 10Z" fill="currentColor" />
      </svg>
    ) : (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" opacity="0.35">
        <path d="M6 2L9 6H3L6 2Z" fill="currentColor" />
        <path d="M6 10L3 6H9L6 10Z" fill="currentColor" />
      </svg>
    )}
  </span>
);

const FilterIcon = ({ active }: { active: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M1.5 2.5H10.5L7 6.5V9.5L5 10.5V6.5L1.5 2.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? 'currentColor' : 'none'}
    />
  </svg>
);

const ExpandIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
    style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease' }}
  >
    <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckboxIcon = ({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) => (
  <span
    className={[
      'lxs-datagrid__checkbox',
      checked && 'lxs-datagrid__checkbox--checked',
      indeterminate && 'lxs-datagrid__checkbox--indeterminate',
    ].filter(Boolean).join(' ')}
    aria-hidden="true"
  >
    {(checked || indeterminate) && (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        {indeterminate
          ? <path d="M2 5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          : <path d="M1.5 5L4 7.5L8.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        }
      </svg>
    )}
  </span>
);

// ═══════════════════════════════════════════════
// Toolbar
// ═══════════════════════════════════════════════

interface ToolbarProps<T> {
  columns: ColDef<T>[];
  hiddenColumns: Set<string>;
  density: GridDensity;
  globalFilter: string;
  showExport: boolean;
  toolbarContent?: React.ReactNode;
  onGlobalFilter: (v: string) => void;
  onToggleColumn: (key: string) => void;
  onDensityChange: (d: GridDensity) => void;
  onExport: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

function DataGridToolbar<T>({
  columns,
  hiddenColumns,
  density,
  globalFilter,
  showExport,
  toolbarContent,
  onGlobalFilter,
  onToggleColumn,
  onDensityChange,
  onExport,
  onResetFilters,
  hasActiveFilters,
}: ToolbarProps<T>) {
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [densityMenuOpen, setDensityMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const densityMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false);
      if (densityMenuRef.current && !densityMenuRef.current.contains(e.target as Node)) setDensityMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMenuKeyDown = (e: React.KeyboardEvent, close: () => void) => {
    if (e.key === 'Escape') close();
  };

  return (
    <div className="lxs-datagrid__toolbar" role="toolbar" aria-label="Grid toolbar">
      <div className="lxs-datagrid__toolbar-left">
        {/* Global search */}
        <div className="lxs-datagrid__search">
          <span className="lxs-datagrid__search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            ref={searchRef}
            type="search"
            className="lxs-datagrid__search-input"
            placeholder="Search all columns…"
            value={globalFilter}
            onChange={(e) => onGlobalFilter(e.target.value)}
            aria-label="Search all columns"
            autoComplete="off"
          />
          {globalFilter && (
            <button
              className="lxs-datagrid__search-clear"
              onClick={() => { onGlobalFilter(''); searchRef.current?.focus(); }}
              aria-label="Clear search"
              type="button"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M8 2L2 8M2 2L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            className="lxs-datagrid__toolbar-btn lxs-datagrid__toolbar-btn--ghost"
            onClick={onResetFilters}
            type="button"
            aria-label="Clear all active filters"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M10 2L2 10M2 2L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Clear filters
          </button>
        )}
      </div>

      <div className="lxs-datagrid__toolbar-right">
        {toolbarContent}

        {/* Density picker */}
        <div className="lxs-datagrid__toolbar-menu" ref={densityMenuRef} onKeyDown={(e) => handleMenuKeyDown(e, () => setDensityMenuOpen(false))}>
          <button
            className="lxs-datagrid__toolbar-btn"
            onClick={() => setDensityMenuOpen((v) => !v)}
            aria-expanded={densityMenuOpen}
            aria-haspopup="menu"
            aria-label="Row density"
            title="Row density"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 3H13M1 7H13M1 11H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {densityMenuOpen && (
            <div className="lxs-datagrid__dropdown" role="menu" aria-label="Row density options">
              <div className="lxs-datagrid__dropdown-header">Row density</div>
              {(['compact', 'standard', 'comfortable'] as GridDensity[]).map((d) => (
                <button
                  key={d}
                  role="menuitemradio"
                  aria-checked={density === d}
                  className={`lxs-datagrid__dropdown-item${density === d ? ' lxs-datagrid__dropdown-item--active' : ''}`}
                  onClick={() => { onDensityChange(d); setDensityMenuOpen(false); }}
                  type="button"
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                  {density === d && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }} aria-hidden="true">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Column visibility */}
        <div className="lxs-datagrid__toolbar-menu" ref={colMenuRef} onKeyDown={(e) => handleMenuKeyDown(e, () => setColMenuOpen(false))}>
          <button
            className="lxs-datagrid__toolbar-btn"
            onClick={() => setColMenuOpen((v) => !v)}
            aria-expanded={colMenuOpen}
            aria-haspopup="menu"
            aria-label="Manage columns"
            title="Columns"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="8" y="1" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          {colMenuOpen && (
            <div className="lxs-datagrid__dropdown lxs-datagrid__dropdown--wide" role="menu" aria-label="Column visibility">
              <div className="lxs-datagrid__dropdown-header">Columns</div>
              {columns.map((col) => {
                const isVisible = !hiddenColumns.has(col.key);
                const label = String(col.header ?? col.key);
                return (
                  <label
                    key={col.key}
                    className="lxs-datagrid__dropdown-item lxs-datagrid__dropdown-item--check"
                    role="menuitemcheckbox"
                    aria-checked={isVisible}
                  >
                    <CheckboxIcon checked={isVisible} />
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      className="lxs-sr-only"
                      checked={isVisible}
                      onChange={() => onToggleColumn(col.key)}
                      aria-label={`Toggle ${label} column`}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Export CSV */}
        {showExport && (
          <button
            className="lxs-datagrid__toolbar-btn"
            onClick={onExport}
            aria-label="Export to CSV"
            title="Export CSV"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1V9M7 9L4 6M7 9L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 10V12C1 12.55 1.45 13 2 13H12C12.55 13 13 12.55 13 12V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Filter Popover
// ═══════════════════════════════════════════════

interface FilterPopoverProps {
  colLabel: string;
  colKey: string;
  isActive: boolean;
  filterValue: ColumnFilterEntry;
  colType?: ColDef['type'];
  open: boolean;
  onClose: () => void;
  onChange: (entry: ColumnFilterEntry) => void;
}

const FILTER_OPS_TEXT: { value: FilterOp; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'empty', label: 'Is empty' },
  { value: 'notEmpty', label: 'Is not empty' },
];

const FILTER_OPS_NUMBER: { value: FilterOp; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less or equal' },
  { value: 'between', label: 'Between' },
  { value: 'empty', label: 'Is empty' },
  { value: 'notEmpty', label: 'Is not empty' },
];

function FilterPopover({
  colLabel, colKey, isActive, filterValue, colType, open, onClose, onChange,
}: FilterPopoverProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const firstInput = useRef<HTMLSelectElement>(null);

  const ops = colType === 'number' ? FILTER_OPS_NUMBER : FILTER_OPS_TEXT;
  const needsValue = filterValue.op !== 'empty' && filterValue.op !== 'notEmpty';
  const needsValue2 = filterValue.op === 'between';

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Close on Escape; focus first control on open
  useEffect(() => {
    if (!open) return;
    firstInput.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={wrapRef}
      className="lxs-datagrid__filter-popover"
      role="dialog"
      aria-modal="true"
      aria-label={`Filter ${colLabel}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="lxs-datagrid__filter-popover-header">
        <span>Filter: {colLabel}</span>
        {isActive && (
          <button
            className="lxs-datagrid__filter-clear-btn"
            onClick={() => { onChange({ op: 'contains', value: '', value2: '' }); onClose(); }}
            type="button"
            aria-label={`Clear filter for ${colLabel}`}
          >
            Clear
          </button>
        )}
      </div>

      {/* Body */}
      <div className="lxs-datagrid__filter-popover-body">
        <label className="lxs-datagrid__filter-label" htmlFor={`lxs-filter-op-${colKey}`}>
          Condition
        </label>
        <select
          id={`lxs-filter-op-${colKey}`}
          ref={firstInput}
          className="lxs-datagrid__filter-select"
          value={filterValue.op}
          onChange={(e) => onChange({ ...filterValue, op: e.target.value as FilterOp })}
          aria-label={`Filter type for ${colLabel}`}
        >
          {ops.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {needsValue && (
          <>
            <label className="lxs-datagrid__filter-label" htmlFor={`lxs-filter-val-${colKey}`}>
              {needsValue2 ? 'From' : 'Value'}
            </label>
            <input
              id={`lxs-filter-val-${colKey}`}
              type={colType === 'number' ? 'number' : colType === 'date' ? 'date' : 'text'}
              className="lxs-datagrid__filter-input"
              placeholder={needsValue2 ? 'From…' : 'Enter value…'}
              value={filterValue.value}
              onChange={(e) => onChange({ ...filterValue, value: e.target.value })}
              aria-label={`Filter value for ${colLabel}`}
              autoFocus={!needsValue2}
            />
          </>
        )}

        {needsValue2 && (
          <>
            <label className="lxs-datagrid__filter-label" htmlFor={`lxs-filter-val2-${colKey}`}>
              To
            </label>
            <input
              id={`lxs-filter-val2-${colKey}`}
              type="number"
              className="lxs-datagrid__filter-input"
              placeholder="To…"
              value={filterValue.value2 ?? ''}
              onChange={(e) => onChange({ ...filterValue, value2: e.target.value })}
              aria-label={`Filter upper bound for ${colLabel}`}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="lxs-datagrid__filter-popover-footer">
        <button
          className="lxs-datagrid__filter-apply-btn"
          onClick={onClose}
          type="button"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Header Cell
// ═══════════════════════════════════════════════

interface HeaderCellProps<T> {
  col: ColDef<T>;
  width: number;
  sortDir: SortDir | null;
  sortPriority: number;
  multiSort: boolean;
  showFilter: boolean;
  filterValue: ColumnFilterEntry;
  colIndex: number;
  onSort: () => void;
  onFilter: (entry: ColumnFilterEntry) => void;
  onResizeStart: (e: React.MouseEvent, key: string, width: number) => void;
  isPinnedLeft: boolean;
  isPinnedRight: boolean;
  pinnedLeftOffset: number;
  pinnedRightOffset: number;
  isLastLeft: boolean;
  isLastRight: boolean;
  // drag reorder
  draggable: boolean;
  isDragOver: boolean;
  dragOverSide: 'left' | 'right';
  onDragStart: (e: React.DragEvent, key: string) => void;
  onDragOver: (e: React.DragEvent, key: string) => void;
  onDrop: (e: React.DragEvent, key: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

function HeaderCell<T>({
  col, width, sortDir, sortPriority, multiSort, showFilter, filterValue, colIndex,
  onSort, onFilter, onResizeStart,
  isPinnedLeft, isPinnedRight, pinnedLeftOffset, pinnedRightOffset, isLastLeft, isLastRight,
  draggable, isDragOver, dragOverSide, onDragStart, onDragOver, onDrop, onDragEnd,
}: HeaderCellProps<T>) {
  const [filterOpen, setFilterOpen] = useState(false);

  const isFilterActive = (
    filterValue.op === 'empty' ||
    filterValue.op === 'notEmpty' ||
    filterValue.value.trim() !== ''
  );

  const handleFilterChange = useCallback((entry: ColumnFilterEntry) => onFilter(entry), [onFilter]);
  const closeFilter = useCallback(() => setFilterOpen(false), []);

  const cls = [
    'lxs-datagrid__header-cell',
    col.sortable !== false && 'lxs-datagrid__header-cell--sortable',
    sortDir && 'lxs-datagrid__header-cell--sorted',
    isPinnedLeft && 'lxs-datagrid__cell--pinned-left',
    isPinnedRight && 'lxs-datagrid__cell--pinned-right',
    isLastLeft && 'lxs-datagrid__cell--pinned-left-last',
    isLastRight && 'lxs-datagrid__cell--pinned-right-last',
    isDragOver && dragOverSide === 'left' && 'lxs-datagrid__header-cell--drag-over-left',
    isDragOver && dragOverSide === 'right' && 'lxs-datagrid__header-cell--drag-over-right',
  ].filter(Boolean).join(' ');

  const align = col.headerAlign ?? col.align ?? 'left';

  const cellStyle: React.CSSProperties = {
    width,
    minWidth: col.minWidth ?? width,
    textAlign: align,
    ...(isPinnedLeft ? { left: pinnedLeftOffset, position: 'sticky', zIndex: 2 } : {}),
    ...(isPinnedRight ? { right: pinnedRightOffset, position: 'sticky', zIndex: 2 } : {}),
  };

  return (
    <div
      className={cls}
      style={cellStyle}
      role="columnheader"
      aria-sort={sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'}
      aria-colindex={colIndex + 1}
      draggable={draggable}
      onDragStart={(e) => draggable && onDragStart(e, col.key)}
      onDragOver={(e) => draggable && onDragOver(e, col.key)}
      onDrop={(e) => draggable && onDrop(e, col.key)}
      onDragEnd={onDragEnd}
      title={col.headerTooltip}
    >
      <div className="lxs-datagrid__header-cell-inner">
        {/* Sort trigger */}
        <div
          className="lxs-datagrid__header-cell-content"
          onClick={col.sortable !== false ? onSort : undefined}
          role={col.sortable !== false ? 'button' : undefined}
          tabIndex={col.sortable !== false ? 0 : undefined}
          onKeyDown={col.sortable !== false
            ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(); } }
            : undefined
          }
          aria-label={
            col.sortable !== false
              ? `${String(col.header ?? col.key)}${sortDir ? `, sorted ${sortDir}ending` : ', not sorted. Click to sort'}`
              : undefined
          }
        >
          {col.headerRenderer
            ? col.headerRenderer({ col, sortDir })
            : <span className="lxs-datagrid__header-cell-label">{col.header ?? col.key}</span>
          }
          {col.sortable !== false && (
            <>
              <SortIcon dir={sortDir} />
              {multiSort && sortPriority >= 0 && (
                <span className="lxs-datagrid__sort-badge" aria-label={`Sort priority ${sortPriority + 1}`}>
                  {sortPriority + 1}
                </span>
              )}
            </>
          )}
        </div>

        {/* Filter button + popover */}
        {showFilter && (
          <div className="lxs-datagrid__filter-wrapper">
            <button
              className={`lxs-datagrid__filter-btn${isFilterActive ? ' lxs-datagrid__filter-btn--active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setFilterOpen((v) => !v); }}
              aria-label={`Filter ${String(col.header ?? col.key)}${isFilterActive ? ' (active)' : ''}`}
              aria-expanded={filterOpen}
              aria-haspopup="dialog"
              type="button"
              title="Column filter"
            >
              <FilterIcon active={isFilterActive} />
            </button>
            <FilterPopover
              colLabel={String(col.header ?? col.key)}
              colKey={col.key}
              isActive={isFilterActive}
              filterValue={filterValue}
              colType={col.type}
              open={filterOpen}
              onClose={closeFilter}
              onChange={handleFilterChange}
            />
          </div>
        )}
      </div>

      {/* Resize handle */}
      {col.resizable !== false && (
        <div
          className="lxs-datagrid__resize-handle"
          onMouseDown={(e) => onResizeStart(e, col.key, width)}
          role="separator"
          aria-label={`Resize ${String(col.header ?? col.key)} column`}
          aria-orientation="vertical"
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Body Cell
// ═══════════════════════════════════════════════

interface BodyCellProps<T> {
  col: ColDef<T>;
  row: GridRow<T>;
  rowIndex: number;
  width: number;
  colIndex: number;
  isSelected: boolean;
  isEditing: boolean;
  editingValue: unknown;
  isFocused: boolean;
  isPinnedLeft: boolean;
  isPinnedRight: boolean;
  pinnedLeftOffset: number;
  pinnedRightOffset: number;
  isLastLeft: boolean;
  isLastRight: boolean;
  navRowIndex: number;
  navColIndex: number;
  onCellClick?: (value: unknown, row: GridRow<T>, col: ColDef<T>, e: React.MouseEvent) => void;
  onStartEdit: (rowId: string | number, colKey: string, value: unknown) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (v: unknown) => void;
  onFocus: () => void;
}

function BodyCell<T>({
  col, row, rowIndex, width, colIndex, isSelected, isEditing, editingValue,
  isFocused, isPinnedLeft, isPinnedRight, pinnedLeftOffset, pinnedRightOffset,
  isLastLeft, isLastRight, navRowIndex, navColIndex,
  onCellClick, onStartEdit, onCommitEdit, onCancelEdit, onEditValueChange, onFocus,
}: BodyCellProps<T>) {
  const value = getCellValue(row, col, rowIndex);

  const cls = [
    'lxs-datagrid__cell',
    isEditing && 'lxs-datagrid__cell--editing',
    isFocused && 'lxs-datagrid__cell--focused',
    isPinnedLeft && 'lxs-datagrid__cell--pinned-left',
    isPinnedRight && 'lxs-datagrid__cell--pinned-right',
    isLastLeft && 'lxs-datagrid__cell--pinned-left-last',
    isLastRight && 'lxs-datagrid__cell--pinned-right-last',
    col.align === 'center' && 'lxs-datagrid__cell--center',
    col.align === 'right' && 'lxs-datagrid__cell--right',
  ].filter(Boolean).join(' ');

  const cellStyle: React.CSSProperties = {
    width,
    minWidth: col.minWidth ?? width,
    ...(isPinnedLeft ? { left: pinnedLeftOffset, position: 'sticky' } : {}),
    ...(isPinnedRight ? { right: pinnedRightOffset, position: 'sticky' } : {}),
  };

  const handleDoubleClick = () => {
    if (col.editable) onStartEdit(row.__id, col.key, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing) {
      if (e.key === 'F2' || e.key === 'Enter') {
        if (col.editable) { e.preventDefault(); onStartEdit(row.__id, col.key, value); }
      }
      return;
    }
    if (e.key === 'Enter') { e.preventDefault(); onCommitEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); onCancelEdit(); }
  };

  return (
    <div
      className={cls}
      style={cellStyle}
      role="gridcell"
      aria-colindex={colIndex + 1}
      aria-selected={isSelected}
      aria-readonly={!col.editable || undefined}
      tabIndex={isFocused ? 0 : -1}
      data-cell-row={navRowIndex}
      data-cell-col={navColIndex}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onClick={onCellClick ? (e) => onCellClick(value, row, col, e) : undefined}
    >
      {isEditing ? (
        <input
          className="lxs-datagrid__cell-editor"
          value={String(editingValue ?? '')}
          autoFocus
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={() => onCommitEdit()}
          onKeyDown={handleKeyDown}
          aria-label={`Edit ${String(col.header ?? col.key)}`}
        />
      ) : col.cellRenderer ? (
        col.cellRenderer({ value, row, rowIndex, col, isSelected, isEditing: false })
      ) : (
        <span className="lxs-datagrid__cell-text">{formatCellValue(value, col.type)}</span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Group Row
// ═══════════════════════════════════════════════

interface GroupRowProps {
  groupValue: string;
  rowCount: number;
  isCollapsed: boolean;
  colCount: number;
  totalWidth: number;
  height: number;
  onToggle: () => void;
}

function GroupRow({ groupValue, rowCount, isCollapsed, colCount, totalWidth, height, onToggle }: GroupRowProps) {
  return (
    <div
      className={`lxs-datagrid__group-row${isCollapsed ? ' lxs-datagrid__group-row--collapsed' : ''}`}
      role="row"
      aria-expanded={!isCollapsed}
      aria-rowspan={isCollapsed ? 1 : rowCount + 1}
      style={{ height, width: totalWidth || '100%' }}
    >
      <button
        className="lxs-datagrid__group-toggle"
        onClick={onToggle}
        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} group: ${groupValue}`}
        type="button"
      >
        <ExpandIcon expanded={!isCollapsed} />
      </button>
      <span className="lxs-datagrid__group-label">{groupValue}</span>
      <span className="lxs-datagrid__group-count" aria-label={`${rowCount} rows`}>{rowCount}</span>
      <span className="lxs-sr-only"> rows in group</span>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Pagination
// ═══════════════════════════════════════════════

interface PaginationProps {
  page: number;
  pageSize: number;
  totalRows: number;
  pageSizeOptions: number[];
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

function Pagination({ page, pageSize, totalRows, pageSizeOptions, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const start = totalRows === 0 ? 0 : Math.min(page * pageSize + 1, totalRows);
  const end = Math.min((page + 1) * pageSize, totalRows);

  const pageNumbers = useMemo<(number | '...')[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const items: (number | '...')[] = [0];
    if (page > 2) items.push('...');
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) items.push(i);
    if (page < totalPages - 3) items.push('...');
    items.push(totalPages - 1);
    return items;
  }, [page, totalPages]);

  const instanceId = useRef(`lxs-pgsize-${Math.random().toString(36).slice(2)}`).current;

  return (
    <nav className="lxs-datagrid__pagination" aria-label="Table pagination">
      {/* Row count info */}
      <div className="lxs-datagrid__pagination-info" aria-live="polite" aria-atomic="true">
        {totalRows === 0 ? 'No rows' : `${start}–${end} of ${totalRows}`}
      </div>

      {/* Page buttons */}
      <div className="lxs-datagrid__pagination-controls" role="group" aria-label="Page navigation">
        <button
          className="lxs-datagrid__pagination-btn"
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          aria-label="First page"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M9 2L5 6L9 10M3 2V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="lxs-datagrid__pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`ell-${i}`} className="lxs-datagrid__pagination-ellipsis" aria-hidden="true">…</span>
          ) : (
            <button
              key={p}
              className={`lxs-datagrid__pagination-btn${page === p ? ' lxs-datagrid__pagination-btn--active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p + 1}`}
              aria-current={page === p ? 'page' : undefined}
              type="button"
            >
              {p + 1}
            </button>
          )
        )}

        <button
          className="lxs-datagrid__pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Next page"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="lxs-datagrid__pagination-btn"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          aria-label="Last page"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 2L7 6L3 10M9 2V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Page size selector */}
      <div className="lxs-datagrid__pagination-size">
        <label className="lxs-datagrid__pagination-size-label" htmlFor={instanceId}>
          Rows per page
        </label>
        <select
          id={instanceId}
          className="lxs-datagrid__pagination-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {pageSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════
// Main DataGrid Component
// ═══════════════════════════════════════════════

function DataGridComponent<T extends Record<string, unknown>>(
  props: DataGridProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    rows: rawRows,
    columns: rawColumns,
    getRowId,

    sorting = true,
    multiSort = false,
    filtering = true,
    showColumnFilters = false,
    selection = 'checkbox',
    pagination = true,
    columnResize = true,
    columnReorder = false,
    rowExpansion = false,
    showAggregation = false,
    grouped = false,
    groupByKey,
    keyboardNavigation = true,

    density: densityProp,
    striped = false,
    bordered = true,
    stickyHeader = true,
    showToolbar = true,
    showFooter = true,
    height = 480,
    maxHeight,
    pageSizeOptions = [10, 25, 50, 100],
    exportCsv = true,
    exportFileName = 'export',
    toolbarContent,
    footerContent,
    expandedRowContent,
    emptyContent,
    loadingContent,
    loading = false,
    totalRows: serverTotalRows,
    virtualized = true,
    overscan = 5,
    rowHeight: rowHeightProp,
    serverSideSort = false,
    serverSideFilter = false,

    // controlled
    sortModel: controlledSort,
    filterModel: controlledFilter,
    selectedRowIds: controlledSelected,
    page: controlledPage,
    pageSize: controlledPageSize,
    expandedRowIds: controlledExpanded,

    // callbacks
    onSortChange,
    onFilterChange,
    onSelectionChange,
    onPageChange,
    onPageSizeChange,
    onRowExpand,
    onRowClick,
    onCellClick,
    onEditCommit,
    onColumnReorder,

    className,
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
  } = props;

  // ── Initial state ───────────────────────────────────────────────────────────
  const initialState: GridState = useMemo(() => ({
    sortModel: controlledSort ?? [],
    globalFilter: '',
    selectedIds: new Set(controlledSelected ?? []),
    page: controlledPage ?? 0,
    pageSize: controlledPageSize ?? pageSizeOptions[0] ?? 25,
    expandedRowIds: new Set(controlledExpanded ?? []),
    collapsedGroups: new Set(),
    columnWidths: Object.fromEntries(rawColumns.map((c) => [c.key, c.width ?? DEFAULT_COL_WIDTH])),
    hiddenColumns: new Set(rawColumns.filter((c) => c.hidden).map((c) => c.key)),
    columnOrder: rawColumns.map((c) => c.key),
    density: densityProp ?? 'standard',
    editingCell: null,
    editingValue: null,
    columnFilters: {} as Record<string, ColumnFilterEntry>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []); // intentionally only on mount

  const [state, dispatch] = useReducer(gridReducer, initialState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Focused cell for keyboard navigation
  const [focusedCell, setFocusedCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);
  // Last clicked row index (for shift-click range selection)
  const lastClickedIdx = useRef<number>(-1);
  // Announce text for screen readers
  const [announcement, setAnnouncement] = useState('');

  // ── Container width (for flex column distribution) ─────────────────────────
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Sync controlled props ──────────────────────────────────────────────────
  useEffect(() => { if (controlledSort) dispatch({ type: 'SET_SORT', payload: controlledSort }); }, [controlledSort]);
  useEffect(() => { if (densityProp) dispatch({ type: 'SET_DENSITY', payload: densityProp }); }, [densityProp]);
  useEffect(() => { if (controlledPage !== undefined) dispatch({ type: 'SET_PAGE', payload: controlledPage }); }, [controlledPage]);
  useEffect(() => { if (controlledPageSize !== undefined) dispatch({ type: 'SET_PAGE_SIZE', payload: controlledPageSize }); }, [controlledPageSize]);

  // Sync controlled filterModel into columnFilters
  useEffect(() => {
    if (!controlledFilter) return;
    controlledFilter.forEach((f) => {
      dispatch({
        type: 'SET_COLUMN_FILTER',
        payload: { key: f.key, op: f.op, value: f.value, value2: f.value2 ?? '' },
      });
    });
  }, [controlledFilter]);

  // ── Effective columns (ordered + visible) ──────────────────────────────────
  const columns = useMemo<ColDef<T>[]>(() => {
    const ordered = state.columnOrder
      .map((key) => rawColumns.find((c) => c.key === key))
      .filter(Boolean) as ColDef<T>[];
    const newCols = rawColumns.filter((c) => !state.columnOrder.includes(c.key));
    return [...ordered, ...newCols].filter((c) => !state.hiddenColumns.has(c.key));
  }, [rawColumns, state.columnOrder, state.hiddenColumns]);

  // ── Row sizing ─────────────────────────────────────────────────────────────
  const rowHeight = rowHeightProp ?? ROW_HEIGHTS[state.density];
  const headerHeight = HEADER_HEIGHTS[state.density];

  // ── Process rows ───────────────────────────────────────────────────────────
  const processedRows = useMemo<GridRow<T>[]>(() => {
    let result = rawRows.map((row, i) => ({
      ...row,
      __id: getRowId ? getRowId(row, i) : ((row as Record<string, unknown>).id ?? (row as Record<string, unknown>).key ?? i) as string | number,
    })) as GridRow<T>[];

    if (filtering && !serverSideFilter) {
      if (state.globalFilter) result = applyGlobalFilter(result, columns, state.globalFilter) as GridRow<T>[];
      result = applyColumnFilters(result, columns, state.columnFilters) as GridRow<T>[];
    }

    if (sorting && !serverSideSort) result = applySort(result, columns, state.sortModel) as GridRow<T>[];
    return result;
  }, [rawRows, columns, state.globalFilter, state.columnFilters, state.sortModel, filtering, sorting, serverSideFilter, serverSideSort, getRowId]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalRows = serverTotalRows ?? processedRows.length;

  const pagedRows = useMemo<GridRow<T>[]>(() => {
    if (!pagination || serverTotalRows !== undefined) return processedRows;
    return processedRows.slice(state.page * state.pageSize, (state.page + 1) * state.pageSize);
  }, [processedRows, pagination, state.page, state.pageSize, serverTotalRows]);

  // ── Grouped items (flat list) ──────────────────────────────────────────────
  const flatItems = useMemo<FlatItem<T>[]>(() => {
    if (!grouped || !groupByKey) return pagedRows.map((row, i) => ({ kind: 'row', row, absoluteIndex: i }));
    return buildFlatItems(pagedRows, groupByKey, state.collapsedGroups);
  }, [grouped, groupByKey, pagedRows, state.collapsedGroups]);

  // ── Virtualization ─────────────────────────────────────────────────────────
  const { startIndex, endIndex, totalHeight, offsetTop } = useVirtualScroll({
    totalCount: flatItems.length,
    rowHeight,
    overscan,
    containerRef: scrollRef,
    enabled: virtualized,
    headerOffset: headerHeight,
  });

  const visibleItems = virtualized ? flatItems.slice(startIndex, endIndex + 1) : flatItems;

  // ── Column layout ──────────────────────────────────────────────────────────
  const pinnedLeft = columns.filter((c) => c.pinned === 'left');
  const pinnedRight = columns.filter((c) => c.pinned === 'right');
  const lastPinnedLeftKey = pinnedLeft.at(-1)?.key ?? null;
  const lastPinnedRightKey = pinnedRight[0]?.key ?? null;

  const sysOffset = (selection === 'checkbox' ? CHECKBOX_COL_WIDTH : 0)
    + (rowExpansion ? EXPAND_COL_WIDTH : 0);

  // ── Resolve flex columns ───────────────────────────────────────────────────
  const colWidths = useMemo(() => {
    const widths = { ...state.columnWidths };
    const flexCols = columns.filter((c) => c.flex !== undefined && c.flex > 0);
    if (flexCols.length === 0 || containerWidth <= 0) return widths;

    const fixedWidth = sysOffset + columns
      .filter((c) => !c.flex || c.flex <= 0)
      .reduce((sum, c) => sum + (widths[c.key] ?? DEFAULT_COL_WIDTH), 0);

    const remainingWidth = containerWidth - fixedWidth;
    if (remainingWidth <= 0) return widths;

    const totalFlex = flexCols.reduce((sum, c) => sum + (c.flex ?? 0), 0);
    flexCols.forEach((c) => {
      widths[c.key] = Math.max(
        c.minWidth ?? 50,
        Math.floor((c.flex! / totalFlex) * remainingWidth)
      );
    });

    return widths;
  }, [state.columnWidths, columns, containerWidth, sysOffset]);

  const pinnedLeftOffsets = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    let acc = sysOffset;
    pinnedLeft.forEach((c) => { map[c.key] = acc; acc += (colWidths[c.key] ?? DEFAULT_COL_WIDTH); });
    return map;
  }, [pinnedLeft, colWidths, sysOffset]);

  const pinnedRightOffsets = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    let acc = 0;
    [...pinnedRight].reverse().forEach((c) => { map[c.key] = acc; acc += (colWidths[c.key] ?? DEFAULT_COL_WIDTH); });
    return map;
  }, [pinnedRight, colWidths]);

  // ── Total scrollable width ─────────────────────────────────────────────────
  const totalWidth = useMemo(() =>
    sysOffset + columns.reduce((sum, c) => sum + (colWidths[c.key] ?? DEFAULT_COL_WIDTH), 0),
    [sysOffset, columns, colWidths]
  );

  // ── Selection helpers ──────────────────────────────────────────────────────
  const allPageIds = pagedRows.map((r) => r.__id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => state.selectedIds.has(id));
  const someSelected = allPageIds.some((id) => state.selectedIds.has(id)) && !allSelected;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      dispatch({ type: 'DESELECT_ALL' });
      onSelectionChange?.([], []);
      setAnnouncement('All rows deselected');
    } else {
      dispatch({ type: 'SELECT_ALL', payload: { ids: allPageIds } });
      onSelectionChange?.(allPageIds, pagedRows);
      setAnnouncement(`${allPageIds.length} rows selected`);
    }
  }, [allSelected, allPageIds, pagedRows, onSelectionChange]);

  const handleRowSelect = useCallback(
    (row: GridRow<T>, rowIdx: number, shiftKey: boolean) => {
      if (!selection) return;
      const mode = selection as SelectionMode;

      if (mode !== 'single' && shiftKey && lastClickedIdx.current !== -1) {
        const lo = Math.min(lastClickedIdx.current, rowIdx);
        const hi = Math.max(lastClickedIdx.current, rowIdx);
        const ids = pagedRows.slice(lo, hi + 1).map((r) => r.__id);
        dispatch({ type: 'SELECT_RANGE', payload: { ids } });
        const allSelectedSet = new Set([...state.selectedIds, ...ids]);
        onSelectionChange?.(
          [...allSelectedSet],
          rawRows.filter((r, i) => allSelectedSet.has((getRowId?.(r, i) ?? (r as Record<string, unknown>).id ?? i) as string | number))
        );
        setAnnouncement(`${ids.length} rows selected`);
        return;
      }

      lastClickedIdx.current = rowIdx;
      dispatch({ type: 'TOGGLE_SELECT', payload: { id: row.__id, mode } });
      const next = new Set(state.selectedIds);
      next.has(row.__id) ? next.delete(row.__id) : next.add(row.__id);
      onSelectionChange?.(
        [...next],
        rawRows.filter((r, i) => next.has((getRowId?.(r, i) ?? (r as Record<string, unknown>).id ?? i) as string | number))
      );
      setAnnouncement(next.has(row.__id) ? 'Row selected' : 'Row deselected');
    },
    [selection, pagedRows, state.selectedIds, rawRows, getRowId, onSelectionChange]
  );

  // ── Column resize ──────────────────────────────────────────────────────────
  const { startResize } = useColumnResize(dispatch, columnResize);

  // ── Column drag reorder ────────────────────────────────────────────────────
  const { onDragStart, onDragOver, onDrop, onDragEnd, dragOverKey, dragSide } =
    useColumnDragReorder(state.columnOrder, dispatch, onColumnReorder, columnReorder);

  // ── Edit helpers ───────────────────────────────────────────────────────────
  const handleStartEdit = useCallback((rowId: string | number, colKey: string, value: unknown) => {
    dispatch({ type: 'START_EDITING', payload: { rowId, colKey, value } });
  }, []);

  const handleCommitEdit = useCallback(() => {
    if (state.editingCell) {
      const { rowId, colKey } = state.editingCell;
      const row = rawRows.find((r, i) => (getRowId?.(r, i) ?? (r as Record<string, unknown>).id ?? i) === rowId);
      const col = columns.find((c) => c.key === colKey);
      if (row && col) onEditCommit?.(row, col, state.editingValue);
    }
    dispatch({ type: 'COMMIT_EDIT' });
  }, [state.editingCell, state.editingValue, rawRows, columns, getRowId, onEditCommit]);

  // ── Sort helper ────────────────────────────────────────────────────────────
  const handleSort = useCallback((colKey: string) => {
    const existing = state.sortModel.find((s) => s.key === colKey);
    let newModel: SortModel[];
    if (!existing) {
      newModel = multiSort
        ? [...state.sortModel, { key: colKey, dir: 'asc', priority: state.sortModel.length }]
        : [{ key: colKey, dir: 'asc', priority: 0 }];
    } else if (existing.dir === 'asc') {
      newModel = state.sortModel.map((s) => s.key === colKey ? { ...s, dir: 'desc' as SortDir } : s);
    } else {
      newModel = state.sortModel.filter((s) => s.key !== colKey);
    }
    dispatch({ type: 'SET_SORT', payload: newModel });
    onSortChange?.(newModel);
  }, [state.sortModel, multiSort, onSortChange]);

  // ── Filter helper ──────────────────────────────────────────────────────────
  const handleColumnFilter = useCallback((key: string, entry: ColumnFilterEntry) => {
    dispatch({ type: 'SET_COLUMN_FILTER', payload: { key, ...entry } });
    if (onFilterChange) {
      const next = { ...state.columnFilters, [key]: entry };
      onFilterChange(
        Object.entries(next)
          .filter(([, f]) => f.op === 'empty' || f.op === 'notEmpty' || f.value.trim())
          .map(([k, f]) => ({ key: k, op: f.op, value: f.value, value2: f.value2 }))
      );
    }
  }, [state.columnFilters, onFilterChange]);

  // ── Scroll & focus when focusedCell changes ────────────────────────────────
  useEffect(() => {
    if (!focusedCell || !keyboardNavigation) return;

    // Scroll the row into view in the virtual container
    if (virtualized && scrollRef.current) {
      const targetTop = focusedCell.rowIdx * rowHeight;
      const container = scrollRef.current;
      const visibleTop = container.scrollTop;
      const visibleBottom = container.scrollTop + container.clientHeight - headerHeight;

      if (targetTop < visibleTop) {
        container.scrollTop = targetTop;
      } else if (targetTop + rowHeight > visibleBottom) {
        container.scrollTop = targetTop + rowHeight - container.clientHeight + headerHeight;
      }
    }

    // After virtual scroll re-renders, try to focus the DOM cell
    const raf = requestAnimationFrame(() => {
      const cell = scrollRef.current?.querySelector<HTMLElement>(
        `[data-cell-row="${focusedCell.rowIdx}"][data-cell-col="${focusedCell.colIdx}"]`
      );
      if (cell && !cell.contains(document.activeElement)) {
        cell.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [focusedCell, keyboardNavigation, virtualized, rowHeight, headerHeight]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!keyboardNavigation) return;

    // Ctrl+C — copy selected rows
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && state.selectedIds.size > 0) {
      const selected = pagedRows.filter((r) => state.selectedIds.has(r.__id));
      copyRowsToClipboard(selected, columns);
      setAnnouncement(`${selected.length} rows copied to clipboard`);
      return;
    }

    // Arrow key navigation between cells
    if (!focusedCell) return;
    const { rowIdx, colIdx } = focusedCell;
    const totalDataRows = pagedRows.length;
    const totalCols = columns.length;

    const move = (dr: number, dc: number) => {
      e.preventDefault();
      const newRow = Math.max(0, Math.min(totalDataRows - 1, rowIdx + dr));
      const newCol = Math.max(0, Math.min(totalCols - 1, colIdx + dc));
      setFocusedCell({ rowIdx: newRow, colIdx: newCol });
    };

    switch (e.key) {
      case 'ArrowUp': move(-1, 0); break;
      case 'ArrowDown': move(+1, 0); break;
      case 'ArrowLeft': move(0, -1); break;
      case 'ArrowRight': move(0, +1); break;
      case 'Home': e.ctrlKey ? move(-rowIdx, -colIdx) : move(0, -colIdx); break;
      case 'End': e.ctrlKey ? move(totalDataRows - 1 - rowIdx, totalCols - 1 - colIdx) : move(0, totalCols - 1 - colIdx); break;
      case 'PageUp': move(-Math.floor(8), 0); break;
      case 'PageDown': move(+Math.floor(8), 0); break;
      case ' ':
        // Toggle selection on focused row
        if (selection && selection === 'checkbox') {
          const row = pagedRows[rowIdx];
          if (row) { e.preventDefault(); handleRowSelect(row, rowIdx, false); }
        }
        break;
    }
  }, [keyboardNavigation, focusedCell, pagedRows, columns, state.selectedIds, selection, handleRowSelect]);

  // ── Clear focus when clicking outside the grid ─────────────────────────────
  useEffect(() => {
    if (!focusedCell) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setFocusedCell(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [focusedCell]);

  // ── Aggregation ────────────────────────────────────────────────────────────
  const aggregationValues = useMemo<Record<string, string>>(() => {
    if (!showAggregation) return {};
    return Object.fromEntries(
      columns.filter((c) => c.aggregate).map((c) => [c.key, computeAggregation(processedRows, c)])
    );
  }, [showAggregation, columns, processedRows]);

  // ── Root class ─────────────────────────────────────────────────────────────
  const hasActiveFilters = !!state.globalFilter || Object.values(state.columnFilters).some(
    (f) => f.op === 'empty' || f.op === 'notEmpty' || f.value.trim() !== ''
  );

  const rootCls = [
    'lxs-datagrid',
    `lxs-datagrid--${state.density}`,
    striped && 'lxs-datagrid--striped',
    bordered && 'lxs-datagrid--bordered',
    loading && 'lxs-datagrid--loading',
    className,
  ].filter(Boolean).join(' ');

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={(node) => {
        (gridRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={rootCls}
      style={{ height, maxHeight, ...style }}
      role="grid"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      aria-rowcount={totalRows}
      aria-colcount={columns.length}
      aria-multiselectable={selection === 'checkbox' || selection === 'multiple' ? true : undefined}
      aria-busy={loading}
      onKeyDown={handleGridKeyDown}
    >
      {/* Screen reader live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="lxs-sr-only">
        {announcement}
      </div>

      {/* ── Toolbar ── */}
      {showToolbar && (
        <DataGridToolbar
          columns={rawColumns}
          hiddenColumns={state.hiddenColumns}
          density={state.density}
          globalFilter={state.globalFilter}
          showExport={exportCsv}
          toolbarContent={toolbarContent}
          onGlobalFilter={(v) => dispatch({ type: 'SET_GLOBAL_FILTER', payload: v })}
          onToggleColumn={(key) => dispatch({ type: 'TOGGLE_COLUMN_VISIBILITY', payload: key })}
          onDensityChange={(d) => dispatch({ type: 'SET_DENSITY', payload: d })}
          onExport={() => exportToCsv(processedRows, columns, exportFileName)}
          onResetFilters={() => dispatch({ type: 'RESET_FILTERS' })}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* ── Single scroll container ── */}
      <div ref={scrollRef} className="lxs-datagrid__scroll-container">
        {/* ── Header ── */}
        <div
          className={`lxs-datagrid__header${stickyHeader ? ' lxs-datagrid__header--sticky' : ''}`}
          role="rowgroup"
          style={{ minWidth: totalWidth }}
        >
          <div
            className="lxs-datagrid__header-row"
            role="row"
            style={{ height: headerHeight }}
          >
            {/* Select-all checkbox */}
            {selection === 'checkbox' && (
              <div
                className="lxs-datagrid__header-cell lxs-datagrid__cell--checkbox lxs-datagrid__cell--sys-pin"
                role="columnheader"
                aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
                style={{ width: CHECKBOX_COL_WIDTH, minWidth: CHECKBOX_COL_WIDTH, position: 'sticky', left: 0, zIndex: 3 }}
              >
                <button
                  className="lxs-datagrid__checkbox-btn"
                  onClick={handleSelectAll}
                  aria-label={allSelected ? 'Deselect all rows' : someSelected ? 'Deselect all rows (partial selection)' : 'Select all rows'}
                  type="button"
                >
                  <CheckboxIcon checked={allSelected} indeterminate={someSelected} />
                </button>
              </div>
            )}

            {/* Row expansion column placeholder */}
            {rowExpansion && (
              <div
                className="lxs-datagrid__header-cell lxs-datagrid__cell--expand lxs-datagrid__cell--sys-pin"
                role="columnheader"
                aria-label="Row expand"
                style={{
                  width: EXPAND_COL_WIDTH,
                  minWidth: EXPAND_COL_WIDTH,
                  position: 'sticky',
                  left: selection === 'checkbox' ? CHECKBOX_COL_WIDTH : 0,
                  zIndex: 3,
                }}
              />
            )}

            {/* Data column headers */}
            {columns.map((col, colIdx) => (
              <HeaderCell
                key={col.key}
                col={col}
                width={colWidths[col.key] ?? DEFAULT_COL_WIDTH}
                sortDir={state.sortModel.find((s) => s.key === col.key)?.dir ?? null}
                sortPriority={state.sortModel.find((s) => s.key === col.key)?.priority ?? -1}
                multiSort={multiSort}
                showFilter={showColumnFilters && col.filterable !== false}
                filterValue={state.columnFilters[col.key] ?? { op: 'contains', value: '', value2: '' }}
                colIndex={colIdx}
                onSort={() => handleSort(col.key)}
                onFilter={(entry) => handleColumnFilter(col.key, entry)}
                onResizeStart={startResize}
                isPinnedLeft={col.pinned === 'left'}
                isPinnedRight={col.pinned === 'right'}
                pinnedLeftOffset={pinnedLeftOffsets[col.key] ?? 0}
                pinnedRightOffset={pinnedRightOffsets[col.key] ?? 0}
                isLastLeft={col.key === lastPinnedLeftKey}
                isLastRight={col.key === lastPinnedRightKey}
                draggable={columnReorder && !col.lockPosition && col.pinned === undefined}
                isDragOver={dragOverKey === col.key}
                dragOverSide={dragSide}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div
          className="lxs-datagrid__body"
          role="rowgroup"
          style={{ position: 'relative', height: virtualized ? totalHeight : undefined, minWidth: totalWidth }}
        >
          {/* Virtual top spacer */}
          {virtualized && offsetTop > 0 && <div style={{ height: offsetTop }} aria-hidden="true" />}

          {/* Empty state */}
          {visibleItems.length === 0 && !loading && (
            <div className="lxs-datagrid__empty" role="row">
              <div className="lxs-datagrid__empty-content" role="gridcell">
                {emptyContent ?? (
                  <>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="lxs-datagrid__empty-icon" aria-hidden="true">
                      <rect x="6" y="12" width="36" height="26" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6 20H42" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M15 12V8M33 12V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M14 30H26M14 36H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                    </svg>
                    <p className="lxs-datagrid__empty-title">No data found</p>
                    {hasActiveFilters && (
                      <p className="lxs-datagrid__empty-sub">Try adjusting your filters or search query.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Data rows */}
          {visibleItems.map((item, relIndex) => {
            const absoluteItemIdx = virtualized ? startIndex + relIndex : relIndex;
            const topOffset = virtualized
              ? absoluteItemIdx * rowHeight
              : undefined;

            // ── Group header row ──
            if (item.kind === 'group') {
              return (
                <div
                  key={`group-${item.groupValue}`}
                  style={virtualized ? { position: 'absolute', top: 0, transform: `translateY(${topOffset}px)`, width: '100%' } : undefined}
                >
                  <GroupRow
                    groupValue={item.groupValue}
                    rowCount={item.rowCount}
                    isCollapsed={item.isCollapsed}
                    colCount={columns.length}
                    totalWidth={totalWidth}
                    height={rowHeight}
                    onToggle={() => dispatch({ type: 'TOGGLE_GROUP', payload: item.groupValue })}
                  />
                </div>
              );
            }

            // ── Data row ──
            const { row, absoluteIndex } = item;
            const rowId = row.__id;
            const isSelected = state.selectedIds.has(rowId);
            const isExpanded = rowExpansion && state.expandedRowIds.has(rowId);

            const rowCls = [
              'lxs-datagrid__row',
              isSelected && 'lxs-datagrid__row--selected',
              isExpanded && 'lxs-datagrid__row--expanded',
              striped && absoluteIndex % 2 === 1 && 'lxs-datagrid__row--odd',
            ].filter(Boolean).join(' ');

            return (
              <React.Fragment key={rowId}>
                <div
                  className={rowCls}
                  role="row"
                  aria-rowindex={absoluteIndex + 2} // +2 because header is row 1
                  aria-selected={selection !== false ? isSelected : undefined}
                  style={{
                    height: rowHeight,
                    ...(virtualized ? { position: 'absolute', top: 0, transform: `translateY(${topOffset}px)`, width: '100%' } : {}),
                  }}
                  onClick={(e) => {
                    if (selection && selection !== 'checkbox') handleRowSelect(row, absoluteIndex, e.shiftKey);
                    onRowClick?.(row, absoluteIndex, e);
                  }}
                >
                  {/* Checkbox cell */}
                  {selection === 'checkbox' && (
                    <div
                      className="lxs-datagrid__cell lxs-datagrid__cell--checkbox lxs-datagrid__cell--sys-pin"
                      role="gridcell"
                      style={{ width: CHECKBOX_COL_WIDTH, minWidth: CHECKBOX_COL_WIDTH, position: 'sticky', left: 0, zIndex: 2 }}
                      aria-colindex={1}
                    >
                      <button
                        className="lxs-datagrid__checkbox-btn"
                        onClick={(e) => { e.stopPropagation(); handleRowSelect(row, absoluteIndex, e.shiftKey); }}
                        aria-label={isSelected ? 'Deselect row' : 'Select row'}
                        aria-checked={isSelected}
                        role="checkbox"
                        type="button"
                      >
                        <CheckboxIcon checked={isSelected} />
                      </button>
                    </div>
                  )}

                  {/* Expand cell */}
                  {rowExpansion && (
                    <div
                      className="lxs-datagrid__cell lxs-datagrid__cell--expand lxs-datagrid__cell--sys-pin"
                      role="gridcell"
                      style={{
                        width: EXPAND_COL_WIDTH,
                        minWidth: EXPAND_COL_WIDTH,
                        position: 'sticky',
                        left: selection === 'checkbox' ? CHECKBOX_COL_WIDTH : 0,
                        zIndex: 2,
                      }}
                      aria-colindex={selection === 'checkbox' ? 2 : 1}
                    >
                      <button
                        className="lxs-datagrid__expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: 'TOGGLE_ROW_EXPAND', payload: rowId });
                          onRowExpand?.(rowId, !isExpanded, row);
                        }}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse row details' : 'Expand row details'}
                        type="button"
                      >
                        <ExpandIcon expanded={isExpanded} />
                      </button>
                    </div>
                  )}

                  {/* Data cells */}
                  {columns.map((col, colIdx) => {
                    const isEditingCell = state.editingCell?.rowId === rowId && state.editingCell?.colKey === col.key;
                    const isFocused = focusedCell?.rowIdx === absoluteIndex && focusedCell?.colIdx === colIdx;

                    return (
                      <BodyCell
                        key={col.key}
                        col={col}
                        row={row}
                        rowIndex={absoluteIndex}
                        width={colWidths[col.key] ?? DEFAULT_COL_WIDTH}
                        colIndex={colIdx + (selection === 'checkbox' ? 1 : 0) + (rowExpansion ? 1 : 0)}
                        isSelected={isSelected}
                        isEditing={isEditingCell}
                        editingValue={isEditingCell ? state.editingValue : null}
                        isFocused={isFocused}
                        isPinnedLeft={col.pinned === 'left'}
                        isPinnedRight={col.pinned === 'right'}
                        pinnedLeftOffset={pinnedLeftOffsets[col.key] ?? 0}
                        pinnedRightOffset={pinnedRightOffsets[col.key] ?? 0}
                        isLastLeft={col.key === lastPinnedLeftKey}
                        isLastRight={col.key === lastPinnedRightKey}
                        navRowIndex={absoluteIndex}
                        navColIndex={colIdx}
                        onCellClick={onCellClick}
                        onStartEdit={handleStartEdit}
                        onCommitEdit={handleCommitEdit}
                        onCancelEdit={() => dispatch({ type: 'CANCEL_EDIT' })}
                        onEditValueChange={(v) => dispatch({ type: 'SET_EDITING_VALUE', payload: v })}
                        onFocus={() => setFocusedCell({ rowIdx: absoluteIndex, colIdx })}
                      />
                    );
                  })}
                </div>

                {/* Expanded row detail */}
                {isExpanded && expandedRowContent && (
                  <div
                    className="lxs-datagrid__row-expansion"
                    role="row"
                    aria-label="Row details"
                    style={virtualized ? { position: 'absolute', top: 0, transform: `translateY(${topOffset! + rowHeight}px)`, width: '100%' } : undefined}
                  >
                    <div role="gridcell" aria-colindex={1} aria-colspan={columns.length}>
                      {expandedRowContent(row)}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Aggregation row ── */}
        {showAggregation && Object.keys(aggregationValues).length > 0 && (
          <div
            className="lxs-datagrid__aggregation-row"
            role="row"
            aria-label="Aggregation totals"
            style={{ minWidth: totalWidth }}
          >
            {selection === 'checkbox' && <div style={{ width: CHECKBOX_COL_WIDTH, flex: 'none' }} aria-hidden="true" />}
            {rowExpansion && <div style={{ width: EXPAND_COL_WIDTH, flex: 'none' }} aria-hidden="true" />}
            {columns.map((col, colIdx) => (
              <div
                key={col.key}
                className="lxs-datagrid__aggregation-cell"
                role="gridcell"
                aria-colindex={colIdx + (selection === 'checkbox' ? 2 : 1) + (rowExpansion ? 1 : 0)}
                style={{
                  width: colWidths[col.key] ?? DEFAULT_COL_WIDTH,
                  textAlign: col.align ?? 'left',
                }}
              >
                {aggregationValues[col.key] ?? ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer / Pagination ── */}
      {showFooter && (
        <div className="lxs-datagrid__footer">
          {footerContent}
          {pagination && (
            <Pagination
              page={state.page}
              pageSize={state.pageSize}
              totalRows={totalRows}
              pageSizeOptions={pageSizeOptions}
              onPageChange={(p) => { dispatch({ type: 'SET_PAGE', payload: p }); onPageChange?.(p); }}
              onPageSizeChange={(s) => { dispatch({ type: 'SET_PAGE_SIZE', payload: s }); onPageSizeChange?.(s); }}
            />
          )}
        </div>
      )}

      {/* ── Selection bar ── */}
      {selection !== false && state.selectedIds.size > 0 && (
        <div className="lxs-datagrid__selection-bar" role="status" aria-live="polite">
          <span>
            <strong>{state.selectedIds.size}</strong>&ensp;row{state.selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="lxs-datagrid__selection-bar-actions">
            <button
              className="lxs-datagrid__selection-bar-btn"
              onClick={() => {
                const selected = pagedRows.filter((r) => state.selectedIds.has(r.__id));
                copyRowsToClipboard(selected, columns);
                setAnnouncement(`${selected.length} rows copied`);
              }}
              type="button"
              aria-label="Copy selected rows to clipboard"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
                <path d="M3 9H2C1.45 9 1 8.55 1 8V2C1 1.45 1.45 1 2 1H8C8.55 1 9 1.45 9 2V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Copy
            </button>
            <button
              className="lxs-datagrid__selection-bar-btn lxs-datagrid__selection-bar-btn--clear"
              onClick={() => { dispatch({ type: 'DESELECT_ALL' }); onSelectionChange?.([], []); setAnnouncement('Selection cleared'); }}
              type="button"
              aria-label="Clear row selection"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* ── Loading overlay ── */}
      {loading && (
        <div className="lxs-datagrid__loading-overlay" role="status" aria-label="Loading data">
          {loadingContent ?? (
            <div className="lxs-datagrid__loading-spinner">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="lxs-datagrid__spinner-svg" aria-hidden="true">
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" opacity="0.15" />
                <path d="M16 3C8.82 3 3 8.82 3 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════

const DataGrid = React.forwardRef(DataGridComponent) as <T extends Record<string, unknown>>(
  props: DataGridProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

export { DataGrid };
export default DataGrid;
