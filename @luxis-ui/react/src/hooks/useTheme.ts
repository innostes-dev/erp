import { useThemeContext } from '../theme/ThemeProvider';

/**
 * Hook to access theme tokens and utilities
 *
 * @returns Theme tokens and theme mode setter
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { tokens, mode, setMode } = useTheme();
 *   return (
 *     <button
 *       style={{ background: tokens.colors.primary[500] }}
 *       onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
 *     >
 *       Toggle Theme
 *     </button>
 *   );
 * }
 * ```
 */
export const useTheme = () => {
  const { theme, setMode } = useThemeContext();
  return {
    tokens: theme.tokens,
    mode: theme.mode,
    setMode,
  };
};
