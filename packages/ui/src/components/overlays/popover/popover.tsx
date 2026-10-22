'use client';

import { forwardRef } from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { popupSurface } from '../../../lib/styles';

/**
 * Interactive floating content anchored to a trigger, e.g. a filter form or a date picker.
 * For short non-interactive hints, use `Tooltip`.
 *
 * @example
 * <Popover>
 *   <PopoverTrigger render={<Button variant="outline" />}>Share</PopoverTrigger>
 *   <PopoverContent>
 *     <PopoverTitle>Share link</PopoverTitle>
 *     <PopoverDescription>Anyone with the link can view.</PopoverDescription>
 *   </PopoverContent>
 * </Popover>
 */
export const Popover = BasePopover.Root;
export type PopoverProps = BasePopover.Root.Props;

export const PopoverTrigger = forwardRef<
  HTMLButtonElement,
  BasePopover.Trigger.Props
>(function PopoverTrigger(props, ref) {
  return (
    <BasePopover.Trigger ref={ref} data-slot="popover-trigger" {...props} />
  );
});

export const PopoverClose = forwardRef<
  HTMLButtonElement,
  BasePopover.Close.Props
>(function PopoverClose(props, ref) {
  return <BasePopover.Close ref={ref} data-slot="popover-close" {...props} />;
});

export interface PopoverContentProps extends BasePopover.Popup.Props {
  /** Side of the trigger to open on. Flips automatically when there's no room. @default 'bottom' */
  side?: BasePopover.Positioner.Props['side'];
  /** Alignment against the trigger. @default 'center' */
  align?: BasePopover.Positioner.Props['align'];
  /** Gap from the trigger, in px. @default 6 */
  sideOffset?: number;
}

/** The floating panel. Rendered in a portal. */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(
    { className, side = 'bottom', align = 'center', sideOffset = 6, ...props },
    ref,
  ) {
    return (
      <BasePopover.Portal>
        <BasePopover.Positioner
          className="z-50"
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BasePopover.Popup
            ref={ref}
            data-slot="popover-content"
            className={mergeClassName(
              cn(popupSurface, 'w-72 p-4 text-sm'),
              className,
            )}
            {...props}
          />
        </BasePopover.Positioner>
      </BasePopover.Portal>
    );
  },
);

export const PopoverTitle = forwardRef<
  HTMLHeadingElement,
  BasePopover.Title.Props
>(function PopoverTitle({ className, ...props }, ref) {
  return (
    <BasePopover.Title
      ref={ref}
      data-slot="popover-title"
      className={mergeClassName('mb-1 text-sm font-semibold', className)}
      {...props}
    />
  );
});

export const PopoverDescription = forwardRef<
  HTMLParagraphElement,
  BasePopover.Description.Props
>(function PopoverDescription({ className, ...props }, ref) {
  return (
    <BasePopover.Description
      ref={ref}
      data-slot="popover-description"
      className={mergeClassName('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
