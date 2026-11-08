import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's default font sizes. Register the design-system sizes
 * (theme.css) so `text-caption` / `text-body-sm` are treated as font sizes, not colours,
 * and aren't dropped when combined with a text colour such as `text-muted-foreground`.
 */
const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: ['caption', 'body-sm', 'display', 'heading', 'subheading', 'metric'],
        },
    },
});

/**
 * Joins class names and resolves Tailwind conflicts, so later classes win.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 * cn('p-2', 'p-4') // → 'p-4'
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
