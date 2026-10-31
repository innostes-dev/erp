'use client';

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../../lib/cn';
import { ChevronRightIcon } from '../../../lib/icons';
import type { SlotClassNames } from '../../../lib/slots';
import { useControllableState } from '../../../lib/use-controllable-state';
import { Spinner } from '../../feedback/spinner/spinner';

/** One node of a `TreeView`. */
export interface TreeNode {
  /** Unique, stable id. */
  id: string;
  /** What's shown, e.g. "Finance". */
  label: ReactNode;
  /** Plain text for type-ahead when `label` isn't a string. */
  textValue?: string;
  /** Icon before the label. */
  icon?: ReactNode;
  /** Content at the end of the row, e.g. a count badge. */
  meta?: ReactNode;
  /** Child nodes. A node with `children` (even empty) can be expanded. */
  children?: TreeNode[];
  /** Can be focused but not selected. @default false */
  disabled?: boolean;
  /** Indicates child nodes are currently loading asynchronously. @default false */
  loading?: boolean;
}

export type TreeViewSlot =
  'root' | 'item' | 'row' | 'toggle' | 'icon' | 'label' | 'meta' | 'group';

export interface TreeViewProps extends Omit<
  ComponentProps<'ul'>,
  'children' | 'onSelect' | 'defaultValue'
> {
  /** Accessible name, e.g. "Departments". */
  'aria-label': string;
  /** The top-level nodes. */
  items: readonly TreeNode[];
  /** Ids of expanded nodes (controlled). */
  expanded?: string[];
  /** Ids of nodes expanded at first (uncontrolled). @default [] */
  defaultExpanded?: string[];
  /** Called when a node is expanded or collapsed. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Id of the selected node (controlled). `null` for none. */
  selected?: string | null;
  /** Id of the node selected at first (uncontrolled). @default null */
  defaultSelected?: string | null;
  /** Called when a node is selected with click, Enter or Space. */
  onSelectedChange?: (id: string, node: TreeNode) => void;
  /** Row height and text size. @default 'md' */
  size?: 'sm' | 'md';
  /** Accessible label displayed while a node's children are loading. @default 'Loading…' */
  loadingLabel?: string;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<TreeViewSlot>;
}

interface FlatNode {
  node: TreeNode;
  level: number;
  parentId: string | null;
}

function textOf(node: TreeNode): string {
  return (
    node.textValue ?? (typeof node.label === 'string' ? node.label : '')
  ).toLocaleLowerCase();
}

/**
 * A hierarchical list that expands and collapses: departments and teams, chart of accounts,
 * product categories, folders. Follows the WAI-ARIA tree pattern: arrows move, Right/Left
 * expand, collapse or jump to the parent, Home/End, type-ahead, and Enter/Space select.
 *
 * @example
 * <TreeView
 *   aria-label="Departments"
 *   items={[{ id: 'eng', label: 'Engineering', children: [{ id: 'web', label: 'Web' }] }]}
 *   defaultExpanded={['eng']}
 *   onSelectedChange={(id) => setDepartment(id)}
 * />
 */
