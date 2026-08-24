import { ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default' | 'primary';

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastOptions {
  /**
   * Auto close duration in milliseconds
   * Set to false to disable auto close
   * @default 5000
   */
  autoClose?: number | false;

  /**
   * Show close button
   * @default true
   */
  closeButton?: boolean;

  /**
   * Show progress bar
   * @default true
   */
  progressBar?: boolean;

  /**
   * Pause on hover
   * @default true
   */
  pauseOnHover?: boolean;

  /**
   * Pause on focus loss
   * @default true
   */
  pauseOnFocusLoss?: boolean;

  /**
   * Toast variant/type
   * @default 'default'
   */
  variant?: ToastVariant;

  /**
   * Custom icon or false to hide icon
   */
  icon?: ReactNode | false;

  /**
   * Custom action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Custom className
   */
  className?: string;

  /**
   * Custom styles
   */
  style?: React.CSSProperties;

  /**
   * Toast ID for updates/dismissal
   */
  toastId?: string | number;

  /**
   * Callback when toast is closed
   */
  onClose?: () => void;

  /**
   * Callback when toast is opened
   */
  onOpen?: () => void;

  /**
   * Rich content with title and description
   */
  title?: string;
  description?: string;

  /**
   * Animation duration in milliseconds
   * @default 300
   */
  animationDuration?: number;
}

export interface ToastProps extends ToastOptions {
  /**
   * Toast content
   */
  children: ReactNode;

  /**
   * Whether toast is visible
   */
  isVisible: boolean;

  /**
   * Function to close the toast
   */
  onDismiss: () => void;

  /**
   * Unique toast ID
   */
  id: string | number;

  /**
   * Creation timestamp
   */
  createdAt: number;
}

export interface ToastContainerProps {
  /**
   * Children components to render alongside the toast container
   */
  children?: ReactNode;

  /**
   * Container position
   * @default 'top-right'
   */
  position?: ToastPosition;

  /**
   * Maximum number of toasts to show
   * @default 5
   */
  limit?: number;

  /**
   * Gap between toasts in pixels
   * @default 12
   */
  gap?: number;

  /**
   * Container margin from viewport edge
   * @default 16
   */
  margin?: number;

  /**
   * Custom className for container
   */
  className?: string;

  /**
   * Custom styles for container
   */
  style?: React.CSSProperties;

  /**
   * Enable stacked layout for mobile
   * @default true
   */
  stacked?: boolean;

  /**
   * Custom theme
   */
  theme?: 'light' | 'dark' | 'auto';
}

export interface ToastInstance extends ToastOptions {
  id: string | number;
  content: ReactNode;
  createdAt: number;
  isVisible: boolean;
}
