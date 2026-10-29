import { forwardRef, type ComponentProps, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { ArrowDownIcon, ArrowUpIcon } from '../../../lib/icons';

export interface StatProps extends ComponentProps<'div'> {
  /** What is measured, e.g. "Revenue". */
  label: ReactNode;
  /** The formatted value, e.g. "€48,250". */
  value: ReactNode;
  /** Change versus the previous period, as a formatted string, e.g. "+12.5%". */
  delta?: ReactNode;
  /**
   * Direction of `delta`. Sets the arrow.
   * @default inferred from a leading "+" or "-" in `delta`
   */
  trend?: 'up' | 'down' | 'neutral';
  /**
   * Whether "up" is good. Set to `false` for metrics like churn or response time, so an
   * increase is shown in red.
   * @default true
   */
  upIsGood?: boolean;
  /** Small text under the value, e.g. "vs last month". */
  helper?: ReactNode;
  /** Icon in the top corner. */
  icon?: ReactNode;
}

/**
 * A KPI tile for dashboards: label, big value and an optional trend.
 *
 * @example
 * <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 *   <Stat label="Revenue" value="€48,250" delta="+12.5%" helper="vs last month" />
 *   <Stat label="Churn" value="2.1%" delta="+0.4%" upIsGood={false} />
 * </div>
 */
export const Stat = forwardRef<HTMLDivElement, StatProps>(function Stat(
  {
    className,
    label,
    value,
    delta,
    trend,
    upIsGood = true,
    helper,
    icon,
    ...props
  },
  ref,
) {
  const inferred =
    trend ??
    (typeof delta === 'string'
      ? delta.trim().startsWith('-') || delta.trim().startsWith('−')
        ? 'down'
        : delta.trim().startsWith('+')
          ? 'up'
          : 'neutral'
      : 'neutral');
  const good = inferred === 'neutral' ? null : (inferred === 'up') === upIsGood;

  return (
    <div
      ref={ref}
      data-slot="stat"
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className="text-muted-foreground [&_svg:not([class*='size-'])]:size-4">
            {icon}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {(delta || helper) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium tabular-nums',
                good === null
                  ? 'text-muted-foreground'
                  : good
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400',
              )}
            >
              {inferred === 'up' && <ArrowUpIcon className="size-3" />}
              {inferred === 'down' && <ArrowDownIcon className="size-3" />}
              {delta}
            </span>
          )}
          {helper && <span className="text-muted-foreground">{helper}</span>}
        </div>
      )}
    </div>
  );
});
