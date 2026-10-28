import React, { createContext, useContext, useEffect, useState } from 'react';

export interface NavigationContextType {
  path: string;
  navigate: (to: string) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  useEffect(() => {
    function handlePopState() {
      setPath(window.location.pathname || '/');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(to: string) {
    if (to !== path) {
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', to);
      }
      setPath(to);
      window.scrollTo(0, 0);
    }
  }

  return (
    <NavigationContext.Provider value={{ path, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
