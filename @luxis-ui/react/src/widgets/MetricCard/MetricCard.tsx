"use client";
/* eslint-disable react/no-unused-prop-types */

import React from "react";
import { Typography } from "../../components/Typography";
import type { TypographyVariant } from "../../components/Typography";
import "./MetricCard.css";

// ─── Types ─────────────────────────────────────────────────────────────────

/** Visual layout / design style for the card */
export type MetricCardTheme =
  | "minimal"
  | "modern"
  | "glass"
  | "gradient"
  | "filled"
  | "inline"
  | "centered"
  | "surface"
  | "enterprise"
  | "compact"
  | "trend";

/**
 * Semantic color variant — resolves directly to ThemeProvider color tokens:
 *   primary → --lxs-color-primary-{50|500|700}
 *   secondary → --lxs-color-secondary-{50|500|700}
 *   … etc.
 * Use `accentColor` for a one-off raw CSS color override.
 */
export type MetricCardVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";

/** Light / dark surface mode */
export type MetricCardMode = "light" | "dark";

export type MetricCardTrend = "up" | "down" | "neutral";

/**
 * Fine-grained typography overrides for individual text elements.
 * Falls back to sensible typography scale defaults when not specified.
 */
export interface MetricCardAppearance {
  /** Typography variant for the title label (default: 'overline') */
  titleVariant?: TypographyVariant;
  /** Typography variant for the primary metric value (default: 'h3') */
  valueVariant?: TypographyVariant;
  /** Typography variant for the description text (default: 'caption') */
  descriptionVariant?: TypographyVariant;
}

export interface MetricCardProps {
  /** Metric label displayed above the value */
  title: string;
  /** Primary numeric or string metric value */
  value: string | number;
  /** Percentage change value (e.g. 12.5 for +12.5%) */
  change?: number;
  /** Direction of the change for visual indicator */
  trend?: MetricCardTrend;
  /** Optional icon rendered inside the card */
  icon?: React.ReactNode;
  /** Supporting description or comparison text */
  description?: string;
  /**
   * Visual design layout
   * @default "modern"
   */
  theme?: MetricCardTheme;
  /**
   * Semantic color variant — pulls the full shade scale from ThemeProvider
   * (variant-50 for backgrounds, variant-500 for accent, variant-700 for hover/dark).
   * @default "primary"
   */
  variant?: MetricCardVariant;
  /**
   * Text color override — applied to all text elements as an inline CSS color.
   * Accepts any valid CSS color value.
   */
  color?: string;
  /**
   * Light / dark surface mode
   * @default "light"
   */
  mode?: MetricCardMode;
  /**
   * Advanced per-element typography controls.
   * Use `appearance.titleVariant`, `appearance.valueVariant`, or
   * `appearance.descriptionVariant` to select from the design system scale.
   */
  appearance?: MetricCardAppearance;
  /**
   * Raw CSS color escape hatch — overrides `--mc-accent` directly.
   * Use when you need a one-off accent that is not in the theme palette.
   * Prefer the `variant` prop whenever a theme color suffices.
   */
  accentColor?: string;
  /** Shows skeleton loading state when true
   * @default false
   */
  loading?: boolean;
  /** Additional class names */
  className?: string;
  style?: React.CSSProperties;
}

// ─── Internal helper types ──────────────────────────────────────────────────

