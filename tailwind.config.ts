import type { Config } from 'tailwindcss';
import { tailwindThemeExtension } from './libs/core/design-system/src/tokens';

const config: Config = {
  content: [
    './apps/os-shell/src/**/*.{ts,tsx}',
    './apps/marketing-site/src/**/*.{ts,tsx}',
    './libs/**/*.{ts,tsx}',
  ],
  theme: {
    extend: tailwindThemeExtension,
  },
  plugins: [],
};

export default config;
