import React from 'react';
import { Box } from '../Box';

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement | HTMLDivElement> {
  /**
   * Align the content within the divider
   * Only works when children are provided
   * @default 'center'
   */
  textAlign?: 'left' | 'center' | 'right';
  /**
   * The component orientation
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * The variant to use
   * @default 'fullWidth'
   */
  variant?: 'fullWidth' | 'inset' | 'middle';
  /**
   * If true, the divider will have a lighter color
   * @default false
   */
  light?: boolean;
  /**
   * If true, the divider will be optimized for use in flex containers
   * @default false
   */
  flexItem?: boolean;
  /**
   * The content of the divider
   */
  children?: React.ReactNode;
  /**
   * The component used for the root node
   * Either a string to use a HTML element or a component
   * @default 'hr'
   */
  component?: React.ElementType;
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Divider component - A thin line that groups content in lists and layouts
 */
const Divider = React.forwardRef<HTMLHRElement | HTMLDivElement, DividerProps>(
  (
    {
      textAlign = 'center',
      orientation = 'horizontal',
      variant = 'fullWidth',
      light = false,
      flexItem = false,
      children,
      component,
      className = '',
      role,
      style, // Destructure style
      ...props
    },
    ref
  ) => {
    // Determine the component to render
    const Component = component || (children ? 'div' : orientation === 'vertical' ? 'div' : 'hr');

    // Determine the role
    const dividerRole = role || (Component !== 'hr' ? 'separator' : undefined);

    // Common styles
    const borderColor = light
        ? 'var(--lxs-divider-color-light, var(--lxs-color-neutral-100))'
        : 'var(--lxs-divider-color, var(--lxs-color-neutral-200))';

    const commonStyles: React.CSSProperties = {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      flexShrink: 0,
      borderWidth: 0,
      borderStyle: 'solid',
      borderColor: borderColor,
    };

    // Horizontal styles
    const horizontalStyles: React.CSSProperties = {
      ...commonStyles,
      width: '100%',
      borderBottomWidth: '1px',
    };

    // Vertical styles
    const verticalStyles: React.CSSProperties = {
      ...commonStyles,
      minHeight: '100%',
      alignSelf: 'stretch',
      borderBottomWidth: 0,
      borderRightWidth: '1px',
    };

    // Variant styles
    let variantStyles: React.CSSProperties = {};
    if (orientation === 'horizontal') {
        if (variant === 'inset') {
            variantStyles.marginLeft = 'var(--lxs-spacing-9)';
        } else if (variant === 'middle') {
            variantStyles.marginLeft = 'var(--lxs-spacing-3)';
            variantStyles.marginRight = 'var(--lxs-spacing-3)';
        }

        if (flexItem) {
            variantStyles.height = '1px';
            variantStyles.alignSelf = 'auto';
        }
    } else {
        if (variant === 'inset') {
            variantStyles.marginTop = 'var(--lxs-spacing-2)';
        } else if (variant === 'middle') {
            variantStyles.marginTop = 'var(--lxs-spacing-2)';
            variantStyles.marginBottom = 'var(--lxs-spacing-2)';
        }
    }

    // With children styles (overrides some previous styles)
    const withChildrenStyles: React.CSSProperties = {};
    if (children) {
        if (orientation === 'horizontal') {
             withChildrenStyles.display = 'flex';
             withChildrenStyles.whiteSpace = 'nowrap';
             withChildrenStyles.textAlign = 'center';
             withChildrenStyles.border = 0;
             withChildrenStyles.fontFamily = 'var(--lxs-font-family-sans)';
             withChildrenStyles.fontSize = 'var(--lxs-divider-text-size, var(--lxs-font-size-sm))';
             withChildrenStyles.color = light ? 'var(--lxs-divider-text-color-light, var(--lxs-color-neutral-500))' : 'var(--lxs-divider-text-color, var(--lxs-color-neutral-600))';
             withChildrenStyles.fontWeight = 'var(--lxs-divider-text-weight, var(--lxs-font-weight-medium))';
             withChildrenStyles.alignItems = 'center';
        } else {
             withChildrenStyles.display = 'flex';
             withChildrenStyles.flexDirection = 'column';
             withChildrenStyles.border = 0;
             withChildrenStyles.alignItems = 'center';
        }
    }

    const finalStyle = {
        ...(orientation === 'horizontal' ? horizontalStyles : verticalStyles),
        ...variantStyles,
        ...withChildrenStyles,
        ...style
    };

    // Additional props for vertical orientation
    const additionalProps =
      orientation === 'vertical' && Component !== 'hr'
        ? { 'aria-orientation': 'vertical' as const }
        : {};

    // Render children with lines
    const renderChildren = () => {
        if (!children) return null;

        if (orientation === 'horizontal') {
            const beforeWidth = textAlign === 'left' ? '5%' : textAlign === 'right' ? '100%' : '100%';
            const afterWidth = textAlign === 'right' ? '5%' : textAlign === 'left' ? '100%' : '100%';

            return (
                <>
                    <Box
                        as="span"
                        w={beforeWidth}
                        style={{ borderTop: `thin solid ${borderColor}` }}
                    />
                    <span className="lxs-divider-wrapper" style={{ paddingLeft: 'var(--lxs-spacing-3)', paddingRight: 'var(--lxs-spacing-3)' }}>
                        {children}
                    </span>
                    <Box
                        as="span"
                        w={afterWidth}
                        style={{ borderTop: `thin solid ${borderColor}` }}
                    />
                </>
            );
        } else {
             return (
                <>
                    <Box
                        as="span"
                        h="100%"
                        style={{ borderLeft: `thin solid ${borderColor}` }}
                    />
                    <span className="lxs-divider-wrapper" style={{ paddingTop: 'var(--lxs-spacing-2)', paddingBottom: 'var(--lxs-spacing-2)' }}>
                        {children}
                    </span>
                    <Box
                        as="span"
                        h="100%"
                        style={{ borderLeft: `thin solid ${borderColor}` }}
                    />
                </>
            );
        }
    };

    return (
      <Box
        as={Component as any}
        ref={ref as any}
        className={`lxs-divider ${className}`.trim()} // Keep class for tests looking for it
        role={dividerRole}
        style={finalStyle}
        {...additionalProps}
        {...props}
      >
        {renderChildren()}
      </Box>
    );
  }
);

Divider.displayName = 'Divider';

export default Divider;
export { Divider };
