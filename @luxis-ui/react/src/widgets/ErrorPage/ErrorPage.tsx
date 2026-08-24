"use client";
/* eslint-disable react/no-unused-prop-types */

import React from "react";
import { Typography } from "../../components/Typography";
import type { TypographyVariant } from "../../components/Typography";
import { Button } from "../../components/Button";
import type { ButtonProps } from "../../components/Button";
import { Link } from "../../components/Link";
import { Flex } from "../../components/Flex";
import {
  NotFoundIcon,
  ServerErrorIcon,
  ForbiddenIcon,
  SearchNotFoundIcon,
  MaintenanceIcon,
  UnauthorizedIcon,
  HomeIcon,
  RefreshIcon,
  ChevronLeftIcon,
} from "../../icons/IconComponents";
import "./ErrorPage.css";

// ─── Types ─────────────────────────────────────────────────────────────────

/** Visual layout / design style for the error page */
export type ErrorPageTheme =
  | "minimal"
  | "illustrated"
  | "full-page"
  | "split"
  | "card"
  | "embedded"
  | "modern"
  | "professional"
  | "playful"
  | "technical"
  | "elegant";

/**
 * Semantic color variant — resolves directly to ThemeProvider color tokens.
 */
export type ErrorPageVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

/** Light / dark surface mode */
export type ErrorPageMode = "light" | "dark";

/**
 * Fine-grained typography overrides for individual text elements.
 */
export interface ErrorPageAppearance {
  /** Typography variant for the status code (default: 'h1') */
  statusCodeVariant?: TypographyVariant;
  /** Typography variant for the title (default: 'h3') */
  titleVariant?: TypographyVariant;
  /** Typography variant for the description text (default: 'body1') */
  descriptionVariant?: TypographyVariant;
}

export interface ErrorAction {
  /** Label for the action button */
  label: string;
  /** Click handler (optional if href is provided) */
  onClick?: () => void;
  /** Link href, renders a link wrapper if provided */
  href?: string;
  /** External link flag, used when href is provided */
  external?: boolean;
  /** Optional icon name ('home', 'back', 'refresh') or React element */
  icon?: "home" | "back" | "refresh" | React.ReactNode;
  /** Button visual variant */
  variant?: ButtonProps["variant"];
  /** Additional button props */
  props?: Omit<ButtonProps, "onClick" | "children" | "variant">;
}

export interface ErrorPageProps {
  /** The error status code (e.g., 404, 500, "search") */
  statusCode?: string | number;
  /** Primary error heading (falls back to defaults if statusCode matches known errors) */
  title?: string;
  /** Detailed error message or description */
  description?: string;
  /** Secondary suggestion text shown below description */
  suggestion?: string;
  /** Info block at the bottom of the content */
  additionalInfo?: React.ReactNode;
  /** Optional icon rendered inside the component */
  icon?: React.ReactNode;
  /** Optional larger illustration (image or SVG) */
  illustration?: React.ReactNode;
  /** Flag to show illustration/icon, default: true */
  showIllustration?: boolean;
  /** Array of actions (buttons) to display */
  actions?: ErrorAction[];
  /** Flag to center content, default: true */
  centered?: boolean;
  /** Flag to make layout full-height, default: false */
  fullHeight?: boolean;
  /**
   * Visual design layout
   * @default "minimal"
   */
  theme?: ErrorPageTheme;
  /**
   * Semantic color variant
   * @default "error"
   */
  variant?: ErrorPageVariant;
  /**
   * Text color override — applied to all text elements as an inline CSS color.
   */
  color?: string;
  /**
   * Light / dark surface mode
   * @default "light"
   */
  mode?: ErrorPageMode;
  /**
   * Advanced per-element typography controls.
   */
  appearance?: ErrorPageAppearance;
  /**
   * Raw CSS color escape hatch — overrides the primary accent color.
   */
  accentColor?: string;
  /** Additional class names */
  className?: string;
  style?: React.CSSProperties;
}

// ─── Main Component ─────────────────────────────────────────────────────────

/**
 * ErrorPage
 *
 * A highly configurable widget to display error states (404, 500, custom errors).
 * Follows enterprise analytics widget architectural patterns.
 */