export const TreeView = forwardRef<HTMLUListElement, TreeViewProps>(
  function TreeView(
    {
      items,
      expanded,
      defaultExpanded = [],
      onExpandedChange,
      selected,
      defaultSelected = null,
      onSelectedChange,
      size = 'md',
      loadingLabel = 'Loading…',
      className,
      classNames,
      ...props
    },
    ref,
  ) {
    const [open, setOpen] = useControllableState({
      value: expanded,
      defaultValue: defaultExpanded,
      onChange: onExpandedChange,
    });
    const [current, setCurrent] = useControllableState<string | null>({
      value: selected,
      defaultValue: defaultSelected,
    });
    const openSet = useMemo(() => new Set(open), [open]);

    const visible = useMemo(() => {
      const out: FlatNode[] = [];
      const walk = (
        nodes: readonly TreeNode[],
        level: number,
        parentId: string | null,
      ) => {
        for (const node of nodes) {
          out.push({ node, level, parentId });
          if (node.children && openSet.has(node.id))
            walk(node.children, level + 1, node.id);
        }
      };
      walk(items, 1, null);
      return out;
    }, [items, openSet]);

    const [focusedId, setFocusedId] = useState<string | null>(null);
    const tabbableId =
      (focusedId &&
        visible.some((v) => v.node.id === focusedId) &&
        focusedId) ||
      (current && visible.some((v) => v.node.id === current) && current) ||
      visible[0]?.node.id;

    const refs = useRef(new Map<string, HTMLLIElement>());
    const shouldFocus = useRef(false);
    useEffect(() => {
      if (shouldFocus.current && focusedId) {
        shouldFocus.current = false;
        refs.current.get(focusedId)?.focus();
      }
    }, [focusedId]);

    const moveTo = (id: string | undefined) => {
      if (!id) return;
      shouldFocus.current = true;
      setFocusedId(id);
    };

    const toggle = (id: string, force?: boolean) => {
      const isOpen = openSet.has(id);
      const next = force ?? !isOpen;
      if (next === isOpen) return;
      setOpen(next ? [...open, id] : open.filter((x) => x !== id));
    };

    const select = (node: TreeNode) => {
      if (node.disabled) return;
      setCurrent(node.id);
      onSelectedChange?.(node.id, node);
    };

    const typeahead = useRef({ text: '', time: 0 });

    const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
      const index = visible.findIndex((v) => v.node.id === tabbableId);
      const item = visible[index];
      if (!item) return;
      const { node } = item;
      const hasChildren = !!node.children;
      let handled = true;
      const isRtl =
        event.currentTarget.closest('[dir="rtl"]') !== null ||
        (typeof document !== 'undefined' && document.dir === 'rtl');
      const expandKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
      const collapseKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

      switch (event.key) {
        case 'ArrowDown':
          moveTo(visible[index + 1]?.node.id);
          break;
        case 'ArrowUp':
          moveTo(visible[index - 1]?.node.id);
          break;
        case 'Home':
          moveTo(visible[0]?.node.id);
          break;
        case 'End':
          moveTo(visible[visible.length - 1]?.node.id);
          break;
        case expandKey:
          if (hasChildren && !openSet.has(node.id)) toggle(node.id, true);
          else if (hasChildren && node.children!.length)
            moveTo(node.children![0]!.id);
          break;
        case collapseKey:
          if (hasChildren && openSet.has(node.id)) toggle(node.id, false);
          else if (item.parentId) moveTo(item.parentId);
          break;
        case 'Enter':
        case ' ':
          select(node);
          break;
        default:
          handled = false;
          if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            const now = Date.now();
            const t = typeahead.current;
            t.text =
              now - t.time > 500
                ? event.key.toLocaleLowerCase()
                : t.text + event.key.toLocaleLowerCase();
            t.time = now;
            const ordered = [
              ...visible.slice(index + 1),
              ...visible.slice(0, index + 1),
            ];
            const pool = t.text.length === 1 ? ordered : [item, ...ordered];
            const match = pool.find((v) => textOf(v.node).startsWith(t.text));
            if (match) moveTo(match.node.id);
            handled = true;
          }
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const renderNodes = (
      nodes: readonly TreeNode[],
      level: number,
    ): ReactNode =>
      nodes.map((node, i) => {
        const hasChildren = !!node.children;
        const isOpen = hasChildren && openSet.has(node.id);
        const isSelected = current === node.id;
        return (
          <li
            key={node.id}
            ref={(el) => {
              if (el) refs.current.set(node.id, el);
              else refs.current.delete(node.id);
            }}
            role="treeitem"
            aria-level={level}
            aria-setsize={nodes.length}
            aria-posinset={i + 1}
            aria-expanded={hasChildren ? isOpen : undefined}
            aria-selected={node.disabled ? undefined : isSelected}
            aria-disabled={node.disabled || undefined}
            tabIndex={node.id === tabbableId ? 0 : -1}
            data-slot="tree-view-item"
            data-selected={isSelected ? '' : undefined}
            onFocus={(e) => {
              if (e.target === e.currentTarget) setFocusedId(node.id);
            }}
            className={cn('group/item outline-none', classNames?.item)}
          >
            <div
              data-slot="tree-view-row"
              onClick={(e) => {
                e.stopPropagation();
                moveTo(node.id);
                select(node);
              }}
              onDoubleClick={() => hasChildren && toggle(node.id)}
              style={{ paddingInlineStart: `${(level - 1) * 1.25 + 0.25}rem` }}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-sm pe-2 text-foreground select-none',
                size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                'group-focus-visible/item:outline-2 group-focus-visible/item:-outline-offset-2 group-focus-visible/item:outline-ring',
                'group-data-selected/item:bg-primary/10 group-data-selected/item:font-medium group-data-selected/item:text-primary',
                'group-aria-disabled/item:cursor-not-allowed group-aria-disabled/item:opacity-50',
                classNames?.row,
              )}
            >
              <span
                data-slot="tree-view-toggle"
                aria-hidden="true"
                onClick={(e) => {
                  if (!hasChildren) return;
                  e.stopPropagation();
                  moveTo(node.id);
                  toggle(node.id);
                }}
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground',
                  hasChildren && 'hover:bg-background',
                  classNames?.toggle,
                )}
              >
                {hasChildren && (
                  <ChevronRightIcon
                    className={cn(
                      'size-3.5 transition-transform rtl:rotate-180',
                      isOpen && 'rotate-90 rtl:rotate-90',
                    )}
                  />
                )}
              </span>
              {node.icon && (
                <span
                  data-slot="tree-view-icon"
                  className={cn(
                    "flex shrink-0 text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
                    classNames?.icon,
                  )}
                >
                  {node.icon}
                </span>
              )}
              <span
                data-slot="tree-view-label"
                className={cn('min-w-0 flex-1 truncate', classNames?.label)}
              >
                {node.label}
              </span>
              {node.meta && (
                <span
                  data-slot="tree-view-meta"
                  className={cn(
                    'shrink-0 text-xs text-muted-foreground',
                    classNames?.meta,
                  )}
                >
                  {node.meta}
                </span>
              )}
            </div>
            {isOpen && node.loading && (
              <ul
                role="group"
                data-slot="tree-view-group"
                className={cn('flex flex-col', classNames?.group)}
              >
                <li
                  role="none"
                  className="flex items-center gap-2 py-1 text-xs text-muted-foreground"
                  style={{ paddingInlineStart: `${level * 1.25 + 0.25}rem` }}
                >
                  <Spinner className="size-3" label={null} />
                  <span>{loadingLabel}</span>
                </li>
              </ul>
            )}
            {isOpen &&
              !node.loading &&
              node.children &&
              node.children.length > 0 && (
                <ul
                  role="group"
                  data-slot="tree-view-group"
                  className={cn('flex flex-col', classNames?.group)}
                >
                  {renderNodes(node.children, level + 1)}
                </ul>
              )}
          </li>
        );
      });

    return (
      <ul
        ref={ref}
        role="tree"
        data-slot="tree-view"
        onKeyDown={onKeyDown}
        className={cn('flex flex-col', classNames?.root, className)}
        {...props}
      >
        {renderNodes(items, 1)}
      </ul>
    );
  },
);
