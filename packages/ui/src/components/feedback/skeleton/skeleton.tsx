import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';

/**
 * A pulsing placeholder that mirrors the shape of content while it loads. Size it with
 * utility classes. Hidden from assistive technology; announce loading on the container
 * (e.g. `aria-busy="true"`).
 *
 * @example
 * <div aria-busy="true" className="flex items-center gap-3">
 *   <Skeleton className="size-10 rounded-full" />
 *   <Skeleton className="h-4 w-40" />
 * </div>
 */
export const Skeleton = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function Skeleton({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="skeleton"
        aria-hidden="true"
        className={cn(
          'animate-pulse rounded-md bg-muted motion-reduce:animate-none',
          className,
        )}
        {...props}
      />
    );
  },
);
