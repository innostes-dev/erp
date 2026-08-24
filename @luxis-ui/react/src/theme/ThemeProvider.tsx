
'use client';
import React from 'react';
import { injectCSSVariables } from './cssVariables';
import { tokens, Tokens, normalizeColors, CustomTokens } from './tokens';
import { ToastContainer } from '../components/Toast/ToastContainer';
import type { ToastPosition } from '../components/Toast/types';
import { initGlobalStyles } from '../utils/parseClass';

export type Size = 'sm' | 'md' | 'lg';

export type RadiusSize = 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | (string & {});

export type ColorContrast = 'light' | 'dark';

export interface ColorContrastConfig {
  primary?: ColorContrast;
  secondary?: ColorContrast;
  outline?: ColorContrast;
  ghost?: ColorContrast;
  danger?: ColorContrast;
  success?: ColorContrast;
  warning?: ColorContrast;
  info?: ColorContrast;
}

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export interface LuxisTheme {
  mode: 'light' | 'dark';
  tokens: Tokens;
  global: {
    size: Size;
    radius: RadiusSize;
  };
  contrast: ColorContrastConfig;
  toast: {
    position: ToastPosition;
    limit: number;
    disable: boolean;
  };
  adapters: {
    linkComponent?: React.ElementType;
    imageComponent?: React.ElementType;
  };
}

export type Theme = LuxisTheme;

export const defaultTheme: LuxisTheme = {
  mode: 'light',
  tokens: tokens as Tokens,
  global: {
    size: 'md',
    radius: 'md',
  },
  contrast: {
    primary: 'dark',
    secondary: 'dark',
    outline: 'light',
    ghost: 'light',
    danger: 'dark',
    success: 'dark',
    warning: 'dark',
    info: 'dark',
  },
  toast: {
    position: 'top-right',
    limit: 5,
    disable: false,
  },
  adapters: {
    linkComponent: undefined,
    imageComponent: 'img',
  },
};

