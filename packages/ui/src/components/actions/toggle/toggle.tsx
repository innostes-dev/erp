'use client';

import { forwardRef } from 'react';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { mergeClassName } from '../../../lib/merge-class-name';
import { toggleVariants, type ToggleVariantProps } from './toggle-variants';

export interface ToggleProps extends BaseToggle.Props, ToggleVariantProps {}

/**
 * A two-state button that can be on or off, e.g. bold in a text toolbar.
 * Controlled with `pressed` / `onPressedChange`, or uncontrolled with `defaultPressed`.
 *
 * @example
 * <Toggle aria-label="Bold" defaultPressed><BoldIcon /></Toggle>
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle({ className, variant, size, ...props }, ref) {
    return (
      <BaseToggle
        ref={ref}
        data-slot="toggle"
        className={mergeClassName(toggleVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
