'use client';

import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';

export interface SkipLinkProps extends ComponentProps<'a'> {
    /** Target element id to focus when clicked, e.g. "main-content". @default 'main-content' */
    targetId?: string;
}

/**
 * An accessible skip-to-content link for keyboard and screen-reader users.
 * Visually hidden until focused, then fixed prominently at the top-start of the viewport.
 *
 * @example
 * <SkipLink />
 * ...
 * <main id="main-content">...</main>
 */
export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(
    function SkipLink(
        {
            className,
            targetId = 'main-content',
            children = 'Skip to main content',
            href,
            ...props
        },
        ref,
    ) {
        return (
            <a
                ref={ref}
                data-slot="skip-link"
                href={href ?? `#${targetId}`}
                className={cn(
                    'fixed start-4 top-4 z-[9999] -translate-y-24 rounded-md border border-border bg-popover px-4 py-2 text-sm font-medium text-popover-foreground shadow-lg transition-transform focus:translate-y-0 focus:outline-2 focus:outline-ring',
                    className,
                )}
                {...props}
            >
                {children}
            </a>
        );
    },
);
