import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Class generator for text-field surfaces (`Input`, `Textarea`, `Select` trigger, …).
 * Server-safe. Invalid styles apply from `aria-invalid` or Base UI's `data-invalid`.
 */
export const inputVariants = cva(
  [
    'w-full min-w-0 rounded-md border border-input bg-background text-foreground shadow-xs',
    'transition-[color,box-shadow,border-color] outline-none',
    'placeholder:text-muted-foreground',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25',
    'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25',
    'data-invalid:border-destructive data-invalid:focus-visible:ring-destructive/25',
    'disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50',
    'read-only:bg-muted/40',
  ],
  {
    variants: {
      /** Height and text size: 32, 40 and 48px. */
      size: {
        sm: 'h-8 px-2.5 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type InputVariantProps = VariantProps<typeof inputVariants>;
export type InputSize = NonNullable<InputVariantProps['size']>;
