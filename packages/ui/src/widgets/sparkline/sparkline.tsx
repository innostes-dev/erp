import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';
import type { IconTileTone } from '../../components/data-display/icon-tile/icon-tile';

const toneClass: Record<IconTileTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
  neutral: 'text-muted-foreground',
  'chart-1': 'text-chart-1',
  'chart-2': 'text-chart-2',
  'chart-3': 'text-chart-3',
  'chart-4': 'text-chart-4',
  'chart-5': 'text-chart-5',
  'chart-6': 'text-chart-6',
  'chart-7': 'text-chart-7',
  'chart-8': 'text-chart-8',
};

export interface SparklineProps extends Omit<ComponentProps<'svg'>, 'values'> {
  /** The values, oldest first. Needs at least two. */
  data: readonly number[];
  /** Line colour. @default 'primary' */
  tone?: IconTileTone;
  /** Fill the area under the line with a fade. @default true */
  area?: boolean;
  /** Height in px. The width fills the container. @default 40 */
  height?: number;
  /** Line thickness in px. @default 2 */
  strokeWidth?: number;
  /**
   * Accessible description, e.g. "Revenue trend, last 12 months, rising". Without it the
   * sparkline is decorative and hidden from screen readers.
   */
  label?: string;
}

/**
 * A tiny trend line without axes, for metric cards and table cells. Pure SVG, no chart
 * library. Server-safe.
 *
 * @example
 * <Sparkline data={[12, 18, 15, 22, 28, 26, 31]} tone="success" label="Orders, last 7 days, rising" />
 */
export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(
  function Sparkline(
    {
      data,
      tone = 'primary',
      area = true,
      height = 40,
      strokeWidth = 2,
      label,
      className,
      ...props
    },
    ref,
  ) {
    const points = data.length >= 2 ? data : [0, 0];
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const pad = strokeWidth;
    const step = 100 / (points.length - 1);
    const coords = points.map(
      (v, i) =>
        [i * step, pad + (1 - (v - min) / range) * (height - pad * 2)] as const,
    );
    const line = coords
      .map(
        ([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`,
      )
      .join(' ');
    const gradientId = `spark-${tone}-${points.length}-${Math.round(min)}-${Math.round(max)}`;

    return (
      <svg
        ref={ref}
        data-slot="sparkline"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        height={height}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={cn(
          'block w-full overflow-visible',
          toneClass[tone],
          className,
        )}
        {...props}
      >
        {area && (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path
              d={`${line} L100,${height} L0,${height} Z`}
              fill={`url(#${gradientId})`}
              stroke="none"
            />
          </>
        )}
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  },
);
