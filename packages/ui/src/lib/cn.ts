import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
