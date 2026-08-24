"use client";

import React from "react";
import { Typography } from "../../components/Typography";
import { Timeline } from "../../components/Timeline";
import type { TimelineStep } from "../../components/Timeline";
import { Card } from "../../components/Card";
import "./ActivityFeed.css";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ActivityFeedItem {
  /** Unique ID for the activity item */
  id: string | number;
  /** Primary content/title of the activity */
  title: React.ReactNode;
  /** Timestamp or relative time string (e.g. "2 hours ago") */
  time: string;
  /** Optional detailed description */
  description?: React.ReactNode;
  /** Optional icon to represent the action */
  icon?: React.ReactNode;
  /** Visual severity/color of the action */
  status?: "primary" | "success" | "warning" | "error" | "info" | "neutral";
  /** Optional click handler for the item */
  onClick?: () => void;
}

export interface ActivityFeedProps {
  /** Title of the feed widget */
  title?: React.ReactNode;
  /** Array of activity items to display */
  items: ActivityFeedItem[];
  /** Optional action to display in the header (e.g. "View All") */
  headerAction?: React.ReactNode;
  /** Max items to display before hiding the rest (default: show all) */
  maxItems?: number;
  /** Render inside a card container (default: true) */
  withCard?: boolean;
  /** Custom message when there are no items */
  emptyMessage?: React.ReactNode;
  /** Additional class names */
  className?: string;
  style?: React.CSSProperties;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const ActivityFeed = React.forwardRef<HTMLDivElement, ActivityFeedProps>(
  (
    {
      title,
      items,
      headerAction,
      maxItems,
      withCard = true,
      emptyMessage = "No recent activity",
      className = "",
      style,
    },
    ref
  ) => {
    const displayItems = maxItems ? items.slice(0, maxItems) : items;

    // Map ActivityFeedItems to TimelineSteps
    const steps: TimelineStep[] = displayItems.map((item) => ({
      label: "", // We handle custom rendering via description to place title & time properly
      description: (
        <div className="lxs-activity-feed__content">
          <div className="lxs-activity-feed__header-row">
            <Typography variant="body2" weight="medium" noMargin className="lxs-activity-feed__title">
              {item.title}
            </Typography>
            <Typography variant="caption" color="muted" noMargin className="lxs-activity-feed__time">
              {item.time}
            </Typography>
          </div>
          {item.description && (
            <div className="lxs-activity-feed__details">
              {typeof item.description === 'string' ? (
                <Typography variant="body2" color="muted" noMargin>
                  {item.description}
                </Typography>
              ) : (
                item.description
              )}
            </div>
          )}
        </div>
      ) as unknown as string, // Cast to bypass TimelineStep strict types, timeline renders ReactNode in description
      icon: item.icon ? (
        <span className={`lxs-activity-feed__icon lxs-activity-feed__icon--${item.status || "neutral"}`}>
          {item.icon}
        </span>
      ) : undefined,
      onClick: item.onClick,
    }));

    const content = (
      <div className={`lxs-activity-feed ${className}`} style={style} ref={ref}>
        {(title || headerAction) && (
          <div className="lxs-activity-feed__header">
            {typeof title === "string" ? (
              <Typography variant="subtitle1" weight="semibold" noMargin>
                {title}
              </Typography>
            ) : (
              title
            )}
            {headerAction && <div className="lxs-activity-feed__action">{headerAction}</div>}
          </div>
        )}

        <div className="lxs-activity-feed__body">
          {items.length > 0 ? (
            <Timeline
              steps={steps as any}
              currentStep={displayItems.length} // All steps completed to show connecting lines
              orientation="vertical"
              variant="default"
              showCheckmarks={false}
              className="lxs-activity-feed__timeline"
            />
          ) : (
            <div className="lxs-activity-feed__empty">
              <Typography variant="body2" color="muted">
                {emptyMessage}
              </Typography>
            </div>
          )}
        </div>
      </div>
    );

    if (withCard) {
      return (
        <Card className={`lxs-activity-feed-card ${className}`} style={style} ref={ref}>
          {content}
        </Card>
      );
    }

    return content;
  }
);

ActivityFeed.displayName = "ActivityFeed";

export default ActivityFeed;
