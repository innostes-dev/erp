import { cn } from './cn';

/** A Base UI `className`: a string, or a function of the component state. */
export type StateClassName<State> =
    string | ((state: State) => string | undefined) | undefined;

/**
 * Merges our default classes with a consumer `className` that Base UI allows to be either a
 * string or a function of the component state. The consumer's classes always win.
 *
 * @internal
 */
export function mergeClassName<State>(
    base: string,
    className: StateClassName<State>,
): string | ((state: State) => string) {
    if (typeof className === 'function') {
        return (state: State) => cn(base, className(state));
    }
    return cn(base, className);
}
