import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../libs/ui/**/*.{ts,tsx}',
    '../../libs/kernel/**/*.{ts,tsx}',
    '../../libs/modules/**/*.{ts,tsx}',
    '../../libs/shared/**/*.{ts,tsx}',
  ],
  safelist: [
    { pattern: /^from-/ },
    { pattern: /^to-/ },
    { pattern: /^border-/ },
    { pattern: /^ring-/ },
    { pattern: /^text-(blue|violet|emerald|orange|green|yellow|slate|indigo|purple|teal|amber)/ },
    { pattern: /^bg-(blue|violet|emerald|orange|green|yellow|slate|indigo|purple|teal|amber)/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [forms],
};

export default config;
