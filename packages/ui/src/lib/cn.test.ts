import { describe, expect, it } from 'vitest';
import { cn } from './cn';
import { mergeClassName } from './merge-class-name';

describe('cn', () => {
    it('joins truthy class names', () => {
        expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
    });

    it('lets later Tailwind classes win', () => {
        expect(cn('px-2 py-1 bg-primary', 'px-4', 'bg-destructive')).toBe(
            'py-1 px-4 bg-destructive',
        );
    });
});

describe('mergeClassName', () => {
    it('merges a string className', () => {
        expect(mergeClassName('p-2 text-sm', 'p-4')).toBe('text-sm p-4');
    });

    it('wraps a state function so consumer classes still win', () => {
        const merged = mergeClassName<{ disabled: boolean }>('p-2', (s) =>
            s.disabled ? 'p-0' : undefined,
        );
        expect(typeof merged).toBe('function');
        expect(
            (merged as (s: { disabled: boolean }) => string)({ disabled: true }),
        ).toBe('p-0');
        expect(
            (merged as (s: { disabled: boolean }) => string)({ disabled: false }),
        ).toBe('p-2');
    });
});
