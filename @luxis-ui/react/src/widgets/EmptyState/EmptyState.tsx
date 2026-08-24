"use client";

import React from "react";
import { Typography } from "../../components/Typography";
import { Button } from "../../components/Button";
import { Flex } from "../../components/Flex";
import "./EmptyState.css";

// ─── Types ─────────────────────────────────────────────────────────────────

export type EmptyStateTheme = "standard" | "minimal" | "card" | "dashed";
export type EmptyStateSize = "sm" | "md" | "lg";

export interface EmptyStateAction {
  /** Text label for the button */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Button variant */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  /** Optional button icon */
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  /** Title text */
  title: string;
  /** Detailed description or instructions */
  description?: string;
  /** Main illustration or icon */
  icon?: React.ReactNode;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Visual theme layout */
  theme?: EmptyStateTheme;
  /** Overall size */
  size?: EmptyStateSize;
  /** Custom children (e.g. form fields, additional links) appended to the end */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
  style?: React.CSSProperties;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title,
      description,
      icon,
      action,
      secondaryAction,
      theme = "standard",
      size = "md",
      children,
      className = "",
      style,
    },
    ref
  ) => {
    const classes = [
      "lxs-empty-state",
      `lxs-empty-state--theme-${theme}`,
      `lxs-empty-state--size-${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={classes} style={style} ref={ref}>
        {icon && (
          <div className="lxs-empty-state__icon" aria-hidden="true">
            {icon}
          </div>
        )}

        <div className="lxs-empty-state__content">
          <Typography
            variant={size === "lg" ? "h3" : size === "sm" ? "subtitle1" : "h4"}
            className="lxs-empty-state__title"
            noMargin
          >
            {title}
          </Typography>

          {description && (
            <Typography
              variant={size === "sm" ? "body2" : "body1"}
              color="muted"
              className="lxs-empty-state__description"
              noMargin
            >
              {description}
            </Typography>
          )}
        </div>

        {(action || secondaryAction || children) && (
          <Flex gap={16} align="center" justify="center" wrap="wrap" className="lxs-empty-state__actions">
            {action && (
              <Button
                variant={action.variant || "primary"}
                onClick={action.onClick}
                leftIcon={action.icon as any}
                size={size === "sm" ? "sm" : "md"}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || "outline"}
                onClick={secondaryAction.onClick}
                leftIcon={secondaryAction.icon as any}
                size={size === "sm" ? "sm" : "md"}
              >
                {secondaryAction.label}
              </Button>
            )}
            {children}
          </Flex>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export default EmptyState;
