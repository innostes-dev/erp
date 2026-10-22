'use client';

import { forwardRef } from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '../../../lib/icons';
import {
  listGroupLabel,
  listItem,
  listSeparator,
  popupSurface,
} from '../../../lib/styles';
import { inputVariants, type InputSize } from '../input/input-variants';

/**
 * Pick one value (or several with `multiple`) from a list. Keyboard and screen-reader
 * friendly, submits `name` with forms, and works inside `Field`.
 *
 * Pass `items` (an array of `{ value, label }` or a value→label record) so `SelectValue`
 * can show the label of the selected value.
 *
 * @example
 * const statuses = [
 *   { value: 'active', label: 'Active' },
 *   { value: 'archived', label: 'Archived' },
 * ];
 *
 * <Select items={statuses} defaultValue="active" name="status">
 *   <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
 *   <SelectContent>
 *     {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
 *   </SelectContent>
 * </Select>
 */
export const Select = BaseSelect.Root;
export type SelectProps<
  Value,
  Multiple extends boolean | undefined = false,
> = BaseSelect.Root.Props<Value, Multiple>;

export interface SelectTriggerProps extends BaseSelect.Trigger.Props {
  /**
   * Height and text size, matching `Input`.
   * @default 'md'
   */
  size?: InputSize;
}

/** The button that opens the list. Put a `SelectValue` inside. */
export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ className, size, children, ...props }, ref) {
    return (
      <BaseSelect.Trigger
        ref={ref}
        data-slot="select-trigger"
        className={mergeClassName(
          cn(
            inputVariants({ size }),
            'flex cursor-pointer items-center justify-between gap-2 text-start',
            'data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/25',
            '[&>span]:truncate',
          ),
          className,
        )}
        {...props}
      >
        {children}
        <BaseSelect.Icon className="shrink-0 text-muted-foreground">
          <ChevronDownIcon className="size-4" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
    );
  },
);

/** Shows the selected value's label, or `placeholder` when nothing is selected. */
export const SelectValue = forwardRef<HTMLElement, BaseSelect.Value.Props>(
  function SelectValue({ className, ...props }, ref) {
    return (
      <BaseSelect.Value
        ref={ref}
        data-slot="select-value"
        className={mergeClassName(
          'truncate data-placeholder:text-muted-foreground',
          className,
        )}
        {...props}
      />
    );
  },
);

export interface SelectContentProps extends BaseSelect.Popup.Props {
  /**
   * Overlap the trigger so the selected item sits over it (macOS style). When `false`, the
   * list opens below the trigger like a dropdown.
   * @default false
   */
  alignItemWithTrigger?: boolean;
  /** Which side of the trigger to open on when not aligned with it. @default 'bottom' */
  side?: BaseSelect.Positioner.Props['side'];
  /** Gap between trigger and list, in px. @default 4 */
  sideOffset?: number;
  /** Alignment against the trigger. @default 'start' */
  align?: BaseSelect.Positioner.Props['align'];
}

/** The floating list. Rendered in a portal, sized to at least the trigger's width. */
export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  function SelectContent(
    {
      className,
      children,
      alignItemWithTrigger = false,
      side = 'bottom',
      sideOffset = 4,
      align = 'start',
      ...props
    },
    ref,
  ) {
    return (
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          className="z-50 outline-none select-none"
          alignItemWithTrigger={alignItemWithTrigger}
          side={side}
          sideOffset={sideOffset}
          align={align}
        >
          <BaseSelect.ScrollUpArrow className="top-0 z-10 flex h-6 w-full cursor-default items-center justify-center bg-popover text-muted-foreground">
            <ChevronUpIcon className="size-4" />
          </BaseSelect.ScrollUpArrow>
          <BaseSelect.Popup
            ref={ref}
            data-slot="select-content"
            className={mergeClassName(
              cn(
                popupSurface,
                'max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto p-1',
                'data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)]',
              ),
              className,
            )}
            {...props}
          >
            <BaseSelect.List>{children}</BaseSelect.List>
          </BaseSelect.Popup>
          <BaseSelect.ScrollDownArrow className="bottom-0 z-10 flex h-6 w-full cursor-default items-center justify-center bg-popover text-muted-foreground">
            <ChevronDownIcon className="size-4" />
          </BaseSelect.ScrollDownArrow>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    );
  },
);

/** One option. `value` is what's submitted; children are what's shown. */
export const SelectItem = forwardRef<HTMLElement, BaseSelect.Item.Props>(
  function SelectItem({ className, children, ...props }, ref) {
    return (
      <BaseSelect.Item
        ref={ref}
        data-slot="select-item"
        className={mergeClassName(
          cn(listItem, 'cursor-pointer pe-8'),
          className,
        )}
        {...props}
      >
        <BaseSelect.ItemText className="truncate">
          {children}
        </BaseSelect.ItemText>
        <BaseSelect.ItemIndicator className="absolute end-2 flex items-center">
          <CheckIcon className="size-4" />
        </BaseSelect.ItemIndicator>
      </BaseSelect.Item>
    );
  },
);

/** Groups related options under a `SelectGroupLabel`. */
export const SelectGroup = forwardRef<HTMLDivElement, BaseSelect.Group.Props>(
  function SelectGroup({ className, ...props }, ref) {
    return (
      <BaseSelect.Group
        ref={ref}
        data-slot="select-group"
        className={className}
        {...props}
      />
    );
  },
);

/** Heading for a `SelectGroup`. */
export const SelectGroupLabel = forwardRef<
  HTMLDivElement,
  BaseSelect.GroupLabel.Props
>(function SelectGroupLabel({ className, ...props }, ref) {
  return (
    <BaseSelect.GroupLabel
      ref={ref}
      data-slot="select-group-label"
      className={mergeClassName(listGroupLabel, className)}
      {...props}
    />
  );
});

/** A divider between groups. */
export const SelectSeparator = forwardRef<
  HTMLDivElement,
  BaseSelect.Separator.Props
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <BaseSelect.Separator
      ref={ref}
      data-slot="select-separator"
      className={mergeClassName(listSeparator, className)}
      {...props}
    />
  );
});
