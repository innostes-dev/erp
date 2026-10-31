import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';

export interface SpinnerProps extends ComponentProps<'svg'> {
    /**
     * Accessible label announced to screen readers. Pass `null` when the spinner sits inside a
     * control that already announces its busy state (e.g. a loading `Button`); it is then hidden
     * from assistive technology.
     * @default 'Loading'
     */
    label?: string | null;
}

/**
 * An animated loading indicator. Inherits the current text colour and is 16px by default;
 * size it with `size-*` classes.
 *
 * @example
 * <Spinner />
 * <Spinner className="size-6 text-primary" label="Loading orders" />
 */
export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(function Spinner(
    { className, label = 'Loading', ...props },
    ref,
) {
    return (
        <svg
            ref={ref}
            data-slot="spinner"
            viewBox="0 0 24 24"
            fill="none"
            role={label ? 'status' : undefined}
            aria-label={label ?? undefined}
            aria-hidden={label ? undefined : true}
            className={cn('size-4 shrink-0 animate-spin', className)}
            {...props}
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                opacity="0.25"
            />
            <path
                d="M22 12a10 10 0 0 0-10-10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
            />
        </svg>
    );
});
