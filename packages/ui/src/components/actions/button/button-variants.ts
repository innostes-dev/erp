import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Class generator for the button look. Use it to style elements that can't be a `Button`,
 * such as a framework router link.
 *
 * Server-safe: it has no React code, so it works in React Server Components.
 *
 * @example
 * <Link href="/orders" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
 *   Orders
 * </Link>
 */
export const buttonVariants = cva(
    [
        'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap select-none',
        'rounded-md border border-solid border-transparent font-medium leading-none',
        'cursor-pointer transition-colors outline-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'data-disabled:cursor-not-allowed data-disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    ],
    {
        variants: {
            /** Visual style. */
            variant: {
                primary:
                    'bg-primary text-primary-foreground hover:not-data-disabled:bg-primary-hover',
                secondary:
                    'bg-secondary text-secondary-foreground hover:not-data-disabled:bg-secondary-hover',
                outline:
                    'border-input bg-background text-foreground hover:not-data-disabled:bg-accent hover:not-data-disabled:text-accent-foreground',
                ghost:
                    'bg-transparent text-foreground hover:not-data-disabled:bg-accent hover:not-data-disabled:text-accent-foreground',
                link: 'h-auto! border-0 bg-transparent px-0! text-primary underline-offset-4 hover:not-data-disabled:underline',
                destructive:
                    'bg-destructive text-destructive-foreground hover:not-data-disabled:bg-destructive-hover',
            },
            /** Height, padding and font size: 32, 40 and 48px. */
            size: {
                sm: 'h-8 px-3 text-sm pointer-coarse:h-10',
                md: 'h-10 px-4 text-sm pointer-coarse:h-11',
                lg: 'h-12 px-6 text-base',
            },
            /** Square button for a single icon. */
            iconOnly: { true: 'px-0', false: '' },
            /** Stretch to the parent's width. */
            fullWidth: { true: 'w-full', false: '' },
        },
        compoundVariants: [
            { iconOnly: true, size: 'sm', class: 'w-8 pointer-coarse:w-10' },
            { iconOnly: true, size: 'md', class: 'w-10 pointer-coarse:w-11' },
            { iconOnly: true, size: 'lg', class: 'w-12' },
        ],
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            iconOnly: false,
            fullWidth: false,
        },
    },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type ButtonVariant = NonNullable<ButtonVariantProps['variant']>;
export type ButtonSize = NonNullable<ButtonVariantProps['size']>;
