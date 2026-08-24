"use client";

import React from 'react';
import { Box, BoxProps } from '../Box';

export interface StackProps extends Omit<BoxProps, 'gap'> {
  /**
   * Spacing between children
   * @default 'md'
   */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
  /**
   * Direction of the stack
   * @default 'column'
   */
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  /**
   * Alignment of children along the cross axis
   * @default 'stretch'
   */
  align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  /**
   * Alignment of children along the main axis
   * @default 'flex-start'
   */
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  /**
   * Whether children should wrap
   * @default 'nowrap'
   */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  children: React.ReactNode;
}

const gapMap: Record<string, string> = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

const Stack = React.forwardRef<HTMLElement, StackProps>(
  (
    {
      gap = 'md',
      direction = 'column',
      align = 'stretch',
      justify = 'flex-start',
      wrap = 'nowrap',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const resolvedGap = typeof gap === 'string' && gapMap[gap] ? gapMap[gap] : gap;

    return (
      <Box
        ref={ref}
        display="flex"
        flexDirection={direction}
        alignItems={align}
        justifyContent={justify}
        flexWrap={wrap}
        gap={resolvedGap}
        className={`lxs-stack ${className}`.trim()}
        {...props}
      >
        {children}
      </Box>
    );
  }
);

Stack.displayName = 'Stack';

export default Stack as React.FC<StackProps & React.RefAttributes<HTMLElement>>;
export { Stack };
