import React from 'react';

export interface WidgetProps {
  /** Data to be visualized or rendered */
  data: any;
  /** Configuration object (behavior, options, etc.) */
  config?: Record<string, any>;
  /** Appearance settings (theme, color, size, etc.) */
  appearance?: {
    theme?: 'light' | 'dark';
    color?: string;
    size?: 'sm' | 'md' | 'lg';
    [key: string]: any;
  };
  /** Layout settings (position, grid, flex, etc.) */
  layout?: {
    width?: string | number;
    height?: string | number;
    display?: 'block' | 'inline-block' | 'flex' | 'grid';
    [key: string]: any;
  };
  /** Event handlers (onClick, onChange, etc.) */
  events?: {
    onClick?: any;
    onChange?: any;
    [key: string]: (...args: any[]) => void;
  };
  /** Error state config for the widget */
  error?: {
    statusCode?: string | number;
    title?: string;
    description?: string;
    [key: string]: any;
  };
  /** Optional children for custom rendering */
  children?: React.ReactNode;
}

/**
 * Widget — flexible container for dashboard, analytics, or custom UI blocks.
 * Senior developer style: strongly typed, extensible, and composable.
 */
export const Widget: React.FC<WidgetProps> = ({
  data,
  config,
  appearance,
  layout,
  events,
  children,
}) => {
  // Merge layout and appearance into style
  const style: React.CSSProperties = {
    ...(layout || {}),
    ...(appearance?.color ? { backgroundColor: appearance.color } : {}),
  };

  return (
    <div
      className={`lxs-widget${appearance?.theme ? ' lxs-widget--' + appearance.theme : ''}`}
      style={style}
      onClick={events?.onClick}
      // Add more event bindings as needed
    >
      {/* Example: render children or fallback to data */}
      {children ? children : (
        <pre style={{ margin: 0, fontSize: 14, color: '#374151' }}>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
};

export default Widget;
