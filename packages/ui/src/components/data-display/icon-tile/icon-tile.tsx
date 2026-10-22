import { forwardRef, type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/cn';

/** Colour of an `IconTile`: a semantic role, or one of the categorical `chart-*` colours. */
export type IconTileTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'neutral'
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'chart-6'
  | 'chart-7'
  | 'chart-8';

// Written out in full so Tailwind can find every class.
const soft: Record<IconTileTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  neutral: 'bg-muted text-muted-foreground',
  'chart-1': 'bg-chart-1/12 text-chart-1',
  'chart-2': 'bg-chart-2/12 text-chart-2',
  'chart-3': 'bg-chart-3/12 text-chart-3',
  'chart-4': 'bg-chart-4/15 text-chart-4',
  'chart-5': 'bg-chart-5/12 text-chart-5',
  'chart-6': 'bg-chart-6/12 text-chart-6',
  'chart-7': 'bg-chart-7/12 text-chart-7',
  'chart-8': 'bg-chart-8/12 text-chart-8',
};

const solid: Record<IconTileTone, string> = {
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  info: 'bg-info text-info-foreground',
  neutral: 'bg-foreground text-background',
  'chart-1': 'bg-chart-1 text-white',
  'chart-2': 'bg-chart-2 text-white',
  'chart-3': 'bg-chart-3 text-white',
  'chart-4': 'bg-chart-4 text-white',
  'chart-5': 'bg-chart-5 text-white',
  'chart-6': 'bg-chart-6 text-white',
  'chart-7': 'bg-chart-7 text-white',
  'chart-8': 'bg-chart-8 text-white',
};

const iconTileVariants = cva(
  'inline-flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      /** 32, 40, 48 and 56px. */
      size: {
        sm: "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
        md: "size-10 rounded-lg [&_svg:not([class*='size-'])]:size-5",
        lg: "size-12 rounded-xl [&_svg:not([class*='size-'])]:size-6",
        xl: "size-14 rounded-2xl [&_svg:not([class*='size-'])]:size-7",
      },
      /** `circle` overrides the rounded square. */
      shape: { square: '', circle: 'rounded-full' },
      /** `outline` adds a subtle ring, useful on tinted backgrounds. */
      bordered: { true: 'ring-1 ring-current/15 ring-inset', false: '' },
    },
    defaultVariants: { size: 'md', shape: 'square', bordered: false },
  },
);

export interface IconTileProps
  extends ComponentProps<'span'>, VariantProps<typeof iconTileVariants> {
  /** Colour. @default 'primary' */
  tone?: IconTileTone;
  /** `soft` = tinted background with coloured icon; `solid` = filled. @default 'soft' */
  variant?: 'soft' | 'solid';
}

/**
 * A coloured square (or circle) holding an icon. Used by metric cards, list items, feature
 * lists and empty states to give each item a recognisable colour.
 *
 * The icon is decorative (`aria-hidden`); put the meaning in nearby text.
 *
 * @example
 * <IconTile tone="chart-2"><UsersIcon /></IconTile>
 * <IconTile tone="success" variant="solid" shape="circle" size="sm"><CheckIcon /></IconTile>
 */
export const IconTile = forwardRef<HTMLSpanElement, IconTileProps>(
  function IconTile(
    {
      className,
      tone = 'primary',
      variant = 'soft',
      size,
      shape,
      bordered,
      ...props
    },
    ref,
  ) {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        data-slot="icon-tile"
        data-tone={tone}
        className={cn(
          iconTileVariants({ size, shape, bordered }),
          variant === 'solid' ? solid[tone] : soft[tone],
          className,
        )}
        {...props}
      />
    );
  },
);
