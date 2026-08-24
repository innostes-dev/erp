import React from 'react';
import './Timeline.css';
import { Typography } from '../Typography';

export interface TimelineStep {
  /** Label for the step */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional custom icon */
  icon?: React.ReactNode;
  /** Optional click handler */
  onClick?: () => void;
}

export interface TimelineProps {
  /** Array of timeline steps */
  steps: TimelineStep[] | string[];
  /** Current active step index (0-based) */
  currentStep: number;
  /** Orientation of the timeline */
  orientation?: 'horizontal' | 'vertical';
  /** Visual variant */
  variant?: 'default' | 'circle' | 'numbered' | 'simple';
  /** Show checkmarks on completed steps */
  showCheckmarks?: boolean;
  /** Color scheme for active/completed steps */
  color?: 'primary' | 'success' | 'info' | 'warning' | 'error';
  /** Size of the timeline */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

const Timeline: React.FC<TimelineProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  variant = 'default',
  showCheckmarks = true,
  color = 'success',
  size = 'md',
  className = '',
  style,
}) => {
  // Normalize steps to TimelineStep objects
  const normalizedSteps: TimelineStep[] = steps.map((step) =>
    typeof step === 'string' ? { label: step } : step
  );

  const getStepStatus = (index: number): 'completed' | 'active' | 'pending' => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  const renderStepIcon = (step: TimelineStep, index: number, status: string) => {
    // Custom icon takes precedence
    if (step.icon) {
      return <span className="timeline-step-custom-icon">{step.icon}</span>;
    }

    // Show checkmark for completed steps
    if (status === 'completed' && showCheckmarks) {
      return (
        <svg
          className="timeline-step-checkmark"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    // Numbered variant shows numbers
    if (variant === 'numbered') {
      return <span className="timeline-step-number">{index + 1}</span>;
    }

    // Default: show dot or empty circle
    return <span className="timeline-step-dot" />;
  };

  const handleStepClick = (step: TimelineStep) => {
    if (step.onClick) {
      step.onClick();
    }
  };

  // Check if connector after a step should be filled
  const isConnectorFilled = (index: number): boolean => {
    // Connector is filled if current step is completed (next step is at least active)
    return index < currentStep;
  };

  return (
    <div
      className={`timeline timeline--${orientation} timeline--${variant} timeline--${color} timeline--${size} ${className}`}
      style={style}
    >
      {normalizedSteps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === normalizedSteps.length - 1;
        const isClickable = !!step.onClick;
        const connectorFilled = isConnectorFilled(index);

        return (
          <div
            key={index}
            className={`timeline-step timeline-step--${status} ${
              isClickable ? 'timeline-step--clickable' : ''
            }`}
            onClick={() => handleStepClick(step)}
          >
            {/* Step Indicator */}
            <div className="timeline-step-indicator">
              {/* Step Icon/Circle */}
              <div className="timeline-step-icon-wrapper">
                {renderStepIcon(step, index, status)}
              </div>
            </div>

            {/* Connector Line (after) */}
            {!isLast && (
              <div
                className={`timeline-connector ${
                  connectorFilled ? 'timeline-connector--filled' : ''
                }`}
              />
            )}

            {/* Step Content */}
            <div className="timeline-step-content">
              <Typography
                variant="body2"
                weight={status === 'active' ? 'semibold' : 'medium'}
                noMargin
                className="timeline-step-label"
              >
                {step.label}
              </Typography>
              {step.description && (
                <Typography variant="caption" noMargin className="timeline-step-description">
                  {step.description}
                </Typography>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

Timeline.displayName = 'Timeline';

export default Timeline as React.FC<TimelineProps & React.RefAttributes<HTMLDivElement>>;
export { Timeline };
