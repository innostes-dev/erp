import { cva, type VariantProps } from 'class-variance-authority';

/** Class generator for the toggle look. Shared with `ToggleGroupItem`. */
export const toggleVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap',
    'cursor-pointer transition-colors outline-none select-none',
    'text-muted-foreground hover:not-data-disabled:bg-muted hover:not-data-disabled:text-foreground',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'data-pressed:bg-accent data-pressed:text-accent-foreground',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-background shadow-xs',
      },
      size: {
        sm: 'h-8 min-w-8 px-2',
        md: 'h-10 min-w-10 px-2.5',
        lg: 'h-12 min-w-12 px-3',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export type ToggleVariantProps = VariantProps<typeof toggleVariants>;
