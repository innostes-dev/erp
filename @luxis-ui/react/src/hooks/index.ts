"use client";

import { useState, useEffect, RefObject } from 'react';

/**
 * Hook to handle click events outside of a specified element
 *
 * @param ref - Reference to the element to detect clicks outside of
 * @param handler - Callback function to execute when clicking outside
 *
 * @example
 * ```tsx
 * function Dropdown() {
 *   const ref = useRef<HTMLDivElement>(null);
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   useClickOutside(ref, () => setIsOpen(false));
 *
 *   return <div ref={ref}>Dropdown content</div>;
 * }
 * ```
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

/**
 * Hook to manage focus trap within a component (useful for modals, dialogs)
 *
 * @param ref - Reference to the container element
 * @param isActive - Whether the focus trap is active
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }) {
 *   const ref = useRef<HTMLDivElement>(null);
 *   useFocusTrap(ref, isOpen);
 *   return <div ref={ref}>Modal content</div>;
 * }
 * ```
 */
export const useFocusTrap = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  isActive: boolean
): void => {
  useEffect(() => {
    if (!isActive) return;

    const element = ref.current;
    if (!element) return;


    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    firstElement?.focus();
    element.addEventListener('keydown', handleTab);

    return () => {
      element.removeEventListener('keydown', handleTab);
    };
  }, [ref, isActive]);
};

/**
 * Hook to handle escape key press
 *
 * @param handler - Callback function to execute when escape is pressed
 *
 * @example
 * ```tsx
 * function Modal({ onClose }) {
 *   useEscapeKey(onClose);
 *   return <div>Modal content</div>;
 * }
 * ```
 */
export const useEscapeKey = (handler: () => void): void => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handler]);
};

/**
 * Hook to manage body scroll lock (useful for modals)
 *
 * @param isLocked - Whether to lock the body scroll
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }) {
 *   useBodyScrollLock(isOpen);
 *   return <div>Modal content</div>;
 * }
 * ```
 */
export const useBodyScrollLock = (isLocked: boolean): void => {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
};

/**
 * Hook to generate unique IDs for accessibility
 *
 * @param prefix - Optional prefix for the ID
 * @returns Stable unique ID
 *
 * @example
 * ```tsx
 * function Input() {
 *   const id = useId('input');
 *   return <input id={id} aria-describedby={`${id}-description`} />;
 * }
 * ```
 */
let idCounter = 0;
export const useId = (prefix = 'lxs'): string => {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
};

/**
 * Hook to debounce a value
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *
 *   useEffect(() => {
 *     // API call with debouncedSearch
 *   }, [debouncedSearch]);
 * }
 * ```
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
