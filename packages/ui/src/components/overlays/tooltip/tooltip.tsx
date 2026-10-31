'use client';

import { forwardRef } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { mergeClassName } from '../../../lib/merge-class-name';

/**
 * Shares hover/focus delay between tooltips so moving across a toolbar shows the next
 * tooltip instantly. Wrap your app (or a toolbar) once.
 */
export function TooltipProvider({
    delay = 400,
    ...props
}: BaseTooltip.Provider.Props) {
    return <BaseTooltip.Provider delay={delay} {...props} />;
}

/**
 * A short label shown on hover and keyboard focus, e.g. for icon-only buttons.
 * Never put essential information or interactive content in a tooltip.
 *
 * @example
 * <Tooltip>
 *   <TooltipTrigger render={<Button iconOnly variant="ghost" aria-label="Archive" />}>
 *     <ArchiveIcon />
 *   </TooltipTrigger>
 *   <TooltipContent>Archive</TooltipContent>
 * </Tooltip>
 */
export const Tooltip = BaseTooltip.Root;
export type TooltipProps = BaseTooltip.Root.Props;

export const TooltipTrigger = forwardRef<
    HTMLButtonElement,
    BaseTooltip.Trigger.Props
>(function TooltipTrigger(props, ref) {
    return (
        <BaseTooltip.Trigger ref={ref} data-slot="tooltip-trigger" {...props} />
    );
});

export interface TooltipContentProps extends BaseTooltip.Popup.Props {
    /** Side of the trigger. Flips automatically when there's no room. @default 'top' */
    side?: BaseTooltip.Positioner.Props['side'];
    /** Alignment against the trigger. @default 'center' */
    align?: BaseTooltip.Positioner.Props['align'];
    /** Gap from the trigger, in px. @default 6 */
    sideOffset?: number;
}

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
    function TooltipContent(
        { className, side = 'top', align = 'center', sideOffset = 6, ...props },
        ref,
    ) {
        return (
            <BaseTooltip.Portal>
                <BaseTooltip.Positioner
                    className="z-50"
                    side={side}
                    align={align}
                    sideOffset={sideOffset}
                >
                    <BaseTooltip.Popup
                        ref={ref}
                        data-slot="tooltip-content"
                        className={mergeClassName(
                            [
                                'max-w-xs rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md',
                                'origin-(--transform-origin) transition-[opacity,scale] duration-100',
                                'data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:opacity-0',
                                'data-instant:transition-none',
                            ].join(' '),
                            className,
                        )}
                        {...props}
                    />
                </BaseTooltip.Positioner>
            </BaseTooltip.Portal>
        );
    },
);
