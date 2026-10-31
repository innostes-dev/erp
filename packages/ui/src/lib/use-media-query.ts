'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribes to a CSS media query. Returns `false` during server rendering and the first
 * client render, then the real value.
 *
 * Written with `useState` + `useEffect` (not `useSyncExternalStore`) so it works on React 17.
 *
 * @internal
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const update = () => setMatches(mql.matches);
        update();
        // Safari < 14 only supports the deprecated addListener API.
        if (mql.addEventListener) {
            mql.addEventListener('change', update);
            return () => mql.removeEventListener('change', update);
        }
        mql.addListener(update);
        return () => mql.removeListener(update);
    }, [query]);

    return matches;
}
