"use client";

import React, { Children, cloneElement } from 'react';
import { Box, BoxProps } from '../Box';

export interface AvatarGroupProps extends Omit<BoxProps, 'gap'> {
  /**
   * Limit the number of avatars shown
   */
  max?: number;
  /**
   * Spacing between avatars
   * @default -8
   */
  spacing?: number | string;
  /**
   * Size to apply to all child avatars
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const AvatarGroup = React.forwardRef<HTMLElement, AvatarGroupProps>(
  (
    {
      max,
      spacing = -8,
      size,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const validChildren = Children.toArray(children).filter(React.isValidElement);
    const totalAvatars = validChildren.length;
    const showAvatars = max ? validChildren.slice(0, max) : validChildren;
    const extraAvatars = max ? totalAvatars - max : 0;

    return (
      <Box
        ref={ref}
        display="flex"
        flexDirection="row"
        alignItems="center"
        className={`lxs-avatar-group ${className}`.trim()}
        {...props}
      >
        {showAvatars.map((child, index) => {
          const isFirst = index === 0;
          const childElement = child as React.ReactElement<any>;
          return cloneElement(childElement, {
            key: `avatar-${index}`,
            size: size || childElement.props.size,
            style: {
              ...childElement.props.style,
              marginLeft: isFirst ? 0 : spacing,
              zIndex: totalAvatars - index,
              border: '2px solid var(--lxs-color-white, #ffffff)',
            },
          });
        })}
        {extraAvatars > 0 && (
          <Box
            as="span"
            className="lxs-avatar-group-extra"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="neutral"
            color="white"
            borderRadius="50%"
            style={{
              marginLeft: spacing,
              zIndex: 0,
              border: '2px solid var(--lxs-color-white, #ffffff)',
              width: size === 'xl' ? 56 : size === 'lg' ? 48 : size === 'sm' ? 24 : 32,
              height: size === 'xl' ? 56 : size === 'lg' ? 48 : size === 'sm' ? 24 : 32,
              fontSize: size === 'sm' ? 10 : 12,
              fontWeight: 500,
            }}
          >
            +{extraAvatars}
          </Box>
        )}
      </Box>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export default AvatarGroup as React.FC<AvatarGroupProps & React.RefAttributes<HTMLElement>>;
export { AvatarGroup };
