"use client";

import React, { useState, HTMLAttributes, ImgHTMLAttributes } from "react";
import { useThemeContext } from '../../theme/ThemeProvider';
import { UserIcon } from '../../icons/IconComponents';
import './Avatar.css';
/**
 * Avatar component - Displays user profile image, initials, or fallback
 *
 * The Avatar component supports images, fallback text, different sizes, shapes, and status indicators.
 *
 * @example
 * Basic avatar with image
 * ```tsx
 * <Avatar src="https://randomuser.me/api/portraits/men/1.jpg" alt="John Doe" />
 * ```
 *
 * @example
 * Avatar with fallback text
 * ```tsx
 * <Avatar fallback="JD" />
 * ```
 *
 * @example
 * Different sizes
 * ```tsx
 * <Avatar src="..." size="small" />
 * <Avatar src="..." size="large" />
 * ```
 *
 * @example
 * Square shape
 * ```tsx
 * <Avatar src="..." shape="square" />
 * ```
 *
 * @example
 * Status indicator
 * ```tsx
 * <Avatar
 *   src="..."
 *   statusIndicator={<span style={{ background: 'green', borderRadius: '50%', width: 12, height: 12, display: 'inline-block' }} />}
 *   statusPosition="top-right"
 * />
 * ```
 */

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  src?: string;
  alt?: string;
  /**
   * Size of the avatar
   * @default theme.global.size or 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circular' | 'rounded' | 'square';
  fallback?: string;
  onImageError?: (error: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onImageLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className' | 'onError' | 'onLoad'>;
  statusIndicator?: React.ReactNode;
  statusPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /**
   * If true, the avatar image will be eager loaded with high priority.
   * Useful when the avatar is the LCP element.
   * @default false
   */
  priority?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      size,
      shape = 'circular',
      fallback = '?',
      onImageError,
      onImageLoad,
      imgProps,
      statusIndicator,
      statusPosition = 'bottom-right',
      className = '',
      priority = false,
      ...props
    },
    ref
  ) => {
    const { theme } = useThemeContext();
    const avatarSize = size || theme.global.size || 'md';
    const [imageError, setImageError] = useState(false);

    const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setImageError(true);
      onImageError?.(event);
    };

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      onImageLoad?.(event);
    };

    const classNames = [
      'lxs-avatar',
      `lxs-avatar--${avatarSize}`,
      `lxs-avatar--${shape}`,
      statusIndicator && 'lxs-avatar--with-status',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const showImage = src && !imageError;

    let displayFallback: React.ReactNode = <UserIcon />;
    if (fallback !== '?') {
      displayFallback = fallback.slice(0, 2).toUpperCase();
    } else if (alt && alt.trim().length > 0) {
      const words = alt.trim().split(/\s+/);
      if (words.length >= 2) {
        displayFallback = (words[0][0] + words[1][0]).toUpperCase();
      } else {
        displayFallback = words[0].slice(0, 2).toUpperCase();
      }
    }

    return (
      <div
        ref={ref}
        className={classNames}
        role="img"
        aria-label={alt || fallback || 'Avatar'}
        {...props}
      >
        <span className="lxs-avatar-inner">
          {showImage ? (
            <img
              src={src}
              alt={alt}
              className="lxs-avatar-image"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              {...imgProps}
            />
          ) : (
            <span className="lxs-avatar-fallback" aria-hidden="true">
              {displayFallback}
            </span>
          )}
        </span>
        {statusIndicator && (
          <span
            className={`lxs-avatar-status lxs-avatar-status--${statusPosition}`}
            aria-label="Status indicator"
          >
            {statusIndicator}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar as React.FC<AvatarProps & React.RefAttributes<HTMLDivElement>>;
export { Avatar };
