'use client';

import { forwardRef, type ReactNode } from 'react';
import { Meter as BaseMeter } from '@base-ui/react/meter';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import type { SlotClassNames } from '../../../lib/slots';

export type GaugeTone =
  'primary' | 'success' | 'warning' | 'destructive' | 'info';

export type GaugeSlot =
  'arc' | 'track' | 'indicator' | 'value' | 'label' | 'description';

export interface GaugeProps extends Omit<BaseMeter.Root.Props, 'children'> {
  /** Visible label under the gauge, e.g. "Budget used". Also its accessible name. */
  label?: ReactNode;
  /** Small text under the label, e.g. "€48k of €60k". */
  description?: ReactNode;
  /**
   * Arc colour: a tone, or a function of the value, e.g. to turn red near a limit.
   * @default 'primary'
   */
  tone?: GaugeTone | ((value: number) => GaugeTone);
  /** Width of the gauge: px or any CSS length. @default '10rem' */
  size?: number | string;
  /** Hide the number in the middle. @default false */
  hideValue?: boolean;
  /** Classes for inner parts. */
  classNames?: SlotClassNames<GaugeSlot>;
}

const toneClass: Record<GaugeTone, string> = {
  primary: 'stroke-primary',
  success: 'stroke-success',
  warning: 'stroke-warning',
  destructive: 'stroke-destructive',
  info: 'stroke-info',
};

// A 240° arc of radius 40 around (50, 50), from bottom-left to bottom-right, clockwise.
const ARC = 'M 15.36 70 A 40 40 0 1 1 84.64 70';

/**
 * A radial dial for one value in a known range, for KPI dashboards: budget used, capacity,
 * SLA compliance, quota attainment. Exposed to assistive tech as a `meter`. For a compact
 * bar, use `Meter`.
 *
 * Without `format`, or with `format={{ style: 'percent' }}`, it shows the share of the range
 * (312 of 400 → "78%"). Other formats apply to the value itself.
 *
 * @example
 * <Gauge
 *   value={82}
 *   label="Budget used"
 *   description="€49k of €60k"
 *   format={{ style: 'percent', maximumFractionDigits: 0 }}
 *   tone={(v) => (v > 90 ? 'destructive' : v > 75 ? 'warning' : 'success')}
 * />
 */
export const Gauge = forwardRef<HTMLDivElement, GaugeProps>(function Gauge(
  {
    className,
    classNames,
    label,
    description,
    tone = 'primary',
    size = '10rem',
    hideValue = false,
    value,
    min = 0,
    max = 100,
    format,
    locale,
    ...props
  },
  ref,
) {
  const span = max - min;
  const fraction =
    span > 0 ? Math.min(1, Math.max(0, (value - min) / span)) : 0;
  const resolvedTone = typeof tone === 'function' ? tone(value) : tone;
  // Base UI applies `format` to the raw value, so 82 with `style: 'percent'` would read
  // "8,200%". Percent styles format the share of the range instead.
  const formatted =
    format && format.style !== 'percent'
      ? new Intl.NumberFormat(locale, format).format(value)
      : new Intl.NumberFormat(locale, {
          style: 'percent',
          maximumFractionDigits: 0,
          ...format,
        }).format(fraction);

  return (
    <BaseMeter.Root
      ref={ref}
      aria-label={
        props['aria-label'] ??
        (typeof label === 'string' ? label : 'Gauge meter')
      }
      data-slot="gauge"
      data-tone={resolvedTone}
      value={value}
      min={min}
      max={max}
      locale={locale}
      getAriaValueText={() => formatted}
      className={mergeClassName(
        'inline-flex flex-col items-center gap-1 text-center',
        className,
      )}
      style={{ width: size }}
      {...props}
    >
      <div className="relative w-full">
        <svg
          viewBox="0 0 100 78"
          aria-hidden="true"
          data-slot="gauge-arc"
          className={cn('block w-full overflow-visible', classNames?.arc)}
        >
          <path
            d={ARC}
            fill="none"
            strokeWidth={9}
            strokeLinecap="round"
            data-slot="gauge-track"
            className={cn('stroke-muted', classNames?.track)}
          />
          {fraction > 0 && (
            <path
              d={ARC}
              fill="none"
              strokeWidth={9}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${fraction * 100} 100`}
              data-slot="gauge-indicator"
              className={cn(
                'transition-[stroke-dasharray] duration-500',
                toneClass[resolvedTone],
                classNames?.indicator,
              )}
            />
          )}
        </svg>
        {!hideValue && (
          <BaseMeter.Value
            data-slot="gauge-value"
            className={cn(
              'absolute inset-x-0 top-[42%] -translate-y-1/2 text-2xl font-bold tracking-tight tabular-nums',
              classNames?.value,
            )}
          >
            {() => formatted}
          </BaseMeter.Value>
        )}
      </div>
      {label && (
        <BaseMeter.Label
          data-slot="gauge-label"
          className={cn(
            'text-sm font-medium text-foreground',
            classNames?.label,
          )}
        >
          {label}
        </BaseMeter.Label>
      )}
      {description && (
        <span
          data-slot="gauge-description"
          className={cn(
            'text-xs text-muted-foreground',
            classNames?.description,
          )}
        >
          {description}
        </span>
      )}
    </BaseMeter.Root>
  );
});
