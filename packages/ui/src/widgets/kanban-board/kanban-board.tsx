'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type ForwardedRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../../lib/cn';
import { GripVerticalIcon } from '../../lib/icons';
import type { SlotClassNames } from '../../lib/slots';
import { useControllableState } from '../../lib/use-controllable-state';
import { useId } from '../../lib/use-id';
import type { IconTileTone } from '../../components/data-display/icon-tile/icon-tile';

// Written out in full so Tailwind can find every class.
const toneDot: Record<IconTileTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground',
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
  'chart-6': 'bg-chart-6',
  'chart-7': 'bg-chart-7',
  'chart-8': 'bg-chart-8',
};

/** A column of a `KanbanBoard`, e.g. a status. */
export interface KanbanColumn<T> {
  /** Unique, stable id, e.g. `in-review`. */
  id: string;
  /** Heading, e.g. "In review". Also used in announcements. */
  title: string;
  /** The cards, top to bottom. */
  items: T[];
  /** Work-in-progress limit. The count turns red above it; moves are still allowed. */
  limit?: number;
  /** Colour of the dot before the title. */
  tone?: IconTileTone;
}

/** A card move, passed to `canMove` and `onValueChange`. */
export interface KanbanMove {
  itemId: string;
  fromColumnId: string;
  fromIndex: number;
  toColumnId: string;
  toIndex: number;
}

/**
 * Moves a card and returns new columns, leaving the input untouched. Useful for applying a
 * move from `onValueChange` on the server or in an optimistic update.
 */
export function moveKanbanItem<T extends { id: string }>(
  columns: readonly KanbanColumn<T>[],
  itemId: string,
  toColumnId: string,
  toIndex: number,
): KanbanColumn<T>[] {
  let moved: T | undefined;
  const without = columns.map((c) => {
    const i = c.items.findIndex((it) => it.id === itemId);
    if (i === -1) return c;
    moved = c.items[i];
    return { ...c, items: c.items.filter((_, j) => j !== i) };
  });
  if (!moved) return [...columns];
  return without.map((c) => {
    if (c.id !== toColumnId) return c;
    const items = [...c.items];
    items.splice(Math.max(0, Math.min(toIndex, items.length)), 0, moved!);
    return { ...c, items };
  });
}

function locate<T extends { id: string }>(
  columns: readonly KanbanColumn<T>[],
  itemId: string,
) {
  for (let c = 0; c < columns.length; c++) {
    const i = columns[c]!.items.findIndex((it) => it.id === itemId);
    if (i !== -1) return { col: c, index: i };
  }
  return null;
}

export interface KanbanLabels {
  /** Read when a card is focused. @default 'Press Space to pick up. While holding, use arrow keys to move, Space to drop and Escape to cancel.' */
  instructions?: string;
  /** @default (item, column, pos, total) => `Picked up ${item}. In ${column}, position ${pos} of ${total}.` */
  pickedUp?: (
    item: string,
    column: string,
    position: number,
    total: number,
  ) => string;
  /** @default (item, column, pos, total) => `${item} moved to ${column}, position ${pos} of ${total}.` */
  moved?: (
    item: string,
    column: string,
    position: number,
    total: number,
  ) => string;
  /** @default (item, column, pos) => `${item} dropped in ${column}, position ${pos}.` */
  dropped?: (item: string, column: string, position: number) => string;
  /** @default (item) => `Move cancelled. ${item} returned to its place.` */
  cancelled?: (item: string) => string;
  /** @default 'No cards' */
  empty?: ReactNode;
  /** Label for move select placeholder. @default 'Move to…' */
  moveAction?: string;
  /** Accessible label for the move select. @default (item) => `Move ${item}` */
  moveTo?: (item: string) => string;
  /** Label for target column option. @default (column) => `Move to ${column}` */
  moveToColumn?: (column: string) => string;
}

export type KanbanBoardSlot =
  | 'root'
  | 'column'
  | 'columnHeader'
  | 'columnTitle'
  | 'count'
  | 'list'
  | 'card'
  | 'cardMoveSelect'
  | 'empty';

export interface KanbanBoardProps<T extends { id: string }> extends Omit<
  ComponentProps<'div'>,
  'defaultValue' | 'onChange' | 'children'