export function isObject(item: any): item is Record<string, any> {
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

export function deepMerge<T>(target: T, source: any): T {
  if (!source) return { ...target } as T;
  let output = { ...target } as Record<string, any>;

  // Ensure nested objects in target are cloned even if they don't exist in source
  if (isObject(target)) {
    Object.keys(target as Record<string, any>).forEach(key => {
      if (isObject((target as Record<string, any>)[key]) && (!source || !isObject(source[key]))) {
        output[key] = deepMerge((target as Record<string, any>)[key], {});
      }
    });
  }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = deepMerge({}, source[key]); // Clone source object deeply
        } else {
          output[key] = deepMerge((target as Record<string, any>)[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output as T;
}

export interface ThemeContextValue {
  theme: Theme;
  setMode: (mode: 'light' | 'dark') => void;
  setDefaultSize: (size: Size) => void;
  setDefaultRadius: (radius: RadiusSize) => void;
}


const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);


export interface ThemeProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Child components that will have access to the theme */
  children?: React.ReactNode;
  /** Optional and partial theme object to override defaults */
  theme?: DeepPartial<LuxisTheme>;
  /** Initial theme mode, defaults to 'light' (legacy, mapped to theme.mode) */
  initialMode?: 'light' | 'dark';
  /** Custom theme tokens to override defaults (legacy, mapped to theme.tokens) */
  customTokens?: CustomTokens;
  /** Global default size for components (e.g., 'md', 'sm', 'lg') (legacy, mapped to theme.global.size) */
  defaultSize?: Size;
  /** Global default radius for components (legacy, mapped to theme.global.radius) */
  defaultRadius?: RadiusSize;
  /** Color contrast configuration - specify if variant backgrounds are light or dark (legacy, mapped to theme.contrast) */
  colorContrast?: ColorContrastConfig;
  /** Toast container position (legacy, mapped to theme.toast.position) */
  toastPosition?: ToastPosition;
  /** Maximum number of toasts to display at once (legacy, mapped to theme.toast.limit) */
  toastLimit?: number;
  /** Disable toast notifications globally (legacy, mapped to theme.toast.disable) */
  disableToasts?: boolean;
  /** Default link component for routing (legacy, mapped to theme.adapters.linkComponent) */
  linkComponent?: React.ElementType;
  /** Default image component for images (legacy, mapped to theme.adapters.imageComponent) */
  imageComponent?: React.ElementType;
}


const ThemeProvider = React.forwardRef<HTMLDivElement, ThemeProviderProps>(
  (
    {
      children,
      theme: userThemeObj,
      initialMode,
      customTokens,
      defaultSize,
      defaultRadius,
      colorContrast,
      toastPosition,
      toastLimit,
      disableToasts,
      linkComponent,
      imageComponent,
      ...props
    },
    ref
  ) => {
    // Map legacy props to userTheme, memoized to avoid unnecessary re-renders
    const legacyThemeProps = React.useMemo(() => {
      const props: DeepPartial<LuxisTheme> = {};
      if (initialMode) props.mode = initialMode;
      if (customTokens) props.tokens = customTokens as DeepPartial<Tokens>;
      if (defaultSize || defaultRadius) {
        props.global = {};
        if (defaultSize) props.global.size = defaultSize;
        if (defaultRadius) props.global.radius = defaultRadius;
      }
      if (colorContrast) props.contrast = colorContrast;

      const legacyToastProps: any = {};
      if (toastPosition) legacyToastProps.position = toastPosition;
      if (toastLimit !== undefined) legacyToastProps.limit = toastLimit;
      if (disableToasts !== undefined) legacyToastProps.disable = disableToasts;
      if (Object.keys(legacyToastProps).length > 0) props.toast = legacyToastProps;

      const legacyAdaptersProps: any = {};
      if (linkComponent) legacyAdaptersProps.linkComponent = linkComponent;
      if (imageComponent) legacyAdaptersProps.imageComponent = imageComponent;
      if (Object.keys(legacyAdaptersProps).length > 0) props.adapters = legacyAdaptersProps;
      return props;
    }, [initialMode, customTokens, defaultSize, defaultRadius, colorContrast, toastPosition, toastLimit, disableToasts, linkComponent, imageComponent]);

    const [modeState, setMode] = React.useState<'light' | 'dark' | undefined>(undefined);
    const [sizeState, setDefaultSize] = React.useState<Size | undefined>(undefined);
    const [radiusState, setDefaultRadius] = React.useState<RadiusSize | undefined>(undefined);

    const theme: Theme = React.useMemo(() => {
      let combinedUserTheme = deepMerge(legacyThemeProps, userThemeObj || {});

      let finalTheme = deepMerge(defaultTheme, combinedUserTheme);

      // Override finalTheme with state values if they have been updated by setMode/setDefaultSize
      if (modeState !== undefined) {
        finalTheme.mode = modeState;
      }
      if (sizeState !== undefined) {
        finalTheme.global.size = sizeState;
      }
      if (radiusState !== undefined) {
        finalTheme.global.radius = radiusState;
      }

      // Normalize colors
      if (finalTheme.tokens.colors) {
        finalTheme.tokens.colors = normalizeColors(finalTheme.tokens.colors) as any;
      }

      return finalTheme;
    }, [userThemeObj, legacyThemeProps, modeState, sizeState, radiusState]);

    React.useLayoutEffect(() => {
      document.documentElement.dataset['theme'] = theme.mode;
      injectCSSVariables(theme.tokens, theme.global.radius);
      // Initialize global parseClass styles (safe to call multiple times)
      initGlobalStyles();
    }, [theme.mode, theme.tokens, theme.global.radius]);

    const contextValue = React.useMemo<ThemeContextValue>(
      () => ({ theme, setMode, setDefaultSize, setDefaultRadius }),
      [theme]
    );

    return (
      <ThemeContext.Provider value={contextValue}>
        <ToastContainer position={theme.toast.position} limit={theme.toast.limit}>
          <div ref={ref} {...props}>
            {children}
          </div>
        </ToastContainer>
      </ThemeContext.Provider>
    );
  }
);

ThemeProvider.displayName = 'ThemeProvider';

export { ThemeProvider };
export { ThemeContext };
export default ThemeProvider as React.FC<ThemeProviderProps & React.RefAttributes<HTMLDivElement>>;


/**
 * Hook to access the current theme and theme utilities
 *
 * @throws {Error} If used outside of ThemeProvider
 *
 * @example
 * function MyComponent() {
 *   const { theme, setMode } = useThemeContext();
 *   return <div style={{ color: theme.tokens.colors.primary[500] }}>Hello</div>;
 * }
 */
export const useThemeContext = (): ThemeContextValue => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
