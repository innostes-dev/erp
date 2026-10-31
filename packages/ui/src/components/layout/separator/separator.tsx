'use client';

import { forwardRef } from 'react';
import { Separator as BaseSeparator } from '@base-ui/react/separator';
import { mergeClassName } from '../../../lib/merge-class-name';

/**
 * A thin line that separates content. Announced as a separator; set `orientation` for
 * vertical dividers (e.g. between toolbar groups).
 *
 * @example
 * <Separator />
 * <div className="flex h-5 items-center gap-3">Docs <Separator orientation="vertical" /> API</div>
 */
export const Separator = forwardRef<HTMLDivElement, BaseSeparator.Props>(
    function Separator({ className, orientation = 'horizontal', ...props }, ref) {
        return (
            <BaseSeparator
                ref={ref}
                data-slot="separator"
                orientation={orientation}
                className={mergeClassName(
                    'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch',
                    className,
                )}
                {...props}
            />
        );
    },
);
