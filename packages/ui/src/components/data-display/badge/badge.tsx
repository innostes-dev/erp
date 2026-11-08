import { forwardRef, type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/cn';

/** Class generator for the badge look. Server-safe. */
export const badgeVariants = cva(
  [
    'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-sm border border-transparent font-medium whitespace-nowrap',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  ],
  {
    variants: {
      /** Colour, by meaning. `soft` variants use a tinted background for dense tables. */
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-muted text-strong-foreground',
        outline: 'border-border bg-card text-strong-foreground',
        /* Status: soft background + text-safe shade (icons/dots inherit the text shade). */
        success: 'bg-success-bg text-success-text',
        warning: 'bg-warning-bg text-warning-text',
        destructive: 'bg-error-bg text-error-text',
        info: 'bg-info-bg text-info-text',
        /** Selected / brand emphasis without a solid fill. */
        primary: 'bg-primary-tint text-primary',
        /** AI / intelligence: the only teal badge. */
        ai: 'bg-ai-tint text-ai-text',
      },
      size: {
        sm: 'h-5 px-1.5 text-caption',
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
