'use client';

import { forwardRef } from 'react';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { MinusIcon, PlusIcon } from '../../../lib/icons';
import { inputVariants, type InputSize } from '../input/input-variants';

export interface NumberFieldProps extends BaseNumberField.Root.Props {
  /**
   * Height and text size, matching `Input`.
   * @default 'md'
   */
  size?: InputSize;
  /**
   * Show − and + buttons on each side of the input.
   * @default true
   */
  showSteppers?: boolean;
  /** Placeholder for the input. */
  placeholder?: string;
  /** Accessible label when there's no visible `FieldLabel`. */
  'aria-label'?: string;
  /**
   * Accessible label for the decrement button.
   * @default 'Decrease'
   */
  decrementLabel?: string;
  /**
   * Accessible label for the increment button.
   * @default 'Increase'
   */
  incrementLabel?: string;
}

/**
 * A numeric input with step buttons, arrow-key and wheel support, `min` / `max` clamping and
 * locale-aware formatting through `format` (`Intl.NumberFormatOptions`).
 *
 * @example
 * <NumberField defaultValue={1} min={0} max={99} aria-label="Quantity" />
 * <NumberField defaultValue={1999} format={{ style: 'currency', currency: 'EUR' }} aria-label="Price" />
 */
export const NumberField = forwardRef<HTMLDivElement, NumberFieldProps>(
  function NumberField(
    {
      className,
      size,
      showSteppers = true,
      placeholder,
      'aria-label': ariaLabel,
      decrementLabel = 'Decrease',
      incrementLabel = 'Increase',
      ...props
    },
    ref,
  ) {
    const stepper =
      'flex aspect-square h-full cursor-pointer items-center justify-center text-muted-foreground ' +
      'transition-colors hover:bg-accent hover:text-accent-foreground ' +
      'data-disabled:cursor-not-allowed data-disabled:opacity-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring';

    return (
      <BaseNumberField.Root
        ref={ref}
        data-slot="number-field"
        className={mergeClassName('flex flex-col gap-2', className)}
        {...props}
      >
        <BaseNumberField.Group
          className={cn(
            inputVariants({ size }),
            'flex items-stretch overflow-hidden p-0',
            'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25',
          )}
        >
          {showSteppers && (
            <BaseNumberField.Decrement
              aria-label={decrementLabel}
              className={cn(stepper, 'border-e border-input')}
            >
              <MinusIcon className="size-4" />
            </BaseNumberField.Decrement>
          )}
          <BaseNumberField.Input
            data-slot="number-field-input"
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={cn(
              'w-full min-w-0 bg-transparent px-3 tabular-nums outline-none',
              showSteppers && 'text-center',
            )}
          />
          {showSteppers && (
            <BaseNumberField.Increment
              aria-label={incrementLabel}
              className={cn(stepper, 'border-s border-input')}
            >
              <PlusIcon className="size-4" />
            </BaseNumberField.Increment>
          )}
        </BaseNumberField.Group>
      </BaseNumberField.Root>
    );
  },
);