export const ErrorPage = React.forwardRef<HTMLDivElement, ErrorPageProps>(
  (
    {
      statusCode = "404",
      title,
      description,
      suggestion,
      additionalInfo,
      icon,
      illustration,
      showIllustration = true,
      actions,
      centered = true,
      fullHeight = false,
      theme = "minimal",
      variant = "error",
      color,
      mode = "light",
      appearance,
      accentColor,
      className,
      style,
    },
    ref
  ) => {
    // Default content based on error code
    const getDefaultContent = () => {
      const defaults: Record<
        string,
        { title: string; description: string; suggestion?: string; icon: React.ReactNode }
      > = {
        "404": {
          title: "Page Not Found",
          description: "Oops! The page you're looking for doesn't exist.",
          suggestion: "The page might have been moved or deleted. Try checking the URL or return to the homepage.",
          icon: <NotFoundIcon size={120} />,
        },
        "500": {
          title: "Internal Server Error",
          description: "Something went wrong on our end.",
          suggestion: "We're working to fix the issue. Please try again later or contact support if the problem persists.",
          icon: <ServerErrorIcon size={120} />,
        },
        "403": {
          title: "Access Forbidden",
          description: "You don't have permission to access this resource.",
          suggestion: "Please contact your administrator if you believe you should have access.",
          icon: <ForbiddenIcon size={120} />,
        },
        "401": {
          title: "Unauthorized",
          description: "You need to be logged in to access this page.",
          suggestion: "Please sign in to continue or contact support if you need help.",
          icon: <UnauthorizedIcon size={120} />,
        },
        "503": {
          title: "Service Unavailable",
          description: "We're currently under maintenance.",
          suggestion: "We'll be back shortly. Thank you for your patience.",
          icon: <MaintenanceIcon size={120} />,
        },
        "search": {
          title: "No Results Found",
          description: "We couldn't find what you're looking for.",
          suggestion: "Try adjusting your search terms or browse our categories.",
          icon: <SearchNotFoundIcon size={120} />,
        },
      };

      return defaults[String(statusCode)] || defaults["404"];
    };

    const defaultContent = getDefaultContent();
    const displayTitle = title || defaultContent.title;
    const displayDescription = description || defaultContent.description;
    const displaySuggestion = suggestion || defaultContent.suggestion;
    const displayIcon = icon || defaultContent.icon;

    // Build composite class names
    const classes = [
      "lxs-error-page",
      `lxs-error-page--theme-${theme}`,
      `lxs-error-page--variant-${variant}`,
      `lxs-error-page--mode-${mode}`,
      !centered && "lxs-error-page--left",
      fullHeight && "lxs-error-page--full-height",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Resolve inline CSS variables for custom colors
    const customStyles: React.CSSProperties = { ...style };
    if (accentColor) {
      (customStyles as any)["--ep-accent"] = accentColor;
    }
    if (color) {
      (customStyles as any)["--ep-text-primary"] = color;
    }

    const getIcon = (iconProp?: ErrorAction["icon"]) => {
      const iconSize = 18;
      if (iconProp === "home") return <HomeIcon size={iconSize} />;
      if (iconProp === "back") return <ChevronLeftIcon size={iconSize} />;
      if (iconProp === "refresh") return <RefreshIcon size={iconSize} />;
      return iconProp as React.ReactNode;
    };

    const getButtonVariant = (actionVariant?: ButtonProps["variant"], index: number = 0) => {
      if (theme === "technical") return actionVariant === "primary" ? "success" : "ghost";
      if (theme === "elegant") return actionVariant === "primary" ? "primary" : "ghost";
      return actionVariant || (index === 0 ? "primary" : "outline");
    };

    const renderContent = () => (
      <Flex direction="column" align={centered ? "center" : "start"} className="lxs-error-page__content" style={color ? { color } : undefined}>
        {showIllustration && theme !== "split" && (illustration || displayIcon) && (
          <div className={illustration ? "lxs-error-page__illustration" : "lxs-error-page__icon"} aria-hidden="true">
            {illustration || displayIcon}
          </div>
        )}

        {statusCode && (
          <Typography
            variant={appearance?.statusCodeVariant || "h1"}
            className="lxs-error-page__status-code"
            style={color ? { color } : undefined}
          >
            {statusCode}
          </Typography>
        )}

        <Typography
          variant={appearance?.titleVariant || "h2"}
          className="lxs-error-page__title"
          style={color ? { color } : undefined}
        >
          {displayTitle}
        </Typography>

        {displayDescription && (
          <Typography
            variant={appearance?.descriptionVariant || "body1"}
            className="lxs-error-page__description"
            style={color ? { color } : undefined}
          >
            {displayDescription}
          </Typography>
        )}

        {displaySuggestion && (
          <Typography
            variant="body2"
            className="lxs-error-page__suggestion"
            style={color ? { color } : undefined}
          >
            {displaySuggestion}
          </Typography>
        )}

        {actions && actions.length > 0 && (
          <Flex className="lxs-error-page__actions" gap={16} wrap="wrap" justify={centered ? "center" : "start"}>
            {actions.map((action, idx) => {
              const actionIcon = getIcon(action.icon);
              const btnVar = getButtonVariant(action.variant, idx);

              const btn = (
                <Button
                  variant={btnVar}
                  onClick={action.onClick}
                  leftIcon={actionIcon as any}
                  {...(action.props || {})}
                >
                  {action.label}
                </Button>
              );

              if (action.href) {
                return (
                  <Link key={idx} href={action.href} external={action.external} noUnderline>
                    {btn}
                  </Link>
                );
              }
              return <React.Fragment key={idx}>{btn}</React.Fragment>;
            })}
          </Flex>
        )}

        {additionalInfo && (
          <div className="lxs-error-page__info">
            <Typography variant="body2" noMargin style={color ? { color } : undefined}>
              {additionalInfo}
            </Typography>
          </div>
        )}
      </Flex>
    );

    if (theme === "split" && (illustration || showIllustration)) {
      return (
        <div className={classes} style={customStyles} ref={ref} role="alert" aria-live="assertive">
          <div className="lxs-error-page__split-content">
            {renderContent()}
          </div>
          <div className="lxs-error-page__split-illustration" aria-hidden="true">
            {illustration || displayIcon}
          </div>
        </div>
      );
    }

    return (
      <div className={classes} style={customStyles} ref={ref} role="alert" aria-live="assertive">
        {renderContent()}
      </div>
    );
  }
);

ErrorPage.displayName = "ErrorPage";
