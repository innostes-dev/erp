'use client';

import { forwardRef, type ReactNode } from 'react';
import { Progress as BaseProgress } from '@base-ui/react/progress';
import { mergeClassName } from '../../../lib/merge-class-name';

export interface ProgressProps extends BaseProgress.Root.Props {
  /** Visible label above the bar, e.g. "Uploading invoices". */
  label?: ReactNode;
  /**
   * Show the formatted value next to the label.
   * @default false
   */
  showValue?: boolean;
}

/**
 * Shows how far a task has progressed. Pass `value={null}` for an indeterminate state when
 * the duration is unknown. For a static measurement (disk usage, quota), use `Meter`.
 *
 * @example
 * <Progress value={uploaded} max={total} label="Uploading" showValue />
 * <Progress value={null} aria-label="Loading data" />
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  function Progress({ className, label, showValue = false, ...props }, ref) {
    return (
      <BaseProgress.Root
        ref={ref}
        data-slot="progress"
        className={mergeClassName(
          'grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2',
          className,
        )}
        {...props}
      >
        {label && (
          <BaseProgress.Label className="text-sm font-medium text-foreground">
            {label}
          </BaseProgress.Label>
        )}
        {showValue && (
          <BaseProgress.Value className="col-start-2 text-end text-sm text-muted-foreground tabular-nums" />
        )}
        <BaseProgress.Track className="col-span-2 h-2 overflow-hidden rounded-full bg-muted">
          <BaseProgress.Indicator className="block h-full rounded-full bg-primary transition-[width] duration-300 data-indeterminate:w-1/3 data-indeterminate:animate-indeterminate" />
        </BaseProgress.Track>
      </BaseProgress.Root>
    );
  },
);
