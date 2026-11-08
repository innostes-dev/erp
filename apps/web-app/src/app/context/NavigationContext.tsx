import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { parseRoute, type Route } from '../navigation/routes';

export interface NavigationContextType {
  /** Current pathname, e.g. `/modules/peopleops/leave`. */
  path: string;
  /** Parsed route for the current path. */
  route: Route;
  /** Push a new entry onto the history stack and render it. */
  navigate: (to: string) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(currentPath);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === currentPath()) return;
    window.history.pushState(null, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  }, []);

  const value = useMemo(
    () => ({ path, route: parseRoute(path), navigate }),
    [path, navigate],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

/**
 * A real link (`<a href>`) that navigates client-side. Keeps native behaviour for
 * Ctrl/⌘-click, middle-click and "open in new tab", and works with assistive technology.
 */
export const Link = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
  function Link({ href, onClick, target, ...props }, ref) {
    const { navigate } = useNavigation();
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
      onClick?.(event);
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (target && target !== '_self') ||
        !href.startsWith('/')
      ) {
        return;
      }
      event.preventDefault();
      navigate(href);
    }
    return <a ref={ref} href={href} target={target} onClick={handleClick} {...props} />;
  },
);
