'use client';

import {
  forwardRef,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useRender } from '@base-ui/react/use-render';
import { mergeProps } from '@base-ui/react/merge-props';
import { cn } from '../../lib/cn';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '../../lib/icons';
import {
  IconTile,
  type IconTileTone,
} from '../../components/data-display/icon-tile/icon-tile';
import { Skeleton } from '../../components/feedback/skeleton/skeleton';
import { Sparkline } from '../sparkline/sparkline';
import { formatDelta, getSentiment, getTrend, type Trend } from './delta';

/** Layout of a `MetricCard`. */
export type MetricCardVariant =
  | 'default'
  | 'compact'
  | 'sparkline'
  | 'progress'
  | 'comparison'
  | 'split'
  | 'accent';

/** One sub-value of the `split` variant. */
export interface MetricCardItem {
  /** What it counts, e.g. "On leave". */
  label: ReactNode;
  /** The value, formatted. */
  value: ReactNode;
  /** Dot colour. */
  tone?: IconTileTone;
}

export interface MetricCardProps extends Omit<
  ComponentProps<'div'>,
  'children'
> {
  /** What is measured, e.g. "Employees". */
  label: ReactNode;
  /** The value, formatted for the user's locale, e.g. "248" or "€48,250". */
  value: ReactNode;
  /**
   * Layout. See the docs for a preview of each.
   * @default 'default'
   */
  variant?: MetricCardVariant;
  /** Icon, shown in an `IconTile`. */
  icon?: ReactNode;
  /** Colour of the icon tile (and the accent bar for `accent`). @default 'primary' */
  tone?: IconTileTone;
  /** Where the icon goes. @default 'start' */
  iconPlacement?: 'start' | 'end';
  /**
   * Change vs the previous period. A number is a fraction (`0.12` → "+12%"); a string is shown
   * as is ("+3 people") and its sign sets the arrow.
   */
  delta?: number | string;
  /** Override the trend arrow. @default inferred from `delta` */
  trend?: Trend;
  /**
   * Whether "up" is good. `false` for churn, costs, response times: an increase shows red.
   * @default true
   */
  upIsGood?: boolean;
  /** `Intl.NumberFormat` options for a numeric `delta`. @default percent with sign, 1 decimal */
  deltaFormat?: Intl.NumberFormatOptions;
  /** Text after the delta, e.g. "vs last month". */
  comparison?: ReactNode;
  /** Locale for number formatting. @default the browser's locale */
  locale?: string;
  /** Values for the `sparkline` variant, oldest first. */
  sparkline?: readonly number[];
  /** Progress towards a target, from 0 to 1, for the `progress` variant. */
  progress?: number;
  /** Text under the progress bar, e.g. "of €60,000 target". */
  target?: ReactNode;
  /** Previous period for the `comparison` variant. */
  previous?: { label: ReactNode; value: ReactNode };
  /** Sub-values for the `split` variant. */
  items?: readonly MetricCardItem[];
  /** Control at the top end, e.g. a `DropdownMenu`. Not available when the card is a link. */
  action?: ReactNode;
  /** Small content at the bottom, e.g. a "View report" link. */
  footer?: ReactNode;
  /** Show a skeleton instead of the value. */
  loading?: boolean;
  /**
   * Make the whole card a link or button, e.g. `render={<a href="/employees" />}` or your router's
   * `<Link>`. Adds hover and focus styles.
   */
  render?: ReactElement;
}

const dotTone: Record<IconTileTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground',
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
  'chart-6': 'bg-chart-6',
  'chart-7': 'bg-chart-7',
  'chart-8': 'bg-chart-8',
};

// Written out in full so Tailwind can find every class.
const accentBar: Record<IconTileTone, string> = {
  primary: 'before:bg-primary',
  success: 'before:bg-success',
  warning: 'before:bg-warning',
  destructive: 'before:bg-destructive',
  info: 'before:bg-info',
  neutral: 'before:bg-muted-foreground',
  'chart-1': 'before:bg-chart-1',
  'chart-2': 'before:bg-chart-2',
  'chart-3': 'before:bg-chart-3',
  'chart-4': 'before:bg-chart-4',
  'chart-5': 'before:bg-chart-5',
  'chart-6': 'before:bg-chart-6',
  'chart-7': 'before:bg-chart-7',
  'chart-8': 'before:bg-chart-8',
};

