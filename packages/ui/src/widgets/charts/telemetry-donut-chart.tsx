'use client';

import { forwardRef, useState, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export interface TelemetryDonutSlice {
  key: string;
  label: string;
  count: number;
  color: string;
}

export interface TelemetryDonutChartProps extends ComponentProps<'div'> {
  slices: readonly TelemetryDonutSlice[];
  totalValue: number | string;
  centerLabel?: string;
  size?: number;
}

/**
 * Pure SVG Donut Chart with center KPI text and color-coded HTTP status code legend.
 * Built into @innostes/ui for enterprise telemetry observability.
 */
export const TelemetryDonutChart = forwardRef<
  HTMLDivElement,
  TelemetryDonutChartProps
>(function TelemetryDonutChart(
  {
    slices,
    totalValue,
    centerLabel = 'Total Requests',
    size = 180,
    className,
    ...props
  },
  ref,
) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const totalCount = slices.reduce((acc, s) => acc + s.count, 0) || 1;

  // Calculate SVG circle strokeDasharray and offsets
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const segments = slices.map((slice) => {
    const share = slice.count / totalCount;
    const strokeLength = Math.max(
      share * circumference,
      slice.count > 0 ? 3 : 0,
    );
    const strokeDashoffset = -accumulatedAngle;
    accumulatedAngle += strokeLength;

    const pct = ((slice.count / totalCount) * 100).toFixed(1);

    return {
      ...slice,
      share,
      pct,
      strokeLength,
      strokeDashoffset,
    };
  });

  return (
    <div
      ref={ref}
      data-slot="telemetry-donut-chart"
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-6 font-sans',
        className,
      )}
      {...props}
    >
      {/* Donut SVG */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          {/* Background ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="fill-none stroke-muted/20"
            strokeWidth="20"
          />
          {/* Segment arcs */}
          {segments.map((seg) => {
            const isHovered = hoveredKey === seg.key;
            return (
              <circle
                key={seg.key}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? 24 : 20}
                strokeDasharray={`${seg.strokeLength} ${circumference}`}
                strokeDashoffset={seg.strokeDashoffset}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredKey(seg.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-bold tracking-tight text-foreground">
            {typeof totalValue === 'number'
              ? totalValue.toLocaleString()
              : totalValue}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {centerLabel}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2.5 w-full max-w-[200px]">
        {segments.map((seg) => {
          const isHovered = hoveredKey === seg.key;
          return (
            <div
              key={seg.key}
              className={cn(
                'flex items-center justify-between gap-3 text-xs rounded-md px-2 py-1 transition-colors cursor-pointer',
                isHovered ? 'bg-muted/50 font-medium' : 'hover:bg-muted/30',
              )}
              onMouseEnter={() => setHoveredKey(seg.key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-foreground font-medium">{seg.label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground tabular-nums">
                <span className="text-foreground font-semibold">
                  {seg.count.toLocaleString()}
                </span>
                <span>({seg.pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