> {
  /** Accessible name, e.g. "Recruitment pipeline". */
  'aria-label': string;
  /** The columns and their cards (controlled). */
  value?: KanbanColumn<T>[];
  /** The columns and their cards (uncontrolled). */
  defaultValue?: KanbanColumn<T>[];
  /** Called with the new columns and the move after a card is dropped. */
  onValueChange?: (columns: KanbanColumn<T>[], move: KanbanMove) => void;
  /** Renders a card's content. The board provides the card frame, focus and drag handle. */
  renderCard: (item: T) => ReactNode;
  /** Plain-text name of a card, for screen-reader announcements. */
  getItemLabel: (item: T) => string;
  /** Return `false` to forbid a move, e.g. skipping a required stage. */
  canMove?: (move: KanbanMove) => boolean;
  /** Extra content in each column header, e.g. an "Add" button. */
  columnActions?: (column: KanbanColumn<T>) => ReactNode;
  /** Called when a card is activated with Enter or a click, e.g. to open its details. */
  onCardOpen?: (item: T) => void;
  /** Texts, for translation. */
  labels?: KanbanLabels;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<KanbanBoardSlot>;
}

const defaults = {
  instructions:
    'Press Space to pick up. While holding, use arrow keys to move, Space to drop and Escape to cancel.',
  pickedUp: (item: string, column: string, pos: number, total: number) =>
    `Picked up ${item}. In ${column}, position ${pos} of ${total}.`,
  moved: (item: string, column: string, pos: number, total: number) =>
    `${item} moved to ${column}, position ${pos} of ${total}.`,
  dropped: (item: string, column: string, pos: number) =>
    `${item} dropped in ${column}, position ${pos}.`,
  cancelled: (item: string) => `Move cancelled. ${item} returned to its place.`,
  moveAction: 'Move to…',
  moveTo: (item: string) => `Move ${item}`,
  moveToColumn: (column: string) => `Move to ${column}`,
};

