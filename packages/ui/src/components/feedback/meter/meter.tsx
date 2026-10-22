'use client';

import { forwardRef, type ReactNode } from 'react';
import { Meter as BaseMeter } from '@base-ui/react/meter';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';

export interface MeterProps extends BaseMeter.Root.Props {
  /** Visible label above the bar, e.g. "Storage". */
  label?: ReactNode;
  /**
   * Show the formatted value next to the label.
   * @default true
   */
  showValue?: boolean;
  /**
   * Colour of the filled part. Use `warning`/`destructive` as the value nears a limit.
   * @default 'primary'
   */
  tone?: 'primary' | 'success' | 'warning' | 'destructive';
}

const toneClass = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
} as const;

/**
 * A measurement within a known range, e.g. storage used or seats taken. For task progress,
 * use `Progress`.
 *
 * @example
 * <Meter value={72} label="Storage" format={{ style: 'percent' }} tone={72 > 90 ? 'destructive' : 'primary'} />
 */
export const Meter = forwardRef<HTMLDivElement, MeterProps>(function Meter(
  { className, label, showValue = true, tone = 'primary', ...props },
  ref,
) {
  return (
    <BaseMeter.Root
      ref={ref}
      data-slot="meter"
      className={mergeClassName(
        'grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2',
        className,
      )}
      {...props}
    >
      {label && (
        <BaseMeter.Label className="text-sm font-medium text-foreground">
          {label}
        </BaseMeter.Label>
      )}
      {showValue && (
        <BaseMeter.Value className="col-start-2 text-end text-sm text-muted-foreground tabular-nums" />
      )}
      <BaseMeter.Track className="col-span-2 h-2 overflow-hidden rounded-full bg-muted">
        <BaseMeter.Indicator
          className={cn(
            'block h-full rounded-full transition-[width]',
            toneClass[tone],
          )}
        />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
});
