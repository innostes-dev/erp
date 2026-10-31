'use client';

import { forwardRef } from 'react';
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';

export interface ScrollAreaProps extends BaseScrollArea.Root.Props {
    /**
     * Which scrollbars to show.
     * @default 'vertical'
     */
    scrollbars?: 'vertical' | 'horizontal' | 'both';
    /** Class for the scrolling viewport (e.g. to add padding). */
    viewportClassName?: string;
}

/**
 * A scroll container with thin, consistent scrollbars across browsers. Keeps native
 * scrolling, keyboard support and touch behaviour. Give it a height (or max-height).
 *
 * @example
 * <ScrollArea className="h-72 rounded-md border">
 *   {items.map((item) => <div key={item.id}>{item.name}</div>)}
 * </ScrollArea>
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
    function ScrollArea(
        {
            className,
            scrollbars = 'vertical',
            viewportClassName,
            children,
            ...props
        },
        ref,
    ) {
        const bar = (orientation: 'vertical' | 'horizontal') => (
            <BaseScrollArea.Scrollbar
                orientation={orientation}
                className={cn(
                    'flex touch-none p-0.5 opacity-0 transition-opacity select-none data-hovering:opacity-100 data-scrolling:opacity-100',
                    orientation === 'vertical' ? 'w-2.5' : 'h-2.5 flex-col',
                )}
            >
                <BaseScrollArea.Thumb className="relative flex-1 rounded-full bg-border hover:bg-muted-foreground/40" />
            </BaseScrollArea.Scrollbar>
        );

        return (
            <BaseScrollArea.Root
                ref={ref}
                data-slot="scroll-area"
                className={mergeClassName('relative overflow-hidden', className)}
                {...props}
            >
                <BaseScrollArea.Viewport
                    data-slot="scroll-area-viewport"
                    className={cn(
                        'size-full overscroll-contain rounded-[inherit] outline-none focus-visible:outline-2 focus-visible:outline-ring',
                        viewportClassName,
                    )}
                >
                    {children}
                </BaseScrollArea.Viewport>
                {(scrollbars === 'vertical' || scrollbars === 'both') &&
                    bar('vertical')}
                {(scrollbars === 'horizontal' || scrollbars === 'both') &&
                    bar('horizontal')}
                {scrollbars === 'both' && <BaseScrollArea.Corner />}
            </BaseScrollArea.Root>
        );
    },
);
