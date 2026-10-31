'use client';

import { forwardRef, useMemo } from 'react';
import { useId } from '../lib/use-id';
import {
  Area,
  AreaChart as RAreaChart,
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartFrame,
  ChartLegend,
  ChartTooltipContent,
  axisProps,
  defaultValueFormatter,
  gridProps,
  resolveChartColor,
  useHiddenSeries,
  type ChartSeries,
} from './chart-utils';

/** Props shared by `BarChart`, `LineChart` and `AreaChart`. */
export interface CartesianChartProps {
  /** Accessible name, e.g. "Headcount by month". Also the caption of the hidden data table. */
  'aria-label': string;
  /** One object per category (x-axis point), e.g. `{ month: 'Jan', total: 248, male: 140 }`. */
  data: Record<string, unknown>[];
  /** Field holding the category label, e.g. `'month'`. */
  categoryKey: string;
  /** The series to draw. */
  series: ChartSeries[];
  /**
   * Plot height: px or any CSS length. The width always fills the container.
   * @default 'clamp(14rem, 32vw, 20rem)'
   */
  height?: number | string;
  /** Formats values on the axis and in the tooltip, e.g. currency. @default locale number format */
  valueFormatter?: (value: number) => string;
  /** Formats category labels on the axis and in the tooltip. */
  categoryFormatter?: (value: string) => string;
  /** Locale for the default number format. */
  locale?: string;
  /** Horizontal grid lines. @default true */
  showGrid?: boolean;
  /** Legend under the chart (click to show/hide a series). @default true when there are 2+ series */
  showLegend?: boolean;
  /** Tooltip on hover and keyboard focus. @default true */
  showTooltip?: boolean;
  /** Show the value axis. @default true */
  showValueAxis?: boolean;
  /** Width reserved for the value axis labels, in px. @default 48 */
  valueAxisWidth?: number;
  /** Allow decimal numbers on the value axis. @default false for BarChart */
  allowDecimals?: boolean;
  /** Extra classes for the `<figure>`. */
  className?: string;
}

function useChartModel(props: CartesianChartProps) {
  const {
    series,
    data,
    categoryKey,
    valueFormatter,
    locale,
    categoryFormatter,
  } = props;
  const fmt = useMemo(
    () => valueFormatter ?? defaultValueFormatter(locale),
    [valueFormatter, locale],
  );
  const colored = series.map((s, i) => ({
    ...s,
    color: resolveChartColor(s.color, i),
  }));
  const table = {
    columns: [categoryKey, ...series.map((s) => s.label)],
    rows: data.map((row) => [
      categoryFormatter
        ? categoryFormatter(String(row[categoryKey]))
        : String(row[categoryKey]),
      ...series.map((s) =>
        typeof row[s.key] === 'number'
          ? fmt(row[s.key] as number)
          : String(row[s.key] ?? ''),
      ),
    ]),
  };
  return { fmt, colored, table };
}

export interface BarChartProps extends CartesianChartProps {
  /** Stack series on top of each other instead of side by side. @default false */
  stacked?: boolean;
  /** `vertical` bars grow up; `horizontal` bars grow sideways (good for long labels). @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** Corner radius of bars, in px. @default 4 */
  radius?: number;
  /** Max bar thickness, in px. @default 28 */
  maxBarSize?: number;
}

/**
 * Bars for comparing values across categories: headcount by month, revenue by region.
 * Themed with the `chart-*` tokens, responsive, keyboard-accessible, with a hidden data table
 * for screen readers.
 *
 * @example
 * <BarChart
 *   aria-label="Headcount by month"
 *   data={rows}
 *   categoryKey="month"
 *   series={[{ key: 'total', label: 'Total' }, { key: 'male', label: 'Male' }, { key: 'female', label: 'Female' }]}
 * />
 */
