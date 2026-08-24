import React from 'react';
import './Skeleton.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant of the skeleton shape
   * @default 'text'
   */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /**
   * Width of the skeleton
   */
  width?: string | number;
  /**
   * Height of the skeleton
   */
  height?: string | number;
  /**
   * Animation type
   * @default 'wave'
   */
  animation?: 'wave' | 'pulse' | 'none';
  /**
   * If true, disables animation based on user's motion preference
   * @default true
   */
  respectMotionPreference?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton - Loading placeholder component
 *
 * Base skeleton component for creating loading placeholders
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width="200px" />
 * <Skeleton variant="circular" width={40} height={40} />
 * ```
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      animation = 'wave',
      respectMotionPreference = true,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const skeletonClasses = [
      'lxs-skeleton',
      `lxs-skeleton--${variant}`,
      animation !== 'none' && `lxs-skeleton--${animation}`,
      respectMotionPreference && 'lxs-skeleton--respect-motion',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const skeletonStyle: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={skeletonClasses}
        style={skeletonStyle}
        aria-busy="true"
        aria-live="polite"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export default Skeleton;
export { Skeleton };
