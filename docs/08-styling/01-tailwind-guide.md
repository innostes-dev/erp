# Tailwind CSS Guide

This project uses Tailwind CSS v3 for all styling. There is no CSS-in-JS, no CSS Modules, and no global stylesheet beyond the Tailwind base layer. Everything is a utility class.

---

## Setup

### tailwind.config.ts

Tailwind must know which files to scan for class names. The `content` array covers every location where classes can appear.

```ts
// tailwind.config.ts (root)
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './apps/shell/src/**/*.{ts,tsx}',
    './libs/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

> **Note:** If you add a new app or lib that contains components, add its path to the `content` array. Missing this is the most common reason a class does not appear in the final bundle.

### postcss.config.mjs

```js
// postcss.config.mjs
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

---

## cn() utility

`cn()` combines [clsx](https://github.com/lukeed/clsx) and [tailwind-merge](https://github.com/dcastil/tailwind-merge). It is the only approved way to build conditional or merged class strings.

### Where it lives

```ts
// libs/kernel/ui/src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### How to import it

```ts
import { cn } from '@mono/kernel/ui';
```

### When to use cn()

Use `cn()` any time a class string depends on a condition, a prop, or could conflict with another class on the same element.

**Conditional classes:**

```tsx
<div className={cn(
  'rounded-lg border p-4',
  isActive && 'border-indigo-500 bg-indigo-50',
  isError && 'border-red-500 bg-red-50',
)} />
```

**Merging caller-provided classes without conflicts:**

```tsx
interface ButtonProps {
  className?: string;
  children: React.ReactNode;
}

export function Button({ className, children }: ButtonProps) {
  return (
    <button className={cn('rounded-md bg-indigo-600 px-4 py-2 text-white', className)}>
      {children}
    </button>
  );
}
```

`twMerge` resolves conflicts so that `className="bg-red-500"` passed by the caller correctly overrides the default `bg-indigo-600` — without `tailwind-merge`, both classes would appear and the winner would be unpredictable.

**Never use template literals for conditional classes:**

```tsx
// Wrong
className={`rounded ${isActive ? 'bg-indigo-600' : 'bg-gray-200'}`}

// Correct
className={cn('rounded', isActive ? 'bg-indigo-600' : 'bg-gray-200')}
```

---

## Lucide React

All icons come from [lucide-react](https://lucide.dev). Do not import from any other icon library.

### How to import

```tsx
import { ChevronRight, Settings, LogOut } from 'lucide-react';
```

### Sizing

Use the `size` prop. Do not use `w-` and `h-` Tailwind classes to size icons — they fight with the icon's own dimensions.

```tsx
// Correct
<ChevronRight size={16} />
<Settings size={20} />

// Wrong
<Settings className="w-5 h-5" />
```

Standard sizes used in this project:

| Context | size value |
|---|---|
| Inline text / badges | `14` |
| Buttons and nav items | `16` |
| Section headings | `20` |
| Hero / empty states | `24` – `48` |

### Color

Control icon color with `className` on the icon element.

```tsx
<ChevronRight size={16} className="text-gray-400" />
<Settings size={16} className="text-indigo-600" />
```

---

## Color system

The app uses a consistent palette. Stick to these tokens.

### Primary (actions, active states, highlights)

| Use | Class |
|---|---|
| Primary background | `bg-indigo-600` |
| Primary hover | `hover:bg-indigo-700` |
| Primary text | `text-indigo-600` |
| Primary border / ring | `border-indigo-500`, `ring-indigo-500` |
| Accent / secondary | `bg-violet-600`, `text-violet-600` |

### Gray scale (text, borders, surfaces)

| Use | Class |
|---|---|
| Page background | `bg-gray-50` |
| Card background | `bg-white` |
| Subtle border | `border-gray-200` |
| Placeholder text | `text-gray-400` |
| Secondary text | `text-gray-500` |
| Body text | `text-gray-700` |
| Headings | `text-gray-900` |

### Semantic colors

| Meaning | Background | Text |
|---|---|---|
| Success | `bg-green-50` | `text-green-700` |
| Warning | `bg-yellow-50` | `text-yellow-700` |
| Error | `bg-red-50` | `text-red-700` |
| Info | `bg-blue-50` | `text-blue-700` |

---

## Gradient patterns for module cards

Dashboard module cards use a two-color gradient. The pattern is always `from-X-500 to-Y-600` on a `bg-gradient-to-br` direction.

```tsx
// Examples used across the dashboard
<div className="bg-gradient-to-br from-indigo-500 to-violet-600" />
<div className="bg-gradient-to-br from-blue-500 to-indigo-600" />
<div className="bg-gradient-to-br from-emerald-500 to-teal-600" />
<div className="bg-gradient-to-br from-orange-500 to-red-600" />
<div className="bg-gradient-to-br from-purple-500 to-pink-600" />
```

Text on top of gradients is always white: `text-white`.

---

## Common component patterns

### Button

```tsx
import { cn } from '@mono/kernel/ui';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
};

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Card

```tsx
import { cn } from '@mono/kernel/ui';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-6 shadow-sm', className)}>
      {children}
    </div>
  );
}
```

### Input

```tsx
import { cn } from '@mono/kernel/ui';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <input
        className={cn(
          'rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-500',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

### Badge

```tsx
import { cn } from '@mono/kernel/ui';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
};

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      badgeVariants[variant],
      className,
    )}>
      {children}
    </span>
  );
}
```

### Modal overlay

```tsx
'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@mono/kernel/ui';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={cn(
        'relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl',
        'animate-slide-up',
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

---

## Animation classes

These are defined in `tailwind.config.ts` under `theme.extend.animation`.

| Class | Effect | Duration |
|---|---|---|
| `animate-fade-in` | Fades from opacity 0 to 1 | 200ms |
| `animate-slide-up` | Fades in while translating up 8px | 300ms |

Usage:

```tsx
<div className="animate-fade-in">This fades in on mount</div>
<div className="animate-slide-up">This slides up on mount</div>
```

These only play on mount. To replay on state change, conditionally unmount and remount the element.

---

## Dark mode

Dark mode is not currently implemented. When the time comes, the recommended approach is:

1. Add `darkMode: 'class'` to `tailwind.config.ts`.
2. Add a `theme` field to `useKernelStore()` with values `'light' | 'dark'`.
3. Apply `className={theme}` to the `<html>` element in `layout.tsx`.
4. Add `dark:` variants alongside every existing light-mode class.

Do not use the `media` strategy — it cannot be overridden by the user. The `class` strategy gives full control.
