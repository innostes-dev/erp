"use client";

import React, { useState } from 'react';
import { useThemeContext, Size } from '../../theme';
import './Alert.css';

export interface AlertProps {
  /**
   * Content of the alert (primary message, can be any ReactNode)
   */
  children?: React.ReactNode;
  /**
   * Alert title
   */
  title?: string;
  /**
   * Alert description - alternative to children for simple text
   */
  description?: string;
  /**
   * Visual variant of the alert
   * @default 'info'
   */
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  /**
   * Visual style of the alert
   * @default 'subtle'
   */
  alertStyle?: 'filled' | 'outlined' | 'subtle' | 'left-accent';
  /** Size of the alert. Defaults to theme defaultSize or 'md'. */
  size?: Size;
  /**
   * Custom icon or false to hide icon
   * If not provided, shows default icon based on variant
   */
  icon?: React.ReactNode | false;
  /**
   * If true, shows close button
   * @default false
   */
  dismissible?: boolean;
  /**
   * Callback fired when alert is dismissed
   */
  onClose?: () => void;
  /**
   * Action element (button or link) displayed on the right
   */
  action?: React.ReactNode;
  /**
   * If true, alert takes full width of container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Custom inline styles
   */
  style?: React.CSSProperties;
  /**
   * Role attribute for accessibility
   * @default 'alert'
   */
  role?: string;
}


// Import icons from shared IconComponents
import {
  CheckCircleIcon,
  ErrorIcon,
  WarningIcon,
  InfoIcon,
  NeutralIcon,
  CloseIcon
} from '../../icons/IconComponents';

const variantIconMap = {
  success: <CheckCircleIcon size={20} />,
  error: <ErrorIcon size={20} />,
  warning: <WarningIcon size={20} />,
  info: <InfoIcon size={20} />,
  neutral: <NeutralIcon size={20} />,
};

/**
 * Alert component - Displays important messages and notifications
 *
 * A flexible alert component supporting multiple variants, styles, and interactive features.
 * Can display simple messages or complex content with titles, actions, and custom icons.
 *
 * @example
 * Simple alert with children
 * ```tsx
 * <Alert variant="success">
 *   Your changes have been saved!
 * </Alert>
 * ```
 *
 * @example
 * Alert with title and description
 * ```tsx
 * <Alert
 *   variant="error"
 *   title="Error occurred"
 *   description="Unable to connect to the server."
 *   dismissible
 *   onClose={() => console.log('closed')}
 * />
 * ```
 *
 * @example
 * Alert with action button
 * ```tsx
 * <Alert
 *   variant="warning"
 *   title="Update available"
 *   style="left-accent"
 *   action={<Button size="small">Update Now</Button>}
 * >
 *   A new version is available. Update to get the latest features.
 * </Alert>
 * ```
 *
 * @example
 * Alert with custom icon
 * ```tsx
 * <Alert
 *   variant="info"
 *   icon={<CustomIcon />}
 *   title="Custom notification"
 * >
 *   This alert uses a custom icon.
 * </Alert>
 * ```
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      children,
      title,
      description,
      variant = 'info',
      alertStyle = 'subtle',
      size,
      icon,
      dismissible = false,
      onClose,
      action,
      fullWidth = false,
      className = '',
      style,
      role = 'alert',
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const alertSize = size || theme?.global?.size || 'md';
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = () => {
      setIsVisible(false);
      onClose?.();
    };

    if (!isVisible) {
      return null;
    }

    // Determine which icon to show
    const showIcon = icon !== false;
    const displayIcon = icon === undefined ? variantIconMap[variant] : icon;

    // Determine content to display
    const hasContent = children || description;

    return (
      <div
        ref={ref}
        className={`
          alert
          alert--${variant}
          alert--${alertStyle}
          alert--${alertSize}
          ${fullWidth ? 'alert--full-width' : ''}
          ${className}
        `.trim()}
        style={style}
        role={role}
        {...props}
      >
        {showIcon && <div className="alert-icon">{displayIcon}</div>}

        <div className="alert-content">
          {title && <div className="alert-title">{title}</div>}
          {hasContent && <div className="alert-message">{children ?? description}</div>}
        </div>

        {action && <div className="alert-action">{action}</div>}

        {dismissible && (
          <button
            type="button"
            className="alert-close"
            onClick={handleClose}
            aria-label="Close alert"
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert as React.FC<AlertProps & React.RefAttributes<HTMLDivElement>>;
export { Alert };