interface ContentProps {
  readonly title: string;
  readonly value: string | number;
  readonly change?: number;
  readonly trend: MetricCardTrend;
  readonly icon?: React.ReactNode;
  readonly description?: string;
  readonly color?: string;
  readonly appearance?: MetricCardAppearance;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TrendArrow({ trend }: Readonly<{ trend: MetricCardTrend }>) {
  if (trend === "up") {
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M5 1.5L9 8H1L5 1.5Z" fill="currentColor" />
      </svg>
    );
  }
  if (trend === "down") {
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M5 8.5L1 2H9L5 8.5Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1.5 5H8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrendBadge({
  change,
  trend,
  modifier,
  showLabel = true,
}: Readonly<{
  change: number;
  trend: MetricCardTrend;
  modifier: string;
  showLabel?: boolean;
}>) {
  const sign = change > 0 ? "+" : "";
  const formatted = `${sign}${change.toFixed(1)}%`;
  return (
    <span
      className={`mc-trend mc-trend--${trend} ${modifier}`}
      aria-label={`Change: ${formatted}`}
    >
      <TrendArrow trend={trend} />
      <span>{formatted}</span>
      {showLabel && <span className="mc-trend__label">&nbsp;vs last month</span>}
    </span>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function MetricCardSkeleton({ theme }: Readonly<{ theme: MetricCardTheme }>) {
  const isCompact = theme === "compact";
  return (
    <div
      className={`mc-skeleton mc-skeleton--${theme}`}
      aria-busy="true"
      aria-label="Loading metric"
      aria-live="polite"
    >
      {isCompact ? (
        <div className="mc-skeleton__compact-row">
          <div className="mc-skeleton__icon" />
          <div className="mc-skeleton__body">
            <div className="mc-skeleton__label" />
            <div className="mc-skeleton__value" />
          </div>
          <div className="mc-skeleton__trend" />
        </div>
      ) : (
        <>
          <div className="mc-skeleton__label" />
          <div className="mc-skeleton__value" />
          <div className="mc-skeleton__trend" />
        </>
      )}
    </div>
  );
}

// ─── Variant content renderers ──────────────────────────────────────────────

/** Minimal — typography-first, no border, maximum whitespace */
function MinimalContent({ title, value, change, trend, description, color, appearance }: ContentProps) {
  return (
    <>
      <Typography variant={appearance?.titleVariant ?? "overline"} as="p" noMargin className="mc-label mc-label--uppercase" textColor={color}>{title}</Typography>
      <Typography variant={appearance?.valueVariant ?? "h3"} as="p" noMargin className="mc-value mc-value--xl" textColor={color}>{value}</Typography>
      {change !== undefined && (
        <TrendBadge change={change} trend={trend} modifier="mc-trend--inline" showLabel />
      )}
      {description && <Typography variant={appearance?.descriptionVariant ?? "caption"} as="p" noMargin className="mc-description" textColor={color}>{description}</Typography>}
    </>
  );
}

/** Modern — icon badge, shadow card, colored trend pill */
function ModernContent({ title, value, change, trend, icon, description, color, appearance }: ContentProps) {
  return (
    <>
      <div className="mc-row mc-row--space-between mc-row--align-start">
        <Typography variant={appearance?.titleVariant ?? "overline"} as="p" noMargin className="mc-label mc-label--uppercase" textColor={color}>{title}</Typography>
        {icon && <span className="mc-icon-badge" aria-hidden="true">{icon}</span>}
      </div>
      <Typography variant={appearance?.valueVariant ?? "h3"} as="p" noMargin className="mc-value mc-value--xl" textColor={color}>{value}</Typography>
      {change !== undefined && (
        <TrendBadge change={change} trend={trend} modifier="mc-trend--pill" showLabel />
      )}
      {description && <Typography variant={appearance?.descriptionVariant ?? "caption"} as="p" noMargin className="mc-description" textColor={color}>{description}</Typography>}
    </>
  );
}

/** Glass — frosted glass surface, backdrop blur */
function GlassContent({ title, value, change, trend, icon, description, color, appearance }: ContentProps) {
  return (
    <>
      <div className="mc-row mc-row--align-center mc-row--gap-sm">
        {icon && <span className="mc-icon-glass" aria-hidden="true">{icon}</span>}
        <Typography variant={appearance?.titleVariant ?? "overline"} as="p" noMargin className="mc-label mc-label--glass" textColor={color}>{title}</Typography>
      </div>
      <Typography variant={appearance?.valueVariant ?? "h3"} as="p" noMargin className="mc-value mc-value--xl mc-value--glass" textColor={color}>{value}</Typography>
      {change !== undefined && (
        <TrendBadge change={change} trend={trend} modifier="mc-trend--glass" showLabel={false} />
      )}
      {description && <Typography variant={appearance?.descriptionVariant ?? "caption"} as="p" noMargin className="mc-description mc-description--muted" textColor={color}>{description}</Typography>}
    </>
  );
}

/** Gradient — vivid gradient background, inverted white text */
function GradientContent({ title, value, change, trend, icon, description, color, appearance }: ContentProps) {
  return (
    <>
      <div className="mc-row mc-row--space-between mc-row--align-center">
        <Typography variant={appearance?.titleVariant ?? "overline"} as="p" noMargin className="mc-label mc-label--inverted" textColor={color}>{title}</Typography>
        {icon && <span className="mc-icon-gradient" aria-hidden="true">{icon}</span>}
      </div>
      <Typography variant={appearance?.valueVariant ?? "h3"} as="p" noMargin className="mc-value mc-value--xl mc-value--inverted" textColor={color}>{value}</Typography>
      {change !== undefined && (
        <TrendBadge change={change} trend={trend} modifier="mc-trend--inverted" showLabel />
      )}
      {description && <Typography variant={appearance?.descriptionVariant ?? "caption"} as="p" noMargin className="mc-description mc-description--inverted" textColor={color}>{description}</Typography>}
    </>
  );
}

/** Filled — solid accent background, same inverted layout as gradient */
function FilledContent(props: ContentProps) {
  return <GradientContent {...props} />;
}

/** Inline — small icon flush-left beside the label, bare arrow+% trend, standard card shell */
function InlineContent({ title, value, change, trend, icon, description, color, appearance }: ContentProps) {
  return (
    <>
      <div className="mc-row mc-row--align-center mc-row--gap-sm">
        {icon && <span className="mc-icon-inline" aria-hidden="true">{icon}</span>}
        <Typography variant={appearance?.titleVariant ?? "body2"} as="p" noMargin className="mc-label" textColor={color}>{title}</Typography>
      </div>
      <Typography variant={appearance?.valueVariant ?? "h3"} as="p" noMargin className="mc-value mc-value--xl mc-value--inline" textColor={color}>{value}</Typography>
      {change !== undefined && (
        <TrendBadge change={change} trend={trend} modifier="mc-trend--inline" showLabel={false} />
      )}
      {description && <Typography variant={appearance?.descriptionVariant ?? "caption"} as="p" noMargin className="mc-description" textColor={color}>{description}</Typography>}
    </>
  );
}

/** Centered — large circular icon at top, all content center-aligned beneath */
function CenteredContent({ title, value, change, trend, icon, description, color, appearance }: ContentProps) {
  return (
    <div className="mc-centered__body">
      {icon && <div className="mc-icon-centered" aria-hidden="true">{icon}</div>}
      <Typography variant={appearance?.titleVariant ?? "body2"} as="p" noMargin className="mc-label" textColor={color}>{title}</Typography>
      <Typography variant={appearance?.valueVariant ?? "h3"} as="p" noMargin className="mc-value mc-value--xl" textColor={color}>{value}</Typography>
      {change !== undefined && (
        <TrendBadge change={change} trend={trend} modifier="mc-trend--pill" showLabel={false} />
      )}
      {description && <Typography variant={appearance?.descriptionVariant ?? "caption"} as="p" noMargin className="mc-description" textColor={color}>{description}</Typography>}
    </div>
  );
}

/** Surface — accent-tinted card background, right-side circular accent icon */
function SurfaceContent({ title, value, change, trend, icon, description, color, appearance }: ContentProps) {
  return (
    <div className="mc-surface__layout">
      <div className="mc-surface__data">
        <Typography variant={appearance?.titleVariant ?? "overline"} as="p" noMargin className="mc-label mc-label--uppercase" textColor={color}>{title}</Typography>
        <Typography variant={appearance?.valueVariant ?? "h3"} as="p" noMargin className="mc-value mc-value--xl" textColor={color}>{value}</Typography>
        {change !== undefined && (
          <TrendBadge change={change} trend={trend} modifier="mc-trend--pill" showLabel />
        )}
        {description && <Typography variant={appearance?.descriptionVariant ?? "caption"} as="p" noMargin className="mc-description" textColor={color}>{description}</Typography>}
      </div>
      {icon && <div className="mc-surface__icon" aria-hidden="true">{icon}</div>}
    </div>
  );
}

/** Enterprise — two-column data/icon layout, dense structured grid */
function EnterpriseContent({ title, value, change, trend, icon, description, color, appearance }: ContentProps) {
  return (
    <div className="mc-enterprise__grid">
      <div className="mc-enterprise__data">
        <Typography variant={appearance?.titleVariant ?? "overline"} as="p" noMargin className="mc-label mc-label--enterprise" textColor={color}>{title}</Typography>
        <Typography variant={appearance?.valueVariant ?? "h4"} as="p" noMargin className="mc-value mc-value--enterprise" textColor={color}>{value}</Typography>
        {change !== undefined && (
          <TrendBadge change={change} trend={trend} modifier="mc-trend--enterprise" showLabel />
        )}
        {description && <Typography variant={appearance?.descriptionVariant ?? "caption"} as="p" noMargin className="mc-description mc-description--enterprise" textColor={color}>{description}</Typography>}
      </div>
      {icon && (
        <div className="mc-enterprise__icon-wrap" aria-hidden="true">
          {icon}
        </div>
      )}
    </div>
  );
}

/** Compact — minimal footprint horizontal layout for dense dashboards */
function CompactContent({ title, value, change, trend, icon, color, appearance }: ContentProps) {
  return (
    <div className="mc-compact__row">
      {icon && <span className="mc-icon-compact" aria-hidden="true">{icon}</span>}
      <div className="mc-compact__body">
        <Typography variant={appearance?.titleVariant ?? "overline"} as="p" noMargin className="mc-label mc-label--compact" textColor={color}>{title}</Typography>
        <Typography variant={appearance?.valueVariant ?? "subtitle1"} as="p" noMargin className="mc-value mc-value--compact" textColor={color}>{value}</Typography>
      </div>
      {change !== undefined && (
        <TrendBadge change={change} trend={trend} modifier="mc-trend--compact" showLabel={false} />
      )}
    </div>
  );
}

/** Trend — emphasises the change/trend with a large directional indicator */
function TrendContent({ title, value, change, trend, icon, description, color, appearance }: ContentProps) {
  return (
    <>
      <div className="mc-row mc-row--space-between mc-row--align-start">
        <Typography variant={appearance?.titleVariant ?? "overline"} as="p" noMargin className="mc-label mc-label--uppercase" textColor={color}>{title}</Typography>
        {icon && <span className="mc-icon-badge" aria-hidden="true">{icon}</span>}
      </div>
      <div className="mc-trend-variant__body">
        <Typography variant={appearance?.valueVariant ?? "h3"} as="p" noMargin className="mc-value mc-value--trend" textColor={color}>{value}</Typography>
        {change !== undefined && (
          <div className={`mc-trend-variant__indicator mc-trend-variant__indicator--${trend}`}>
            <span className="mc-trend-variant__arrow">
              <TrendArrow trend={trend} />
            </span>
            <span className="mc-trend-variant__change">
              {change > 0 ? "+" : ""}{change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      {description && <Typography variant={appearance?.descriptionVariant ?? "caption"} as="p" noMargin className="mc-description" textColor={color}>{description}</Typography>}
    </>
  );
}

// ─── Theme dispatcher ────────────────────────────────────────────────────────

function ThemeContent(props: ContentProps & { theme: MetricCardTheme }) {
  switch (props.theme) {
    case "minimal":    return <MinimalContent {...props} />;
    case "glass":      return <GlassContent {...props} />;
    case "gradient":   return <GradientContent {...props} />;
    case "filled":     return <FilledContent {...props} />;
    case "inline":     return <InlineContent {...props} />;
    case "centered":   return <CenteredContent {...props} />;
    case "surface":    return <SurfaceContent {...props} />;
    case "enterprise": return <EnterpriseContent {...props} />;
    case "compact":    return <CompactContent {...props} />;
    case "trend":      return <TrendContent {...props} />;
    case "modern":
    default:           return <ModernContent {...props} />;
  }
}

// ─── MetricCard ─────────────────────────────────────────────────────────────

export const MetricCard = React.forwardRef<HTMLElement, MetricCardProps>(
  (
    {
      title,
      value,
      change,
      trend = "neutral",
      icon,
      description,
      theme = "modern",
      variant = "primary",
      color,
      mode = "light",
      appearance,
      loading = false,
      accentColor,
      className = "",
      style,
    },
    ref
  ) => {
    const classes = [
      "lxs-metric-card",
      `lxs-metric-card--theme-${theme}`,
      `lxs-metric-card--variant-${variant}`,
      mode === "dark" ? "lxs-metric-card--mode-dark" : null,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const inlineStyle: React.CSSProperties = {
      ...(accentColor ? ({ "--mc-accent": accentColor } as React.CSSProperties) : {}),
      ...style,
    };

    return (
      <section
        ref={ref}
        className={classes}
        style={inlineStyle}
        aria-label={`${title} metric`}
        aria-busy={loading}
      >
        {loading ? (
          <MetricCardSkeleton theme={theme} />
        ) : (
          <ThemeContent
            title={title}
            value={value}
            change={change}
            trend={trend}
            icon={icon}
            description={description}
            color={color}
            appearance={appearance}
            theme={theme}
          />
        )}
      </section>
    );
  }
);

MetricCard.displayName = "MetricCard";

export default MetricCard;
