'use client';

import { forwardRef, useState, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export interface TelemetryBarPoint {
  label: string;
  requests: number;
  errors: number;
}

export interface TelemetryBarChartProps extends ComponentProps<'div'> {
  data: readonly TelemetryBarPoint[];
  height?: number;
  'aria-label'?: string;
}

/**
 * Pure SVG dual-series bar chart for requests and error distribution over time.
 * Built into @innostes/ui without external charting dependencies.
 */
export const TelemetryBarChart = forwardRef<HTMLDivElement, TelemetryBarChartProps>(
  function TelemetryBarChart(
    { data, height = 220, className, 'aria-label': ariaLabel = 'Requests and Errors chart', ...props },
    ref,
  ) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const maxVal = Math.max(...data.map((d) => Math.max(d.requests, d.errors)), 100);
    // Round maxVal up to clean interval (e.g. 500, 1000)
    const roundedMax = Math.ceil(maxVal / 250) * 250 || 1000;
    const gridTicks = [0, roundedMax * 0.25, roundedMax * 0.5, roundedMax * 0.75, roundedMax];

    const chartHeight = 160;
    const chartWidth = 600;
    const padLeft = 45;
    const padBottom = 30;
    const padTop = 15;
    const padRight = 15;
    const plotWidth = chartWidth - padLeft - padRight;
    const plotHeight = chartHeight;

    const barGroupWidth = plotWidth / Math.max(data.length, 1);
    const barWidth = Math.max(barGroupWidth * 0.28, 4);

    return (
      <div
        ref={ref}
        data-slot="telemetry-bar-chart"
        className={cn('relative w-full select-none font-sans', className)}
        aria-label={ariaLabel}
        {...props}
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + padBottom + padTop}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
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
                  {tick.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((pt, i) => {
            const groupX = padLeft + i * barGroupWidth + barGroupWidth / 2;
            const reqBarHeight = Math.max((pt.requests / roundedMax) * plotHeight, 2);
            const errBarHeight = Math.max((pt.errors / roundedMax) * plotHeight, pt.errors > 0 ? 2 : 0);

            const reqX = groupX - barWidth - 1;
            const errX = groupX + 1;

            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hover backdrop pill */}
                {isHovered && (
                  <rect
                    x={groupX - barGroupWidth / 2 + 2}
                    y={padTop}
                    width={barGroupWidth - 4}
                    height={plotHeight}
                    fill="currentColor"
                    className="text-primary/5"
                    rx="4"
                  />
                )}

                {/* Request Bar (Blue) */}
                <rect
                  x={reqX}
                  y={padTop + plotHeight - reqBarHeight}
                  width={barWidth}
                  height={reqBarHeight}
                  fill="#3b82f6"
                  className={cn('transition-all duration-200', isHovered ? 'brightness-110' : 'opacity-85')}
                  rx="2"
                />

                {/* Error Bar (Red) */}
                {pt.errors > 0 && (
                  <rect
                    x={errX}
                    y={padTop + plotHeight - errBarHeight}
                    width={barWidth}
                    height={errBarHeight}
                    fill="#ef4444"
                    className={cn('transition-all duration-200', isHovered ? 'brightness-110' : 'opacity-90')}
                    rx="2"
                  />
                )}

                {/* X-Axis Label */}
                {i % 2 === 0 && (
                  <text
                    x={groupX}
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
            <div className="font-semibold text-foreground">{data[hoveredIndex].label}</div>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-blue-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Requests: {data[hoveredIndex].requests.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Errors: {data[hoveredIndex].errors.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  },
);
