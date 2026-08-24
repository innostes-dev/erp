"use client";

import React from "react";
import { Typography } from "../../components/Typography";
import { Timeline } from "../../components/Timeline";
import type { TimelineStep } from "../../components/Timeline";
import { Card } from "../../components/Card";
import "./ProcessTimeline.css";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProcessStep {
  /** The text label for this step */
  text: string;
  /** An optional React Node for the icon */
  icon?: React.ReactNode;
  /** Optional secondary text or date */
  description?: string;
}

export interface ProcessTimelineProps {
  /** Array of process steps */
  items: ProcessStep[];
  /** Current active step (0-indexed). All steps before it are completed. */
  currentStep: number;
  /** Orientation of the timeline */
  orientation?: "horizontal" | "vertical";
  /** Title for the widget */
  title?: React.ReactNode;
  /** Wraps the widget in a card if true */
  withCard?: boolean;
  /** Size of the steps/icons */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  style?: React.CSSProperties;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const ProcessTimeline = React.forwardRef<HTMLDivElement, ProcessTimelineProps>(
  (
    {
      items,
      currentStep,
      orientation = "horizontal",
      title,
      withCard = true,
      size = "md",
      className = "",
      style,
    },
    ref
  ) => {
    // Map ProcessSteps to standard TimelineSteps
    const steps: TimelineStep[] = items.map((item, index) => {
      // If we've passed the current step, show standard checkmark if no icon
      return {
        label: item.text,
        description: item.description,
        icon: item.icon ? (
          <span className="lxs-process-timeline__icon">{item.icon}</span>
        ) : undefined,
      };
    });

    const content = (
      <div className={`lxs-process-timeline lxs-process-timeline--${orientation} ${className}`} style={style} ref={ref}>
        {title && (
          <div className="lxs-process-timeline__header">
            {typeof title === "string" ? (
              <Typography variant="subtitle1" weight="semibold" noMargin>
                {title}
              </Typography>
            ) : (
              title
            )}
          </div>
        )}

        <div className="lxs-process-timeline__body">
          <Timeline
            steps={steps}
            currentStep={currentStep}
            orientation={orientation}
            variant="default"
            size={size}
            color="success" // Typically green for processing
            className="lxs-process-timeline__timeline"
          />
        </div>
      </div>
    );

    if (withCard) {
      return (
        <Card className={`lxs-process-timeline-card ${className}`} style={style} ref={ref}>
          {content}
        </Card>
      );
    }

    return content;
  }
);

ProcessTimeline.displayName = "ProcessTimeline";

export default ProcessTimeline;
