'use client';

import { forwardRef, useMemo, type ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '../lib/cn';
import type { SlotClassNames } from '../lib/slots';
import {
  ChartLegend,
  ChartTooltipContent,
  defaultValueFormatter,
  resolveChartColor,
  type ChartColor,
} from './chart-utils';

/** One slice of a `DonutChart`. */
export interface DonutChartSlice {
  /** Unique key. */
  key: string;
  /** Name, e.g. "Present". */
  label: string;
  /** The value. */
  value: number;
  /** Colour. @default `chart-1`, `chart-2`, … in order */
  color?: ChartColor;
}

export type DonutChartSlot =
  'root' | 'plot' | 'center' | 'centerValue' | 'centerLabel' | 'legend';

export interface DonutChartProps {
  /** Accessible name, e.g. "Attendance today". */
  'aria-label': string;
  /** The slices. */
  data: DonutChartSlice[];
  /** Big text in the hole, e.g. "92%". */
  centerValue?: ReactNode;
  /** Small text under it, e.g. "Present today". */
  centerLabel?: ReactNode;
  /** Diameter of the chart: px or any CSS length. @default 'clamp(10rem, 28vw, 13rem)' */
  size?: number | string;
  /** Ring thickness as a share of the radius, 0–1. @default 0.22 */
  thickness?: number;
  /** Formats values in the legend and tooltip. */
  valueFormatter?: (value: number) => string;
  /** Locale for the default number format. */
  locale?: string;
  /** Show the legend with values. @default true */
  showLegend?: boolean;
  /**
   * Where the legend goes. `auto` puts it beside the chart when there's room and below it on
   * narrow containers.
   * @default 'auto'
   */
  legendPosition?: 'auto' | 'side' | 'bottom';
  /** Tooltip on hover. @default true */
  showTooltip?: boolean;
  /** Extra classes for the root. */
  className?: string;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<DonutChartSlot>;
}

/**
 * A ring chart for parts of a whole, with a value in the middle and a legend with totals:
 * attendance by status, tickets by priority, revenue by channel.
 *
 * @example
 * <DonutChart
 *   aria-label="Attendance today"
 *   centerValue="92%"
 *   centerLabel="Present today"
 *   data={[
 *     { key: 'present', label: 'Present', value: 228, color: 'success' },
 *     { key: 'leave', label: 'On leave', value: 12, color: 'neutral' },
 *     { key: 'half', label: 'Half day', value: 4, color: 'warning' },
 *     { key: 'absent', label: 'Absent', value: 4, color: 'destructive' },
 *   ]}
 * />
 */
export const DonutChart = forwardRef<HTMLElement, DonutChartProps>(
  function DonutChart(
    {
      data,
      centerValue,
      centerLabel,
      size = 'clamp(10rem, 28vw, 13rem)',
      thickness = 0.22,
      valueFormatter,
      locale,
      showLegend = true,
      legendPosition = 'auto',
      showTooltip = true,
      className,
      classNames,
      ...props
    },
    ref,
  ) {
    const fmt = useMemo(
      () => valueFormatter ?? defaultValueFormatter(locale),
      [valueFormatter, locale],
    );
    const slices = data.map((d, i) => ({
      ...d,
      fill: resolveChartColor(d.color, i),
    }));
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    const inner = `${Math.round((1 - thickness) * 100)}%`;

    return (
      <figure
        ref={ref}
        data-slot="donut-chart"
        aria-label={props['aria-label']}
        className={cn(
          '@container m-0 w-full min-w-0',
          classNames?.root,
          className,
        )}
      >
        <div
          className={cn(
            'flex flex-col items-center gap-5',
            legendPosition === 'side' && 'flex-row',
            legendPosition === 'auto' &&
              '@md:flex-row @md:justify-center @md:gap-8',
          )}
        >
          <div
            data-slot="donut-chart-plot"
            className={cn('relative aspect-square shrink-0', classNames?.plot)}
            style={{ width: size }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {showTooltip && (
                  <Tooltip
                    content={
                      <ChartTooltipContent valueFormatter={fmt} hideLabel />
                    }
                  />
                )}
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={inner}
                  outerRadius="100%"
                  paddingAngle={slices.length > 1 ? 2 : 0}
                  cornerRadius={4}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {slices.map((s) => (
                    <Cell key={s.key} fill={s.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {(centerValue || centerLabel) && (
              <div
                data-slot="donut-chart-center"
                className={cn(
                  'pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center',
                  classNames?.center,
                )}
              >
                {centerValue && (
                  <span
                    data-slot="donut-chart-center-value"
                    className={cn(
                      'text-metric font-bold tracking-tight tabular-nums',
                      classNames?.centerValue,
                    )}
                  >
                    {centerValue}
                  </span>
                )}
                {centerLabel && (
                  <span
                    data-slot="donut-chart-center-label"
                    className={cn(
                      'text-xs text-muted-foreground',
                      classNames?.centerLabel,
                    )}
                  >
                    {centerLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          {showLegend && (
            <ChartLegend
              orientation="column"
              className={cn(
                'w-full max-w-64 gap-y-3 text-sm',
                classNames?.legend,
              )}
              series={slices.map((s) => ({
                key: s.key,
                label: s.label,
                color: s.fill,
                value: fmt(s.value),
              }))}
            />
          )}
        </div>
        <table className="sr-only">
          <caption>{props['aria-label']}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Value</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((s) => (
              <tr key={s.key}>
                <th scope="row">{s.label}</th>
                <td>{fmt(s.value)}</td>
                <td>
                  {total
                    ? new Intl.NumberFormat(locale, {
                        style: 'percent',
                        maximumFractionDigits: 1,
                      }).format(s.value / total)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    );
  },
);
