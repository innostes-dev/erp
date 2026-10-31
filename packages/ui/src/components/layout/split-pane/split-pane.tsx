'use client';

import {
  Children,
  forwardRef,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { cn } from '../../../lib/cn';
import type { SlotClassNames } from '../../../lib/slots';
import { useControllableState } from '../../../lib/use-controllable-state';
import { useId } from '../../../lib/use-id';

export type SplitPaneSlot = 'root' | 'start' | 'end' | 'handle';

export interface SplitPaneProps extends Omit<
  ComponentProps<'div'>,
  'defaultValue'
> {
  /** `horizontal`: panes side by side. `vertical`: stacked. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** Size of the first pane, in percent (controlled). */
  size?: number;
  /** Initial size of the first pane, in percent. Double-clicking the handle restores it. @default 50 */
  defaultSize?: number;
  /** Called while the handle moves. */
  onSizeChange?: (size: number) => void;
  /** Smallest size of the first pane, in percent. @default 15 */
  minSize?: number;
  /** Largest size of the first pane, in percent. @default 85 */
  maxSize?: number;
  /** Percent moved per arrow key press. Shift moves 4× as far. @default 2 */
  step?: number;
  /** Whether the start pane is collapsed (controlled). @default false */
  collapsed?: boolean;
  /** Whether the start pane is initially collapsed (uncontrolled). @default false */
  defaultCollapsed?: boolean;
  /** Called when the collapsed state changes. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Accessible name of the resize handle. @default 'Resize panes' */
  handleLabel?: string;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<SplitPaneSlot>;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/**
 * Two panes with a draggable divider, for master-detail screens: a list of orders beside the
 * selected order, an email list beside the message. Pass exactly two children. The divider
 * is a focusable `separator`: arrow keys resize, Home/End jump to the limits, and
 * double-click resets.
 *
 * @example
 * <SplitPane defaultSize={35} minSize={20} className="h-[600px] rounded-lg border">
 *   <OrderList />
 *   <OrderDetail />
 * </SplitPane>
 */
export const SplitPane = forwardRef<HTMLDivElement, SplitPaneProps>(
  function SplitPane(
    {
      orientation = 'horizontal',
      size,
      defaultSize = 50,
      onSizeChange,
      minSize = 15,
      maxSize = 85,
      step = 2,
      collapsed,
      defaultCollapsed = false,
      onCollapsedChange,
      handleLabel = 'Resize panes',
      className,
      classNames,
      children,
      ...props
    },
    ref,
  ) {
    const [current, setCurrent] = useControllableState({
      value: size,
      defaultValue: defaultSize,
      onChange: onSizeChange,
    });
    const [isCollapsed, setIsCollapsed] = useControllableState({
      value: collapsed,
      defaultValue: defaultCollapsed,
      onChange: onCollapsedChange,
    });
    const rootRef = useRef<HTMLDivElement | null>(null);
    const startId = useId();
    const horizontal = orientation === 'horizontal';
    const [start, end] = Children.toArray(children);
    const value = clamp(current, minSize, maxSize);

    const set = (next: number) => {
      if (isCollapsed) setIsCollapsed(false);
      const clamped = Math.round(clamp(next, minSize, maxSize) * 100) / 100;
      if (clamped !== value) setCurrent(clamped);
    };

    const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const rtl =
        horizontal && getComputedStyle(rootRef.current!).direction === 'rtl';
      const offset = horizontal
        ? rtl
          ? rect.right - event.clientX
          : event.clientX - rect.left
        : event.clientY - rect.top;
      const total = horizontal ? rect.width : rect.height;
      if (total > 0) set((offset / total) * 100);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const delta = event.shiftKey ? step * 4 : step;
      const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
      const keys: Record<string, (() => void) | undefined> = horizontal
        ? {
            ArrowLeft: () => set(value + (rtl ? delta : -delta)),
            ArrowRight: () => set(value + (rtl ? -delta : delta)),
          }
        : {
            ArrowUp: () => set(value - delta),
            ArrowDown: () => set(value + delta),
          };
      keys.Home = () => set(minSize);
      keys.End = () => set(maxSize);
      const action = keys[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    };

    return (
      <div
        ref={(el) => {
          rootRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        data-slot="split-pane"
        data-orientation={orientation}
        className={cn(
          'flex min-h-0 min-w-0 overflow-hidden',
          horizontal ? 'flex-row' : 'flex-col',
          classNames?.root,
          className,
        )}
        {...props}
      >
        <div
          id={startId}
          data-slot="split-pane-start"
          data-collapsed={isCollapsed ? '' : undefined}
          className={cn(
            'min-h-0 min-w-0 shrink-0 overflow-auto',
            classNames?.start,
          )}
          style={{
            flexBasis: isCollapsed ? '0%' : `${value}%`,
            display: isCollapsed ? 'none' : undefined,
          }}
        >
          {start}
        </div>
        <div
          role="separator"
          tabIndex={0}
          aria-label={handleLabel}
          aria-controls={startId}
          aria-orientation={horizontal ? 'vertical' : 'horizontal'}
          aria-valuenow={isCollapsed ? 0 : value}
          aria-valuemin={minSize}
          aria-valuemax={maxSize}
          data-slot="split-pane-handle"
          data-collapsed={isCollapsed ? '' : undefined}
          onKeyDown={onKeyDown}
          onDoubleClick={() => {
            if (isCollapsed) setIsCollapsed(false);
            else set(defaultSize);
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            e.currentTarget.focus();
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture?.(e.pointerId))
              fromPointer(e);
          }}
          onPointerUp={(e) =>
            e.currentTarget.releasePointerCapture?.(e.pointerId)
          }
          className={cn(
            'group relative flex shrink-0 touch-none items-center justify-center bg-border outline-none select-none',
            'hover:bg-primary/40 focus-visible:bg-ring active:bg-primary',
            'before:absolute before:content-[""]',
            horizontal
              ? 'w-px cursor-col-resize before:inset-y-0 before:-inset-x-1.5'
              : 'h-px cursor-row-resize before:inset-x-0 before:-inset-y-1.5',
            classNames?.handle,
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'z-10 rounded-full border border-border bg-background shadow-xs transition-colors group-hover:border-primary/40 group-focus-visible:border-ring',
              horizontal ? 'h-6 w-1.5' : 'h-1.5 w-6',
            )}
          />
        </div>
        <div
          data-slot="split-pane-end"
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-auto',
            classNames?.end,
          )}
        >
          {end}
        </div>
      </div>
    );
  },
);
