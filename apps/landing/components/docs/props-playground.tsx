'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { RotateCcw, Check, Copy } from 'lucide-react';
import { cn } from '@innostes/ui';

export type PlaygroundControl =
  | {
      type: 'select';
      prop: string;
      label: string;
      options: { value: string; label: string }[] | readonly string[];
      defaultValue: string;
    }
  | {
      type: 'boolean';
      prop: string;
      label: string;
      defaultValue: boolean;
    }
  | {
      type: 'text';
      prop: string;
      label: string;
      defaultValue: string;
    }
  | {
      type: 'number';
      prop: string;
      label: string;
      defaultValue: number;
      min?: number;
      max?: number;
      step?: number;
    };

export interface PropsPlaygroundProps {
  /** The name of the component being previewed, e.g. "Button", "Badge", "Alert". */
  component: string;
  /** The interactive controls to expose in the playground toolbar. */
  controls: PlaygroundControl[];
  /** Renders the live component from the active control values. */
  render: (values: Record<string, any>) => ReactNode;
  /** Optional code generator. If omitted, generates standard JSX. */
  toCode?: (values: Record<string, any>) => string;
  /** Extra container classes. */
  className?: string;
}

export function PropsPlayground({
  component,
  controls,
  render,
  toCode,
  className,
}: PropsPlaygroundProps) {
  const initialValues = useMemo(() => {
    const acc: Record<string, any> = {};
    for (const c of controls) {
      acc[c.prop] = c.defaultValue;
    }
    return acc;
  }, [controls]);

  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [copied, setCopied] = useState(false);

  const setValue = (prop: string, val: any) => {
    setValues((prev) => ({ ...prev, [prop]: val }));
  };

  const code = useMemo(() => {
    if (toCode) return toCode(values);

    const propStrings: string[] = [];
    for (const c of controls) {
      const val = values[c.prop];
      if (val === undefined || val === c.defaultValue) continue;
      if (typeof val === 'boolean') {
        if (val) propStrings.push(c.prop);
      } else if (typeof val === 'number') {
        propStrings.push(`${c.prop}={${val}}`);
      } else if (typeof val === 'string' && val.length > 0) {
        propStrings.push(`${c.prop}="${val}"`);
      }
    }
    return `<${component}${propStrings.length ? ' ' + propStrings.join(' ') : ''} />`;
  }, [component, controls, toCode, values]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-slot="props-playground"
      className={cn(
        'not-prose my-6 flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-xs',
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <h3 className="text-sm font-semibold text-fd-foreground">
          {component} playground
        </h3>
        <button
          type="button"
          onClick={() => setValues(initialValues)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-fd-muted-foreground hover:text-fd-foreground"
        >
          <RotateCcw className="size-3.5" />
          Reset controls
        </button>
      </header>

      {/* Live Preview Area */}
      <div className="flex min-h-48 w-full items-center justify-center bg-background p-8">
        {render(values)}
      </div>

      {/* Control Grid */}
      <div className="border-t border-fd-border bg-fd-muted/20 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {controls.map((c) => {
            if (c.type === 'select') {
              const options = c.options.map((opt) =>
                typeof opt === 'string' ? { value: opt, label: opt } : opt,
              );
              return (
                <label key={c.prop} className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-fd-foreground">{c.label}</span>
                  <select
                    value={values[c.prop]}
                    onChange={(e) => setValue(c.prop, e.target.value)}
                    className="h-8 rounded-md border border-fd-border bg-fd-card px-2 text-xs text-fd-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }

            if (c.type === 'boolean') {
              return (
                <label
                  key={c.prop}
                  className="flex cursor-pointer items-center gap-2 pt-5 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(values[c.prop])}
                    onChange={(e) => setValue(c.prop, e.target.checked)}
                    className="size-4 rounded border-fd-border text-primary focus:ring-ring"
                  />
                  <span className="font-medium text-fd-foreground">{c.label}</span>
                </label>
              );
            }

            if (c.type === 'number') {
              return (
                <label key={c.prop} className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-fd-foreground">{c.label}</span>
                  <input
                    type="number"
                    value={values[c.prop]}
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    onChange={(e) => setValue(c.prop, Number(e.target.value))}
                    className="h-8 rounded-md border border-fd-border bg-fd-card px-2 text-xs text-fd-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              );
            }

            return (
              <label key={c.prop} className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-fd-foreground">{c.label}</span>
                <input
                  type="text"
                  value={values[c.prop]}
                  onChange={(e) => setValue(c.prop, e.target.value)}
                  className="h-8 rounded-md border border-fd-border bg-fd-card px-2 text-xs text-fd-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Generated Code */}
      <div className="relative border-t border-fd-border bg-fd-card px-4 py-3 font-mono text-xs text-fd-foreground">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-fd-muted-foreground uppercase">
            Generated Code
          </span>
          <button
            type="button"
            onClick={copyCode}
            aria-label="Copy generated JSX"
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-fd-muted-foreground hover:text-fd-foreground"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-success" />
                <span className="text-success">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="mt-2 overflow-x-auto whitespace-pre font-mono text-xs text-fd-foreground">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
