export const tokens = {
  colors: {
    brand: {
      primary: 'hsl(220 90% 56%)',
      secondary: 'hsl(262 83% 58%)',
      accent: 'hsl(36 100% 50%)',
    },
    semantic: {
      success: 'hsl(142 71% 45%)',
      warning: 'hsl(38 92% 50%)',
      error: 'hsl(0 84% 60%)',
      info: 'hsl(199 89% 48%)',
    },
    neutral: {
      50: 'hsl(210 40% 98%)',
      100: 'hsl(210 40% 96%)',
      200: 'hsl(214 32% 91%)',
      300: 'hsl(213 27% 84%)',
      400: 'hsl(215 20% 65%)',
      500: 'hsl(215 16% 47%)',
      600: 'hsl(215 19% 35%)',
      700: 'hsl(215 25% 27%)',
      800: 'hsl(217 33% 17%)',
      900: 'hsl(222 47% 11%)',
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
    24: '6rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const;

export type Tokens = typeof tokens;