/** The coloured "↑ 12%" part of a metric. Exported for use in tables and lists. */
export function MetricDelta({
  delta,
  trend: trendProp,
  upIsGood = true,
  format,
  locale,
  className,
}: {
  delta: number | string;
  trend?: Trend;
  upIsGood?: boolean;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  className?: string;
}) {
  const trend = trendProp ?? getTrend(delta);
  const sentiment = getSentiment(trend, upIsGood);
  const Arrow =
    trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : MinusIcon;
  const spoken =
    trend === 'up' ? 'Up' : trend === 'down' ? 'Down' : 'No change';
  return (
    <span
      data-slot="metric-delta"
      data-sentiment={sentiment}
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        sentiment === 'positive' && 'text-success',
        sentiment === 'negative' && 'text-destructive',
        sentiment === 'neutral' && 'text-muted-foreground',
        className,
      )}
    >
      <Arrow className="size-3" strokeWidth={2.5} />
      <span className="sr-only">{spoken}</span>
      {formatDelta(delta, locale, format)}
    </span>
  );
}

/**
 * A KPI card for dashboards, with seven layouts so dashboards don't all look the same:
 *
 * - `default`: icon tile, label, big value, trend and comparison.
 * - `compact`: one dense row, for many metrics in little space.
 * - `sparkline`: value with a small trend chart.
 * - `progress`: value against a target, with a progress bar.
 * - `comparison`: this period next to the previous one.
 * - `split`: one card with several related sub-values.
 * - `accent`: like `default`, with a coloured top bar to highlight the key metric.
 *
 * @example
 * <MetricCard label="Employees" value="248" icon={<UsersIcon />} delta={0.12} comparison="vs last month" />
 * <MetricCard variant="sparkline" label="Revenue" value="€48,250" delta={0.125} sparkline={revenueByDay} />
 * <MetricCard variant="progress" label="Quarterly target" value="€48,250" progress={0.8} target="of €60,000" />
 */
