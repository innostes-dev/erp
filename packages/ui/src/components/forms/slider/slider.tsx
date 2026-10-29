'use client';

import { forwardRef } from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import { mergeClassName } from '../../../lib/merge-class-name';

export interface SliderProps extends BaseSlider.Root.Props {
  /**
   * Accessible label for each thumb, in order. Needed when there's no visible label,
   * e.g. `['Minimum price', 'Maximum price']` for a range.
   */
  thumbLabels?: string[];
}

/**
 * Select a number, or a range when `value` / `defaultValue` is an array, by dragging or
 * with the arrow keys.
 *
 * @example
 * <Slider defaultValue={40} aria-label="Volume" />
 * <Slider defaultValue={[20, 80]} min={0} max={100} thumbLabels={['Min', 'Max']} />
 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(
  { className, thumbLabels, defaultValue, value, ...props },
  ref,
) {
  const current = value ?? defaultValue;
  const thumbCount = Array.isArray(current) ? current.length : 1;

  return (
    <BaseSlider.Root
      ref={ref}
      data-slot="slider"
      aria-label={props['aria-label'] ?? 'Slider'}
      defaultValue={defaultValue}
      value={value}
      className={mergeClassName(
        'relative w-full touch-none select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto',
        className,
      )}
      {...props}
    >
      <BaseSlider.Control className="flex w-full cursor-pointer items-center py-2 data-disabled:cursor-not-allowed data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:px-2">
        <BaseSlider.Track className="relative h-1.5 w-full rounded-full bg-muted data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5">
          <BaseSlider.Indicator className="rounded-full bg-primary" />
          {Array.from({ length: thumbCount }, (_, i) => (
            <BaseSlider.Thumb
              key={i}
              index={i}
              aria-label={thumbLabels?.[i] ?? (props['aria-label'] as string) ?? 'Slider value'}
              className="size-4 rounded-full border-2 border-primary bg-background shadow-sm transition-shadow outline-none focus-visible:ring-4 focus-visible:ring-ring/30 data-dragging:ring-4 data-dragging:ring-ring/30"
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
});
