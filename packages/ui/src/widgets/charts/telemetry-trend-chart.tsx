'use client';

import { forwardRef, useState, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export interface TelemetryTrendPoint {
  label: string;
  avgLatency: number;
  p95Latency: number;
}

export interface TelemetryTrendChartProps extends ComponentProps<'div'> {
  data: readonly TelemetryTrendPoint[];
  height?: number;
  'aria-label'?: string;
}

/**
 * Pure SVG Multi-line trend chart comparing Average vs P95 response latency over time.
 * Built into @innostes/ui for enterprise telemetry observability.
 */
export const TelemetryTrendChart = forwardRef<
  HTMLDivElement,
  TelemetryTrendChartProps
>(function TelemetryTrendChart(
  {
    data,
    height = 220,
    className,
    'aria-label': ariaLabel = 'Response Time Trend chart',
    ...props
  },
  ref,
) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.avgLatency, d.p95Latency)),
    400,
  );
  const roundedMax = Math.ceil(maxVal / 400) * 400 || 1200;
  const gridTicks = [0, roundedMax * 0.33, roundedMax * 0.66, roundedMax];

  const chartHeight = 150;
  const chartWidth = 600;
  const padLeft = 45;
  const padBottom = 30;
  const padTop = 15;
  const padRight = 15;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight;

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(data.length - 1, 1)) * plotWidth;
  const getY = (val: number) =>
    padTop + plotHeight - (val / roundedMax) * plotHeight;

  // Generate smooth SVG path
  const makePath = (field: 'avgLatency' | 'p95Latency') => {
    if (data.length === 0) return '';
    return data.reduce((acc, pt, i) => {
      const x = getX(i);
      const y = getY(pt[field]);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const avgPath = makePath('avgLatency');
  const p95Path = makePath('p95Latency');

  // Area path for subtle fill under p95
  const p95Area =
    data.length > 0
      ? `${p95Path} L ${getX(data.length - 1)} ${padTop + plotHeight} L ${getX(0)} ${padTop + plotHeight} Z`
      : '';

  return (
    <div
      ref={ref}
      data-slot="telemetry-trend-chart"
      className={cn('relative w-full select-none font-sans', className)}
      aria-label={ariaLabel}
      {...props}
    >
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + padBottom + padTop}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="p95Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y-Axis Grid Lines & Tick Labels */}
        {gridTicks.map((tick) => {
          const y = padTop + plotHeight - (tick / roundedMax) * plotHeight;
          return (
            <g key={tick} className="text-muted-foreground">
              <line
                x1={padLeft}
                y1={y}
                x2={chartWidth - padRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="currentColor"
                opacity="0.7"
              >
                {Math.round(tick)} ms
              </text>
            </g>
          );
        })}

        {/* P95 Area Fill */}
        {p95Area && <path d={p95Area} fill="url(#p95Grad)" />}

        {/* P95 Line (Purple) */}
        <path
          d={p95Path}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Average Line (Blue) */}
        <path
          d={avgPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Points and Vertical Indicator */}
        {data.map((pt, i) => {
          const x = getX(i);
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible hover trigger strip */}
              <rect
                x={x - plotWidth / data.length / 2}
                y={padTop}
                width={plotWidth / data.length}
                height={plotHeight}
                fill="transparent"
              />

              {/* Vertical hover line */}
              {isHovered && (
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotHeight}
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeDasharray="2 2"
                />
              )}

              {/* Average Dot */}
              <circle
                cx={x}
                cy={getY(pt.avgLatency)}
                r={isHovered ? 5 : 3}
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all"
              />

              {/* P95 Dot */}
              <circle
                cx={x}
                cy={getY(pt.p95Latency)}
                r={isHovered ? 5 : 3}
                fill="#8b5cf6"
                stroke="#ffffff"
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all"
              />

              {/* X-Axis Label */}
              {i % 2 === 0 && (
                <text
                  x={x}
                  y={padTop + plotHeight + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-muted-foreground"
                  opacity="0.8"
                >
                  {pt.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip Popup */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="pointer-events-none absolute z-30 rounded-lg border border-border bg-popover/95 p-2 text-xs shadow-lg backdrop-blur-sm transition-all"
          style={{
            left: `${Math.min(Math.max((hoveredIndex / (data.length - 1)) * 100, 15), 85)}%`,
            top: '10px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-foreground">
            {data[hoveredIndex].label}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-blue-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Avg: {Math.round(data[hoveredIndex].avgLatency)} ms
            </span>
            <span className="flex items-center gap-1.5 text-purple-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              P95: {Math.round(data[hoveredIndex].p95Latency)} ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