export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  function MetricCard(
    {
      label,
      value,
      variant = 'default',
      icon,
      tone = 'primary',
      iconPlacement = 'start',
      delta,
      trend,
      upIsGood = true,
      deltaFormat,
      comparison,
      locale,
      sparkline,
      progress,
      target,
      previous,
      items,
      action,
      footer,
      loading = false,
      render,
      className,
      ...props
    },
    ref,
  ) {
    const deltaNode =
      delta !== undefined ? (
        <MetricDelta
          delta={delta}
          trend={trend}
          upIsGood={upIsGood}
          format={deltaFormat}
          locale={locale}
        />
      ) : null;
    const deltaLine = (deltaNode || comparison) && (
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
        {deltaNode}
        {comparison && (
          <span className="text-muted-foreground">{comparison}</span>
        )}
      </div>
    );
    const valueNode = loading ? (
      <Skeleton className="h-7 w-24" />
    ) : (
      <div
        className={cn(
          'font-semibold tracking-tight tabular-nums',
          variant === 'compact' ? 'text-xl' : 'text-2xl',
        )}
      >
        {value}
      </div>
    );
    const labelNode = (
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
    );
    const tile = icon && (
      <IconTile tone={tone} size={variant === 'compact' ? 'sm' : 'md'}>
        {icon}
      </IconTile>
    );

    let content: ReactNode;
    switch (variant) {
      case 'compact':
        content = (
          <div className="flex items-center gap-3">
            {tile}
            <div className="flex min-w-0 flex-1 flex-col">
              {labelNode}
              {valueNode}
            </div>
            {deltaNode}
          </div>
        );
        break;
      case 'sparkline':
        content = (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                {labelNode}
                {valueNode}
                {deltaLine}
              </div>
              {tile}
            </div>
            {sparkline && sparkline.length > 1 && !loading && (
              <Sparkline
                data={sparkline}
                tone={
                  getSentiment(trend ?? getTrend(delta), upIsGood) ===
                  'negative'
                    ? 'destructive'
                    : tone
                }
                height={44}
              />
            )}
          </div>
        );
        break;
      case 'progress': {
        const pct = Math.max(0, Math.min(1, progress ?? 0));
        content = (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                {labelNode}
                {valueNode}
              </div>
              {tile}
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct * 100)}
              aria-label={typeof label === 'string' ? label : undefined}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-[width]',
                  dotTone[tone],
                )}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{target}</span>
              <span className="font-medium text-foreground tabular-nums">
                {new Intl.NumberFormat(locale, {
                  style: 'percent',
                  maximumFractionDigits: 0,
                }).format(pct)}
              </span>
            </div>
          </div>
        );
        break;
      }
      case 'comparison':
        content = (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              {labelNode}
              {deltaNode}
            </div>
            <div className="grid grid-cols-2 divide-x divide-border rtl:divide-x-reverse">
              <div className="flex flex-col gap-0.5 pe-4">
                {valueNode}
                <span className="text-xs text-muted-foreground">
                  {comparison ?? 'This period'}
                </span>
              </div>
              {previous && (
                <div className="flex flex-col gap-0.5 ps-4">
                  <div className="text-2xl font-semibold tracking-tight text-muted-foreground tabular-nums">
                    {previous.value}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {previous.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
        break;
      case 'split':
        content = (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                {labelNode}
                {valueNode}
                {deltaLine}
              </div>
              {tile}
            </div>
            {items && items.length > 0 && (
              <dl className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-3 border-t border-border pt-3">
                {items.map((item, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'size-2 rounded-full',
                          dotTone[item.tone ?? 'neutral'],
                        )}
                      />
                      {item.label}
                    </dt>
                    <dd className="text-base font-semibold tabular-nums">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        );
        break;
      default:
        // default and accent
        content = (
          <div
            className={cn(
              'flex gap-4',
              iconPlacement === 'end' && 'flex-row-reverse justify-between',
            )}
          >
            {tile}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {labelNode}
              {valueNode}
              {deltaLine}
            </div>
          </div>
        );
    }

    const interactive = !!render;
    const element = useRender({
      defaultTagName: 'div',
      render,
      ref,
      props: mergeProps<'div'>(
        {
          className: cn(
            'relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-5 text-start text-card-foreground shadow-xs',
            variant === 'compact' && 'p-4',
            variant === 'accent' &&
              cn(
                'pt-6 before:absolute before:inset-x-0 before:top-0 before:h-1',
                accentBar[tone],
              ),
            interactive &&
              'cursor-pointer transition-[border-color,box-shadow] outline-none hover:border-ring/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            className,
          ),
          'aria-busy': loading || undefined,
          children: (
            <>
              {action && !interactive && (
                <div className="absolute end-3 top-3">{action}</div>
              )}
              {content}
              {footer && (
                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                  {footer}
                </div>
              )}
            </>
          ),
        } as ComponentProps<'div'>,
        {
          'data-slot': 'metric-card',
          'data-variant': variant,
          ...props,
        } as ComponentProps<'div'>,
      ),
    });

    return element;
  },
);

export interface MetricGridProps extends ComponentProps<'div'> {
  /**
   * Smallest card width before the grid wraps to fewer columns.
   * @default '14rem'
   */
  minCardWidth?: string;
}

/**
 * Lays out metric cards in as many equal columns as fit, wrapping on smaller screens.
 *
 * @example
 * <MetricGrid>
 *   <MetricCard … />
 *   <MetricCard … />
 * </MetricGrid>
 */
export const MetricGrid = forwardRef<HTMLDivElement, MetricGridProps>(
  function MetricGrid(
    { className, minCardWidth = '14rem', style, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-slot="metric-grid"
        style={{ ['--metric-min' as string]: minCardWidth, ...style }}
        className={cn(
          'grid grid-cols-[repeat(auto-fit,minmax(min(100%,var(--metric-min)),1fr))] gap-4',
          className,
        )}
        {...props}
      />
    );
  },
);
