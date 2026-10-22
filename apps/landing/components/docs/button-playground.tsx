'use client';

import { useState, type ReactNode } from 'react';
import { Button, cn, type ButtonSize, type ButtonVariant } from '@innostes/ui';
import { ChevronDown, RotateCcw, Send } from 'lucide-react';

interface State {
  variant: ButtonVariant;
  size: ButtonSize;
  showIcon: boolean;
  iconPosition: 'left' | 'right';
  loading: boolean;
  disabled: boolean;
  fullWidth: boolean;
}

const initial: State = {
  variant: 'primary',
  size: 'md',
  showIcon: true,
  iconPosition: 'left',
  loading: false,
  disabled: false,
  fullWidth: true,
};

const variants: ButtonVariant[] = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
];
const sizes: { value: ButtonSize; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

function toCode(s: State) {
  const props: string[] = [];
  if (s.variant !== 'primary') props.push(`variant="${s.variant}"`);
  if (s.size !== 'md') props.push(`size="${s.size}"`);
  if (s.showIcon)
    props.push(
      `${s.iconPosition === 'left' ? 'startIcon' : 'endIcon'}={<Send />}`,
    );
  if (s.loading) props.push('loading');
  if (s.disabled) props.push('disabled');
  if (s.fullWidth) props.push('fullWidth');
  return `<Button${props.length ? ' ' + props.join(' ') : ''}>Click me</Button>`;
}

export function ButtonPlayground() {
  const [s, setS] = useState<State>(initial);
  const set = <K extends keyof State>(key: K, value: State[K]) =>
    setS((p) => ({ ...p, [key]: value }));

  return (
    <div className="not-prose rounded-xl border border-fd-border bg-fd-card p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-fd-foreground">
          Live Playground
        </h3>
        <button
          type="button"
          onClick={() => setS(initial)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary hover:underline"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Field label="Variant">
          <Select
            value={s.variant}
            onChange={(v) => set('variant', v as ButtonVariant)}
            options={variants.map((v) => ({
              value: v,
              label: v[0].toUpperCase() + v.slice(1),
            }))}
          />
        </Field>
        <Field label="Size">
          <Select
            value={s.size}
            onChange={(v) => set('size', v as ButtonSize)}
            options={sizes}
          />
        </Field>
        <Toggle
          label="Show icon"
          checked={s.showIcon}
          onChange={(v) => set('showIcon', v)}
        />
        <Field label="Icon position">
          <Select
            value={s.iconPosition}
            disabled={!s.showIcon}
            onChange={(v) => set('iconPosition', v as State['iconPosition'])}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </Field>
        <Toggle
          label="Loading"
          checked={s.loading}
          onChange={(v) => set('loading', v)}
        />
        <Toggle
          label="Disabled"
          checked={s.disabled}
          onChange={(v) => set('disabled', v)}
        />
        <Toggle
          label="Full width"
          checked={s.fullWidth}
          onChange={(v) => set('fullWidth', v)}
        />
      </div>

      <div className="mt-5 flex min-h-20 items-center justify-center rounded-lg border border-dashed border-fd-border p-4">
        <Button
          variant={s.variant}
          size={s.size}
          loading={s.loading}
          disabled={s.disabled}
          fullWidth={s.fullWidth}
          startIcon={
            s.showIcon && s.iconPosition === 'left' ? <Send /> : undefined
          }
          endIcon={
            s.showIcon && s.iconPosition === 'right' ? <Send /> : undefined
          }
        >
          Click me
        </Button>
      </div>

      <pre className="mt-3 rounded-md bg-fd-muted px-3 py-2 font-mono text-xs break-all whitespace-pre-wrap text-fd-foreground">
        {toCode(s)}
      </pre>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-fd-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full cursor-pointer appearance-none rounded-md border border-fd-border bg-fd-background pr-8 pl-3 text-sm text-fd-foreground outline-none focus-visible:ring-2 focus-visible:ring-fd-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 text-fd-muted-foreground" />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 self-end py-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none',
          checked ? 'bg-fd-primary' : 'bg-fd-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </button>
      <span className="text-sm text-fd-foreground">{label}</span>
    </label>
  );
}
