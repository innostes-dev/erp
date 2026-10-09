/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "var(--border, #E2E8F0)",
        input: "var(--input, #E2E8F0)",
        ring: "var(--ring, #2563EB)",
        background: "var(--background, #F8FAFC)",
        foreground: "var(--foreground, #0F172A)",
        surface: "var(--surface, #FFFFFF)",
        navy: "var(--navy, #0F172A)",
        slate: "var(--slate, #475569)",
        primary: {
          DEFAULT: "var(--primary, #2563EB)",
          dark: "var(--primary-dark, #1D4ED8)",
          light: "var(--primary-light, #EFF6FF)",
          subtle: "var(--primary-subtle, #DBEAFE)",
          foreground: "var(--primary-foreground, #FFFFFF)",
        },
        secondary: {
          DEFAULT: "var(--secondary, #F1F5F9)",
          foreground: "var(--secondary-foreground, #0F172A)",
        },
        success: {
          DEFAULT: "var(--success, #16A34A)",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "var(--warning, #D97706)",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "var(--destructive, #DC2626)",
          foreground: "var(--destructive-foreground, #FFFFFF)",
        },
        danger: {
          DEFAULT: "var(--danger, #DC2626)",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "var(--muted, #F1F5F9)",
          foreground: "var(--muted-foreground, #475569)",
        },
        accent: {
          DEFAULT: "var(--accent, #F1F5F9)",
          foreground: "var(--accent-foreground, #0F172A)",
        },
        card: {
          DEFAULT: "var(--card, #FFFFFF)",
          foreground: "var(--card-foreground, #0F172A)",
        },
        popover: {
          DEFAULT: "var(--popover, #FFFFFF)",
          foreground: "var(--popover-foreground, #0F172A)",
        },
      },
      borderRadius: {
        lg: "var(--radius, 0.5rem)",
        md: "calc(var(--radius, 0.5rem) - 2px)",
        sm: "calc(var(--radius, 0.5rem) - 4px)",
      },
    },
  },
  plugins: [],
};