export const BarChart = forwardRef<HTMLElement, BarChartProps>(
  function BarChart(props, ref) {
    const {
      data,
      categoryKey,
      height = 'clamp(14rem, 32vw, 20rem)',
      categoryFormatter,
      showGrid = true,
      showLegend,
      showTooltip = true,
      showValueAxis = true,
      valueAxisWidth = 48,
      stacked = false,
      orientation = 'vertical',
      radius = 4,
      maxBarSize = 28,
      className,
    } = props;
    const { fmt, colored, table } = useChartModel(props);
    const { hidden, toggle } = useHiddenSeries();
    const horizontal = orientation === 'horizontal';
    const legend = (showLegend ?? colored.length > 1) && (
      <ChartLegend series={colored} hidden={hidden} onToggle={toggle} />
    );

    const categoryAxis = {
      ...axisProps,
      dataKey: categoryKey,
      type: 'category' as const,
      tickFormatter: categoryFormatter,
      interval: 'preserveStartEnd' as const,
      minTickGap: 8,
    };
    const valueAxis = {
      ...axisProps,
      type: 'number' as const,
      tickFormatter: fmt,
      hide: !showValueAxis,
      allowDecimals: props.allowDecimals ?? false,
    };

    return (
      <ChartFrame
        ref={ref}
        label={props['aria-label']}
        height={height}
        legend={legend}
        table={table}
        className={className}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            accessibilityLayer
          >
            {showGrid && (
              <CartesianGrid
                {...gridProps}
                vertical={horizontal}
                horizontal={!horizontal}
              />
            )}
            {horizontal ? (
              <>
                <XAxis {...valueAxis} />
                <YAxis {...categoryAxis} width={valueAxisWidth + 24} />
              </>
            ) : (
              <>
                <XAxis {...categoryAxis} />
                <YAxis {...valueAxis} width={valueAxisWidth} />
              </>
            )}
            {showTooltip && (
              <Tooltip
                cursor={{ fill: 'var(--color-muted)', opacity: 0.6 }}
                content={
                  <ChartTooltipContent
                    valueFormatter={fmt}
                    series={colored}
                    labelFormatter={
                      categoryFormatter
                        ? (l) => categoryFormatter(String(l))
                        : undefined
                    }
                  />
                }
              />
            )}
            {colored.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                hide={hidden.has(s.key)}
                stackId={stacked ? 'stack' : undefined}
                maxBarSize={maxBarSize}
                radius={
                  stacked && i < colored.length - 1
                    ? 0
                    : horizontal
                      ? [0, radius, radius, 0]
                      : [radius, radius, 0, 0]
                }
                isAnimationActive={false}
              />
            ))}
          </RBarChart>
        </ResponsiveContainer>
      </ChartFrame>
    );
  },
);

export interface LineChartProps extends CartesianChartProps {
  /** Line shape. @default 'monotone' */
  curve?: 'monotone' | 'linear' | 'step';
  /** Show a dot at each data point. @default false */
  showDots?: boolean;
}

/**
 * Lines for trends over time: revenue per day, sign-ups per week.
 *
 * @example
 * <LineChart aria-label="Revenue, last 30 days" data={rows} categoryKey="date" series={[{ key: 'revenue', label: 'Revenue' }]} valueFormatter={money} />
 */
