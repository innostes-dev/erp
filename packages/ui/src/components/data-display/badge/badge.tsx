import { forwardRef, type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/cn';

/** Class generator for the badge look. Server-safe. */
export const badgeVariants = cva(
  [
    'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border border-transparent font-medium whitespace-nowrap',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  ],
  {
    variants: {
      /** Colour, by meaning. `soft` variants use a tinted background for dense tables. */
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'bg-success/12 text-success ring-1 ring-success/25 ring-inset',
        warning:
          'bg-warning/15 text-warning-foreground ring-1 ring-warning/40 ring-inset',
        destructive:
          'bg-destructive/10 text-destructive ring-1 ring-destructive/25 ring-inset',
        info: 'bg-info/10 text-info ring-1 ring-info/25 ring-inset',
      },
      size: {
        sm: 'h-5 px-1.5 text-[11px]',
        md: 'h-6 px-2 text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>['variant']
>;

export interface BadgeProps
  extends ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  /** Show a small dot before the label, e.g. for live status. */
  dot?: boolean;
}

/**
 * A short label for status, category or count, e.g. "Paid", "Draft", "3".
 *
 * @example
 * <Badge variant="success" dot>Active</Badge>
 * <Badge variant="outline">v2.1</Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant, size, dot, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-slot="badge"
      data-variant={variant ?? 'default'}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
});
