import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';

export interface ButtonGroupProps extends ComponentProps<'div'> {
  /**
   * Layout direction. Adjacent borders and corners are merged in this direction.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Visually joins related buttons into one control, e.g. a split button or a pager.
 * Renders `role="group"`; give it an `aria-label` describing the group.
 *
 * @example
 * <ButtonGroup aria-label="Text alignment">
 *   <Button variant="outline">Left</Button>
 *   <Button variant="outline">Center</Button>
 *   <Button variant="outline">Right</Button>
 * </ButtonGroup>
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup(
    { className, orientation = 'horizontal', ...props },
    ref,
  ) {
    return (
      <div
        role="group"
        ref={ref}
        data-slot="button-group"
        data-orientation={orientation}
        aria-orientation={orientation}
        className={cn(
          'inline-flex isolate',
          '[&>*]:focus-visible:z-10',
          orientation === 'horizontal'
            ? 'flex-row [&>*:not(:first-child)]:-ms-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none'
            : 'flex-col [&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none',
          className,
        )}
        {...props}
      />
    );
  },
);
