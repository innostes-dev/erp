'use client';

import { createContext, useContext, forwardRef } from 'react';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { mergeClassName } from '../../../lib/merge-class-name';
import { cn } from '../../../lib/cn';
import {
  toggleVariants,
  type ToggleVariantProps,
} from '../toggle/toggle-variants';

const ToggleGroupContext = createContext<ToggleVariantProps>({});

export interface ToggleGroupProps
  extends BaseToggleGroup.Props, ToggleVariantProps {}

/**
 * A set of toggles where one (default) or several (`multiple`) can be pressed.
 * `value` is always an array of the pressed items' values.
 *
 * @example
 * <ToggleGroup defaultValue={['list']} aria-label="View">
 *   <ToggleGroupItem value="list" aria-label="List"><ListIcon /></ToggleGroupItem>
 *   <ToggleGroupItem value="grid" aria-label="Grid"><GridIcon /></ToggleGroupItem>
 * </ToggleGroup>
 */
export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(
  function ToggleGroup({ className, variant, size, children, ...props }, ref) {
    return (
      <BaseToggleGroup
        ref={ref}
        data-slot="toggle-group"
        className={mergeClassName(
          cn(
            'inline-flex items-center gap-1 data-[orientation=vertical]:flex-col',
            variant === 'outline' &&
              'gap-0 [&>*:not(:first-child)]:-ms-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none',
          ),
          className,
        )}
        {...props}
      >
        <ToggleGroupContext.Provider value={{ variant, size }}>
          {children}
        </ToggleGroupContext.Provider>
      </BaseToggleGroup>
    );
  },
);

export interface ToggleGroupItemProps
  extends BaseToggle.Props, ToggleVariantProps {
  /** Identifies this item in the group's `value` array. */
  value: string;
}

/** One option in a `ToggleGroup`. Inherits `variant` and `size` from the group. */
export const ToggleGroupItem = forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(function ToggleGroupItem({ className, variant, size, ...props }, ref) {
  const group = useContext(ToggleGroupContext);
  return (
    <BaseToggle
      ref={ref}
      data-slot="toggle-group-item"
      className={mergeClassName(
        cn(
          toggleVariants({
            variant: variant ?? group.variant,
            size: size ?? group.size,
          }),
          'focus-visible:z-10',
        ),
        className,
      )}
      {...props}
    />
  );
});