export const LineChart = forwardRef<HTMLElement, LineChartProps>(
  function LineChart(props, ref) {
    const {
      data,
      categoryKey,
      height = 'clamp(14rem, 32vw, 20rem)',
      categoryFormatter,
      showGrid = true,
      showLegend,
      showTooltip = true,
      showValueAxis = true,
      valueAxisWidth = 48,
      curve = 'monotone',
      showDots = false,
      className,
    } = props;
    const { fmt, colored, table } = useChartModel(props);
    const { hidden, toggle } = useHiddenSeries();
    const legend = (showLegend ?? colored.length > 1) && (
      <ChartLegend series={colored} hidden={hidden} onToggle={toggle} />
    );

    return (
      <ChartFrame
        ref={ref}
        label={props['aria-label']}
        height={height}
        legend={legend}
        table={table}
        className={className}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RLineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            accessibilityLayer
          >
            {showGrid && <CartesianGrid {...gridProps} vertical={false} />}
            <XAxis
              {...axisProps}
              dataKey={categoryKey}
              tickFormatter={categoryFormatter}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              {...axisProps}
              tickFormatter={fmt}
              hide={!showValueAxis}
              width={valueAxisWidth}
              allowDecimals={props.allowDecimals}
            />
            {showTooltip && (
              <Tooltip
                cursor={{ stroke: 'var(--color-border)' }}
                content={
                  <ChartTooltipContent
                    valueFormatter={fmt}
                    series={colored}
                    labelFormatter={
                      categoryFormatter
                        ? (l) => categoryFormatter(String(l))
                        : undefined
                    }
                  />
                }
              />
            )}
            {colored.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.label}
                type={curve}
                stroke={s.color}
                strokeWidth={2}
                dot={showDots ? { r: 3, fill: s.color, strokeWidth: 0 } : false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                hide={hidden.has(s.key)}
                isAnimationActive={false}
              />
            ))}
          </RLineChart>
        </ResponsiveContainer>
      </ChartFrame>
    );
  },
);

export interface AreaChartProps extends CartesianChartProps {
  /** Line shape. @default 'monotone' */
  curve?: 'monotone' | 'linear' | 'step';
  /** Stack series on top of each other. @default false */
  stacked?: boolean;
}

/**
 * Filled lines for volumes over time; stacked areas show how parts add up to a total.
 *
 * @example
 * <AreaChart aria-label="Tickets by channel" data={rows} categoryKey="week" series={channels} stacked />
 */
export const AreaChart = forwardRef<HTMLElement, AreaChartProps>(
  function AreaChart(props, ref) {
    const {
      data,
      categoryKey,
      height = 'clamp(14rem, 32vw, 20rem)',
      categoryFormatter,
      showGrid = true,
      showLegend,
      showTooltip = true,
      showValueAxis = true,
      valueAxisWidth = 48,
      curve = 'monotone',
      stacked = false,
      className,
    } = props;
    const { fmt, colored, table } = useChartModel(props);
    const { hidden, toggle } = useHiddenSeries();
    const gradientPrefix = `area-${useId().replace(/:/g, '')}`;
    const legend = (showLegend ?? colored.length > 1) && (
      <ChartLegend series={colored} hidden={hidden} onToggle={toggle} />
    );

    return (
      <ChartFrame
        ref={ref}
        label={props['aria-label']}
        height={height}
        legend={legend}
        table={table}
        className={className}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RAreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            accessibilityLayer
          >
            <defs>
              {colored.map((s, i) => (
                <linearGradient
                  key={s.key}
                  id={`${gradientPrefix}-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {showGrid && <CartesianGrid {...gridProps} vertical={false} />}
            <XAxis
              {...axisProps}
              dataKey={categoryKey}
              tickFormatter={categoryFormatter}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              {...axisProps}
              tickFormatter={fmt}
              hide={!showValueAxis}
              width={valueAxisWidth}
              allowDecimals={props.allowDecimals}
            />
            {showTooltip && (
              <Tooltip
                cursor={{ stroke: 'var(--color-border)' }}
                content={
                  <ChartTooltipContent
                    valueFormatter={fmt}
                    series={colored}
                    labelFormatter={
                      categoryFormatter
                        ? (l) => categoryFormatter(String(l))
                        : undefined
                    }
                  />
                }
              />
            )}
            {colored.map((s, i) => (
              <Area
                key={s.key}
                dataKey={s.key}
                name={s.label}
                type={curve}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#${gradientPrefix}-${i})`}
                stackId={stacked ? 'stack' : undefined}
                hide={hidden.has(s.key)}
                isAnimationActive={false}
              />
            ))}
          </RAreaChart>
        </ResponsiveContainer>
      </ChartFrame>
    );
  },
);
