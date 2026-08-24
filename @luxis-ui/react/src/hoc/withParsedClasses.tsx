// withParsedClasses.tsx
import React from "react";
import { parseClass } from "../utils/parseClass";

export function withParsedClasses<T extends { className?: string }>(
  Component: React.ComponentType<T>
) {
  const WrappedComponent = (props: T) => {
    const { className, ...restProps } = props as any;

    // Memoize the parsed class name to avoid expensive re-parsing
    // parseClass itself is now cached internally, but we still avoid the split/map/join
    const parsedClassName = React.useMemo(() => {
      if (!className) return "";

      return className
        .split(/\s+/)
        .filter(Boolean)
        .map((cls: string) => parseClass(cls))
        .join(" ");
    }, [className]);

    return <Component {...(restProps as T)} className={parsedClassName} />;
  };

  // Preserve the original component's display name
  WrappedComponent.displayName = `WithParsedClasses(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}