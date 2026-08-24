"use client";

import React from "react";
import { Typography } from "../../components/Typography";
import { Button } from "../../components/Button";
import { Flex } from "../../components/Flex";
import { CheckIcon, MinusIcon } from "../../icons/IconComponents";
import "./PricingCard.css";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PricingFeature {
  /** Feature description text */
  name: string;
  /** Whether the feature is included, omitted (disabled), or custom (ReactNode) */
  included?: boolean;
}

export type PricingCardTheme = "standard" | "compact" | "modern";

export interface PricingCardProps {
  /** Name of the pricing tier (e.g. "Pro", "Enterprise") */
  tierName: string;
  /** Numeric price or string */
  price: number | string;
  /** Currency symbol (e.g. "$", "€") */
  currency?: string;
  /** Billing interval (e.g. "/mo", "/year") */
  interval?: string;
  /** Short description of the tier's target audience */
  description?: string;
  /** List of features included or omitted */
  features: PricingFeature[];
  /** Label for the main CTA button */
  buttonLabel: string;
  /** Click handler for the CTA */
  onButtonClick?: () => void;
  /** Highlights the card visually (e.g. "Most Popular") */
  highlight?: boolean | string;
  /** Additional top label, e.g. "Save 20%" */
  badge?: string;
  /** Theme for layout */
  theme?: PricingCardTheme;
  /** Render inside a standard card shell */
  withCard?: boolean;
  /** Additional CSS classes */
  className?: string;
  style?: React.CSSProperties;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
  (
    {
      tierName,
      price,
      currency = "$",
      interval = "/mo",
      description,
      features,
      buttonLabel,
      onButtonClick,
      highlight = false,
      badge,
      theme = "standard",
      withCard = true,
      className = "",
      style,
    },
    ref
  ) => {
    const isHighlighted = !!highlight;
    const highlightText = typeof highlight === "string" ? highlight : "Most Popular";

    const classes = [
      "lxs-pricing-card",
      `lxs-pricing-card--theme-${theme}`,
      isHighlighted ? "lxs-pricing-card--highlighted" : "",
      withCard ? "lxs-pricing-card--with-card" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={classes} style={style} ref={ref}>
        {isHighlighted && (
          <div className="lxs-pricing-card__highlight-banner">{highlightText}</div>
        )}

        <div className="lxs-pricing-card__header">
          <Flex justify="between" align="center" className="lxs-pricing-card__tier-wrap">
            <Typography variant="h4" noMargin className="lxs-pricing-card__tier">
              {tierName}
            </Typography>
            {badge && (
              <span className="lxs-pricing-card__badge">{badge}</span>
            )}
          </Flex>

          {description && (
            <Typography variant="body2" color="muted" className="lxs-pricing-card__desc" noMargin>
              {description}
            </Typography>
          )}

          <div className="lxs-pricing-card__price-wrap">
            {typeof price === "number" || /^[0-9.,]+$/.test(String(price)) ? (
              <>
                <span className="lxs-pricing-card__currency">{currency}</span>
                <Typography variant="h2" as="span" noMargin className="lxs-pricing-card__price">
                  {price}
                </Typography>
                <span className="lxs-pricing-card__interval">{interval}</span>
              </>
            ) : (
              <Typography variant="h3" as="span" noMargin className="lxs-pricing-card__price-custom">
                {price}
              </Typography>
            )}
          </div>
        </div>

        <div className="lxs-pricing-card__action-wrap">
          <Button
            variant={isHighlighted ? "primary" : "outline"}
            size={theme === "compact" ? "md" : "lg"}
            fullWidth
            onClick={onButtonClick}
            className="lxs-pricing-card__button"
          >
            {buttonLabel}
          </Button>
        </div>

        <div className="lxs-pricing-card__features">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`lxs-pricing-card__feature ${
                feature.included === false ? "lxs-pricing-card__feature--omitted" : ""
              }`}
            >
              <span className="lxs-pricing-card__feature-icon" aria-hidden="true">
                {feature.included === false ? <MinusIcon /> : <CheckIcon />}
              </span>
              <Typography variant="body2" noMargin className="lxs-pricing-card__feature-name">
                {feature.name}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PricingCard.displayName = "PricingCard";

export default PricingCard;
