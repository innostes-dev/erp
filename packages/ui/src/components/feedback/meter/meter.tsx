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
 * Base UI's native `format` applies to raw numbers; when `format={{ style: 'percent' }}`
 * is specified, `Meter` normalises `value` against `min` and `max` (like `Gauge`) so that
 * `value={72}` with max `100` renders "72%", not "7,200%".
 *
 * @example
 * <Meter value={72} label="Storage" format={{ style: 'percent' }} tone={72 > 90 ? 'destructive' : 'primary'} />
 */
export const Meter = forwardRef<HTMLDivElement, MeterProps>(function Meter(
    {
        className,
        label,
        showValue = true,
        tone = 'primary',
        value,
        min = 0,
        max = 100,
        format,
        locale,
        getAriaValueText,
        ...props
    },
    ref,
) {
    const isPercent = format?.style === 'percent';
    const span = max - min;
    const fraction =
        value != null && span > 0
            ? Math.min(1, Math.max(0, (value - min) / span))
            : 0;
    const percentOptions: Intl.NumberFormatOptions = {
        style: 'percent',
        ...(format?.maximumFractionDigits === undefined &&
            format?.minimumFractionDigits === undefined
            ? { maximumFractionDigits: 0 }
            : {}),
        ...format,
    };
    const formattedPercent =
        isPercent && value != null
            ? new Intl.NumberFormat(locale, percentOptions).format(fraction)
            : undefined;

    return (
        <BaseMeter.Root
            ref={ref}
            data-slot="meter"
            value={value}
            min={min}
            max={max}
            format={isPercent ? undefined : format}
            locale={locale}
            getAriaValueText={
                isPercent ? () => formattedPercent ?? '' : getAriaValueText
            }
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
                <BaseMeter.Value className="col-start-2 text-end text-sm text-muted-foreground tabular-nums">
                    {isPercent && formattedPercent != null
                        ? () => formattedPercent
                        : undefined}
                </BaseMeter.Value>
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
