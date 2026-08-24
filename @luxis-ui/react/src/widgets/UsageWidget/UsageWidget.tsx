"use client";

import React from "react";
import { Typography } from "../../components/Typography";
import { Button } from "../../components/Button";
import { Flex } from "../../components/Flex";
import "./UsageWidget.css";

// ─── Types ─────────────────────────────────────────────────────────────────

export type UsageWidgetVariant = "primary" | "warning" | "error" | "success" | "neutral";
export type UsageWidgetTheme = "modern" | "minimal" | "glass" | "bordered";

export interface UsageWidgetProps {
  /** Title of the resource (e.g. "Storage Used", "API Requests") */
  title: string;
  /** Description or subtitle */
  description?: string;
  /** Current usage value (number) */
  value: number;
  /** Maximum quota value */
  limit: number;
  /** Unit of the metric (e.g. "GB", "Calls") */
  unit?: string;
  /** Optional formatted value string (overrides default "value / limit") */
  valueLabel?: string;
  /** Label for the Call-To-Action button */
  actionLabel?: string;
  /** Handler for the CTA button */
  onActionClick?: () => void;
  /** Visual variant affecting the progress bar color */
  variant?: UsageWidgetVariant;
  /** Threshold (0-1) to automatically switch to warning state */
  warningThreshold?: number;
  /** Threshold (0-1) to automatically switch to error state */
  errorThreshold?: number;
  /** Visual style theme */
  theme?: UsageWidgetTheme;
  /** Optional icon to display next to the title */
  icon?: React.ReactNode;
  /** Additional class names */
  className?: string;
  style?: React.CSSProperties;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const UsageWidget = React.forwardRef<HTMLDivElement, UsageWidgetProps>(
  (
    {
      title,
      description,
      value,
      limit,
      unit,
      valueLabel,
      actionLabel,
      onActionClick,
      variant = "primary",
      warningThreshold = 0.8,
      errorThreshold = 0.95,
      theme = "modern",
      icon,
      className = "",
      style,
    },
    ref
  ) => {
    // Calculate percentage safely
    const rawPercentage = limit > 0 ? (value / limit) * 100 : 0;
    const percentage = Math.min(Math.max(rawPercentage, 0), 100);

    // Auto-resolve variant based on thresholds if the default is 'primary'
    let resolvedVariant = variant;
    if (variant === "primary") {
      const ratio = percentage / 100;
      if (ratio >= errorThreshold) resolvedVariant = "error";
      else if (ratio >= warningThreshold) resolvedVariant = "warning";
    }

    const classes = [
      "lxs-usage-widget",
      `lxs-usage-widget--theme-${theme}`,
      `lxs-usage-widget--variant-${resolvedVariant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const displayValue = valueLabel || `${value} / ${limit} ${unit || ""}`.trim();

    return (
      <div className={classes} style={style} ref={ref}>
        <div className="lxs-usage-widget__header">
          <Flex align="center" gap={8}>
            {icon && <span className="lxs-usage-widget__icon" aria-hidden="true">{icon}</span>}
            <div className="lxs-usage-widget__title-wrap">
              <Typography variant="subtitle1" weight="semibold" noMargin>
                {title}
              </Typography>
              {description && (
                <Typography variant="body2" color="muted" noMargin>
                  {description}
                </Typography>
              )}
            </div>
          </Flex>
          {actionLabel && (
            <Button
              variant={resolvedVariant === 'error' ? 'primary' : 'outline'}
              size="sm"
              onClick={onActionClick}
              className="lxs-usage-widget__action"
            >
              {actionLabel}
            </Button>
          )}
        </div>

        <div className="lxs-usage-widget__body">
          <Flex justify="between" align="end" className="lxs-usage-widget__meta">
            <Typography variant="h4" noMargin className="lxs-usage-widget__value">
              {displayValue}
            </Typography>
            <Typography variant="body2" weight="medium" noMargin className="lxs-usage-widget__percentage">
              {percentage.toFixed(0)}%
            </Typography>
          </Flex>

          <div
            className="lxs-usage-widget__track"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${title} usage: ${percentage.toFixed(0)}%`}
          >
            <div
              className="lxs-usage-widget__bar"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }
);

UsageWidget.displayName = "UsageWidget";

export default UsageWidget;
