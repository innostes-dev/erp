'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { ChevronDown, Monitor, Moon, Sun } from 'lucide-react';

const options = [
  { value: 'light', label: 'Light Theme', Icon: Sun },
  { value: 'dark', label: 'Dark Theme', Icon: Moon },
  { value: 'system', label: 'System Theme', Icon: Monitor },
] as const;

/** Theme picker shown at the top of the docs sidebar. */
export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current =
    options.find((o) => o.value === (mounted ? theme : 'light')) ?? options[0];
  const Icon = current.Icon;

  return (
    <label className="relative mb-2 flex items-center rounded-lg border border-fd-border bg-fd-background text-sm shadow-xs">
      <Icon className="pointer-events-none absolute left-3 size-4 text-fd-muted-foreground" />
      <select
        aria-label="Theme"
        value={current.value}
        onChange={(e) => setTheme(e.target.value)}
        className="w-full cursor-pointer appearance-none bg-transparent py-2 pr-9 pl-9 text-fd-foreground outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-fd-muted-foreground" />
    </label>
  );
}
