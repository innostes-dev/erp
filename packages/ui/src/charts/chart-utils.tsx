'use client';

import { forwardRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import type { IconTileTone } from '../components/data-display/icon-tile/icon-tile';

/** A colour for a chart series: a theme tone (`chart-1` … `chart-8`, `primary`, …) or any CSS colour. */
export type ChartColor = IconTileTone | (string & {});

/** One data series (a set of bars, a line, an area). */
export interface ChartSeries {
  /** Field in each data row holding this series' value. */
  key: string;
  /** Name shown in the legend, tooltip and accessible table. */
  label: string;
  /** Colour. @default `chart-1`, `chart-2`, … in order */
  color?: ChartColor;
}

const tones = new Set([
  'primary',
  'success',
  'warning',
  'destructive',
  'info',
  'neutral',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
  'chart-7',
  'chart-8',
]);

/** Turns a `ChartColor` into a CSS colour that follows the theme (and dark mode). @internal */
export function resolveChartColor(color: ChartColor | undefined, index: number): string {
  const value = color ?? `chart-${(index % 8) + 1}`;
  if (!tones.has(value)) return value;
  return value === 'neutral' ? 'var(--color-muted-foreground)' : `var(--color-${value})`;
}

/** Default number format for chart values. @internal */
export function defaultValueFormatter(locale?: string) {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return (value: number) => nf.format(value);
}

/** Axis and grid styling shared by the cartesian charts. @internal */
export const axisProps = {
  tick: { fill: 'var(--color-muted-foreground)', fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;
export const gridProps = { stroke: 'var(--color-border)', strokeDasharray: '3 3' } as const;

/** Tracks which series are hidden through the legend. @internal */
export function useHiddenSeries() {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  return { hidden, toggle };
}

interface TooltipPayloadEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipContentProps {
  /** Set by Recharts. */
  active?: boolean;
  /** Set by Recharts. */
  payload?: TooltipPayloadEntry[];
  /** Set by Recharts. */
  label?: unknown;
  /** Formats each value. */
  valueFormatter?: (value: number) => string;
  /** Formats the heading (the category). */
  labelFormatter?: (label: unknown) => ReactNode;
  /** Series, for labels and colours. */
  series?: ChartSeries[];
  /** Hide the heading. */
  hideLabel?: boolean;
  /** Extra classes. */
  className?: string;
}

/**
 * Tooltip in the innostes UI style. Used automatically by the charts; pass it to a raw Recharts
 * `<Tooltip content={<ChartTooltipContent />} />` to style your own charts the same way.
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  valueFormatter = (v) => String(v),
  labelFormatter,
  series,
  hideLabel,
  className,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      data-slot="chart-tooltip"
      className={cn('min-w-32 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg', className)}
    >
      {!hideLabel && label !== undefined && label !== '' && (
        <div className="mb-1.5 font-medium">{labelFormatter ? labelFormatter(label) : String(label)}</div>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, i) => {
          const s = series?.find((x) => x.key === entry.dataKey);
          const value = Array.isArray(entry.value) ? entry.value.join(' – ') : entry.value;
          return (
            <div key={`${entry.dataKey ?? i}`} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-xs" style={{ background: entry.color }} />
              <span className="text-muted-foreground">{s?.label ?? entry.name}</span>
              <span className="ms-auto ps-3 font-medium tabular-nums">
                {typeof value === 'number' ? valueFormatter(value) : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface ChartLegendProps {
  /** Series to list. */
  series: { key: string; label: string; color: string; value?: ReactNode }[];
  /** Keys of hidden series (shown struck through). */
  hidden?: ReadonlySet<string>;
  /** Makes items buttons that show/hide their series. */
  onToggle?: (key: string) => void;
  /** Layout. @default 'row' */
  orientation?: 'row' | 'column';
  /** Extra classes. */
  className?: string;
}

/** Legend in the innostes UI style; items can toggle their series. */
export function ChartLegend({ series, hidden, onToggle, orientation = 'row', className }: ChartLegendProps) {
  return (
    <ul
      data-slot="chart-legend"
      className={cn(
        'flex gap-x-4 gap-y-2 text-xs',
        orientation === 'row' ? 'flex-wrap justify-center' : 'flex-col',
        className,
      )}
    >
      {series.map((s) => {
        const off = hidden?.has(s.key);
        const inner = (
          <>
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color, opacity: off ? 0.35 : 1 }} />
            <span className={cn('text-muted-foreground', off && 'line-through')}>{s.label}</span>
            {s.value !== undefined && <span className="ms-auto ps-4 font-semibold text-foreground tabular-nums">{s.value}</span>}
          </>
        );
        return (
          <li key={s.key} className={orientation === 'column' ? 'w-full' : undefined}>
            {onToggle ? (
              <button
                type="button"
                aria-pressed={!off}
                onClick={() => onToggle(s.key)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-ring"
              >
                {inner}
              </button>
            ) : (
              <span className="flex w-full items-center gap-2">{inner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface ChartFrameProps {
  /** Accessible name of the chart, e.g. "Headcount by month". */
  label: string;
  /** Height of the plot area: px or any CSS length. */
  height: number | string;
  /** The Recharts chart (rendered inside a ResponsiveContainer by the caller). */
  children: ReactNode;
  /** Legend below the plot. */
  legend?: ReactNode;
  /** Rows of the accessible data table. */
  table: { columns: string[]; rows: (string | number)[][] };
  /** Extra classes. */
  className?: string;
  /** Inline styles. */
  style?: CSSProperties;
}

/**
 * Wraps a chart in a `<figure>` with its legend and a visually hidden data table, so screen
 * readers get the numbers and not just "graphic". @internal
 */
export const ChartFrame = forwardRef<HTMLElement, ChartFrameProps>(function ChartFrame(
  { label, height, children, legend, table, className, style },
  ref,
) {
  return (
    <figure ref={ref} data-slot="chart" aria-label={label} className={cn('m-0 flex w-full min-w-0 flex-col gap-3', className)} style={style}>
      <div className="w-full min-w-0" style={{ height }}>
        {children}
      </div>
      {legend}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={j}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
});
