import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
    cleanup();
});

// jsdom lacks these browser APIs used by Base UI and our hooks.
if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: () => { },
            removeEventListener: () => { },
            addListener: () => { },
            removeListener: () => { },
            dispatchEvent: () => false,
        }) as MediaQueryList;
}

if (!('ResizeObserver' in window)) {
    class ResizeObserverStub {
        observe() { }
        unobserve() { }
        disconnect() { }
    }
    (
        window as unknown as { ResizeObserver: typeof ResizeObserverStub }
    ).ResizeObserver = ResizeObserverStub;
}

if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = () => [];
}
