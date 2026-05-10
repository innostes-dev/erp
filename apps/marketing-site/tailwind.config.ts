import type { Config } from 'tailwindcss';
import baseConfig from '../../tailwind.config';

const config: Config = {
  ...baseConfig,
  content: [
    './src/**/*.{ts,tsx}',
    '../../libs/**/*.{ts,tsx}',
  ],
};

export default config;