function KanbanBoardImpl<T extends { id: string }>(
  {
    value,
    defaultValue = [],
    onValueChange,
    renderCard,
    getItemLabel,
    canMove,
    columnActions,
    onCardOpen,
    labels,
    className,
    classNames,
    ...props
  }: KanbanBoardProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [columns, setColumns] = useControllableState<KanbanColumn<T>[]>({
    value,
    defaultValue,
  });
  const t = { ...defaults, ...labels };
  const baseId = useId();
  const instructionsId = `${baseId}-instructions`;

  // Keyboard move in progress: the preview columns and where the card started.
  const [held, setHeld] = useState<{
    itemId: string;
    preview: KanbanColumn<T>[];
  } | null>(null);
  const shown = held?.preview ?? columns;

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    columnId: string;
    index: number;
  } | null>(null);

  const [announcement, setAnnouncement] = useState('');
  const cardRefs = useRef(new Map<string, HTMLLIElement>());
  const focusRequest = useRef<string | null>(null);
  useEffect(() => {
    if (focusRequest.current) {
      cardRefs.current.get(focusRequest.current)?.focus();
      focusRequest.current = null;
    }
  });

  const labelOf = (id: string) => {
    for (const c of shown) {
      const item = c.items.find((it) => it.id === id);
      if (item) return getItemLabel(item);
    }
    return '';
  };

  const commit = (
    itemId: string,
    toColumnId: string,
    toIndex: number,
  ): boolean => {
    const from = locate(columns, itemId);
    if (!from) return false;
    const fromCol = columns[from.col]!;
    const move: KanbanMove = {
      itemId,
      fromColumnId: fromCol.id,
      fromIndex: from.index,
      toColumnId,
      toIndex,
    };
    if (fromCol.id === toColumnId && from.index === toIndex) return true;
    if (canMove && !canMove(move)) return false;
    const next = moveKanbanItem(columns, itemId, toColumnId, toIndex);
    setColumns(next);
    onValueChange?.(next, move);
    return true;
  };

  const focusCard = (id: string | undefined) => {
    if (!id) return;
    focusRequest.current = id;
    cardRefs.current.get(id)?.focus();
  };

  const onCardKeyDown = (event: KeyboardEvent<HTMLLIElement>, item: T) => {
    if (event.target !== event.currentTarget) return;
    const pos = locate(shown, item.id);
    if (!pos) return;
    const key = event.key;

    if (held) {
      const handled = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        ' ',
        'Enter',
        'Escape',
        'Tab',
      ];
      if (!handled.includes(key)) return;
      event.preventDefault();
      if (key === 'Escape' || key === 'Tab') {
        setHeld(null);
        setAnnouncement(t.cancelled(getItemLabel(item)));
        focusRequest.current = item.id;
        return;
      }
      if (key === ' ' || key === 'Enter') {
        const column = shown[pos.col]!;
        const ok = commit(item.id, column.id, pos.index);
        setHeld(null);
        focusRequest.current = item.id;
        setAnnouncement(
          ok
            ? t.dropped(getItemLabel(item), column.title, pos.index + 1)
            : t.cancelled(getItemLabel(item)),
        );
        return;
      }
      let col = pos.col;
      let index = pos.index;
      const rtl =
        event.currentTarget.closest('[dir="rtl"]') !== null ||
        (typeof document !== 'undefined' && document.dir === 'rtl') ||
        getComputedStyle(event.currentTarget).direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (key === 'ArrowUp') index--;
      else if (key === 'ArrowDown') index++;
      else if (key === forward) col++;
      else if (key === back) col--;
      if (col < 0 || col >= shown.length) return;
      const target = shown[col]!;
      const max =
        col === pos.col ? target.items.length - 1 : target.items.length;
      index = Math.max(0, Math.min(index, max));
      if (col === pos.col && index === pos.index) return;
      const preview = moveKanbanItem(shown, item.id, target.id, index);
      setHeld({ ...held, preview });
      focusRequest.current = item.id;
      setAnnouncement(
        t.moved(
          getItemLabel(item),
          target.title,
          index + 1,
          preview[col]!.items.length,
        ),
      );
      return;
    }

    if (key === ' ') {
      event.preventDefault();
      const column = shown[pos.col]!;
      setHeld({ itemId: item.id, preview: shown });
      setAnnouncement(
        t.pickedUp(
          getItemLabel(item),
          column.title,
          pos.index + 1,
          column.items.length,
        ),
      );
    } else if (key === 'Enter') {
      if (onCardOpen) {
        event.preventDefault();
        onCardOpen(item);
      }
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      focusCard(
        shown[pos.col]!.items[pos.index + (key === 'ArrowDown' ? 1 : -1)]?.id,
      );
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      const rtl =
        event.currentTarget.closest('[dir="rtl"]') !== null ||
        (typeof document !== 'undefined' && document.dir === 'rtl') ||
        getComputedStyle(event.currentTarget).direction === 'rtl';
      const step = (key === 'ArrowRight') !== rtl ? 1 : -1;
      for (let c = pos.col + step; c >= 0 && c < shown.length; c += step) {
        const items = shown[c]!.items;
        if (items.length) {
          focusCard(items[Math.min(pos.index, items.length - 1)]!.id);
          break;
        }
      }
    }
  };

  const indexFromPointer = (
    event: DragEvent<HTMLElement>,
    list: HTMLElement,
  ) => {
    const cards = Array.from(
      list.querySelectorAll<HTMLElement>(':scope > [data-slot=kanban-card]'),
    ).filter((el) => el.dataset.id !== dragId);
    const i = cards.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return event.clientY < r.top + r.height / 2;
    });
    return i === -1 ? cards.length : i;
  };

  return (
    <div
      ref={ref}
      role="region"
      data-slot="kanban-board"
      className={cn(
        'flex w-full gap-4 overflow-x-auto pb-2',
        classNames?.root,
        className,
      )}
      {...props}
    >
      <p id={instructionsId} hidden>
        {t.instructions}
      </p>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      {shown.map((column) => {
        const count = column.items.length;
        const over = column.limit !== undefined && count > column.limit;
        const headingId = `${baseId}-col-${column.id}`;
        const isTarget = dropTarget?.columnId === column.id;
        return (
          <section
            key={column.id}
            aria-labelledby={headingId}
            data-slot="kanban-column"
            data-drop-target={isTarget ? '' : undefined}
            className={cn(
              'flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/40 transition-colors',
              'data-drop-target:border-primary/50 data-drop-target:bg-primary/5',
              classNames?.column,
            )}
          >
            <header
              data-slot="kanban-column-header"
              className={cn(
                'flex items-center gap-2 px-3 pt-3 pb-2',
                classNames?.columnHeader,
              )}
            >
              {column.tone && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    toneDot[column.tone],
                  )}
                />
              )}
              <h3
                id={headingId}
                data-slot="kanban-column-title"
                className={cn(
                  'truncate text-sm font-semibold',
                  classNames?.columnTitle,
                )}
              >
                {column.title}
              </h3>
              <span
                data-slot="kanban-count"
                data-over-limit={over ? '' : undefined}
                className={cn(
                  'rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums ring-1 ring-border',
                  'data-over-limit:bg-destructive/10 data-over-limit:text-destructive data-over-limit:ring-destructive/30',
                  classNames?.count,
                )}
              >
                {column.limit !== undefined
                  ? `${count}/${column.limit}`
                  : count}
              </span>
              {columnActions && (
                <div className="ms-auto flex items-center gap-1">
                  {columnActions(column)}
                </div>
              )}
            </header>
            <ul
              aria-labelledby={headingId}
              data-slot="kanban-list"
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const index = indexFromPointer(e, e.currentTarget);
                if (
                  dropTarget?.columnId !== column.id ||
                  dropTarget.index !== index
                ) {
                  setDropTarget({ columnId: column.id, index });
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                  setDropTarget(null);
              }}
              onDrop={(e) => {
                if (!dragId) return;
                e.preventDefault();
                const index = indexFromPointer(e, e.currentTarget);
                const label = labelOf(dragId);
                if (commit(dragId, column.id, index))
                  setAnnouncement(t.dropped(label, column.title, index + 1));
                setDragId(null);
                setDropTarget(null);
              }}
              className={cn(
                'flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2',
                classNames?.list,
              )}
            >
              {column.items.map((item, i) => {
                const isHeld = held?.itemId === item.id;
                return (
                  <li
                    key={item.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(item.id, el);
                      else cardRefs.current.delete(item.id);
                    }}
                    tabIndex={0}
                    draggable
                    aria-roledescription="draggable card"
                    aria-describedby={instructionsId}
                    data-slot="kanban-card"
                    data-id={item.id}
                    data-held={isHeld ? '' : undefined}
                    data-dragging={dragId === item.id ? '' : undefined}
                    onKeyDown={(e) => onCardKeyDown(e, item)}
                    onBlur={() => {
                      if (isHeld && !focusRequest.current) setHeld(null);
                    }}
                    onClick={() => onCardOpen?.(item)}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', item.id);
                      setDragId(item.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropTarget(null);
                    }}
                    className={cn(
                      'group relative flex cursor-grab gap-2 rounded-md border border-border bg-card p-3 text-sm text-card-foreground shadow-xs outline-none',
                      'focus-visible:ring-2 focus-visible:ring-ring',
                      'data-held:rotate-1 data-held:shadow-lg data-held:ring-2 data-held:ring-primary',
                      'data-dragging:opacity-40',
                      isTarget &&
                        dropTarget?.index === i &&
                        'before:absolute before:inset-x-0 before:-top-1.5 before:h-0.5 before:rounded-full before:bg-primary',
                      classNames?.card,
                    )}
                  >
                    <GripVerticalIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground"
                    />
                    <div className="min-w-0 flex-1">{renderCard(item)}</div>
                    {shown.length > 1 && (
                      <select
                        aria-label={t.moveTo(getItemLabel(item))}
                        data-slot="kanban-card-move-select"
                        value=""
                        onChange={(e) => {
                          e.stopPropagation();
                          const targetColId = e.target.value;
                          if (!targetColId) return;
                          const targetCol = shown.find(
                            (c) => c.id === targetColId,
                          );
                          if (!targetCol) return;
                          const ok = commit(
                            item.id,
                            targetCol.id,
                            targetCol.items.length,
                          );
                          if (ok) {
                            setAnnouncement(
                              t.dropped(
                                getItemLabel(item),
                                targetCol.title,
                                targetCol.items.length + 1,
                              ),
                            );
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'absolute top-2 end-2 text-xs opacity-0 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100',
                          'rounded border border-border bg-background px-1.5 py-0.5 shadow-xs cursor-pointer',
                          classNames?.cardMoveSelect,
                        )}
                      >
                        <option value="" disabled>
                          {t.moveAction}
                        </option>
                        {shown
                          .filter((c) => c.id !== column.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {t.moveToColumn(c.title)}
                            </option>
                          ))}
                      </select>
                    )}
                  </li>
                );
              })}
              {isTarget &&
                dropTarget!.index >=
                  column.items.filter((it) => it.id !== dragId).length &&
                column.items.length > 0 && (
                  <li
                    aria-hidden="true"
                    className="h-0.5 rounded-full bg-primary"
                  />
                )}
              {column.items.length === 0 && (
                <li
                  data-slot="kanban-empty"
                  className={cn(
                    'flex flex-1 items-center justify-center rounded-md border border-dashed border-border py-6 text-xs text-muted-foreground',
                    classNames?.empty,
                  )}
                >
                  {t.empty ?? 'No cards'}
                </li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/**
 * A board of columns with cards that move between them: hiring pipelines, sales deals,
 * support tickets, approval stages. Drag with a mouse, or focus a card and press Space to
 * pick it up, arrow keys to move it, and Space to drop (each step is announced). Columns
 * show counts and optional work-in-progress limits.
 *
 * @example
 * <KanbanBoard
 *   aria-label="Hiring pipeline"
 *   value={columns}
 *   onValueChange={(next, move) => { setColumns(next); api.moveCandidate(move); }}
 *   getItemLabel={(c) => c.name}
 *   renderCard={(c) => <><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.role}</p></>}
 * />
 */
// forwardRef drops generics, so cast back to a generic component (T is inferred from `value`).
export const KanbanBoard = forwardRef(KanbanBoardImpl) as <
  T extends { id: string },
>(
  props: KanbanBoardProps<T> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;
