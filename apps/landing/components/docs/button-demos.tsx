import type { CSSProperties } from 'react';
import { Button, type ButtonVariant } from '@innostes/ui';
import {
  ArrowRight,
  Download,
  ExternalLink,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { Preview, PreviewRow } from './preview';

/** The overview card at the top of the Button page. */
export function ButtonShowcase() {
  return (
    <Preview className="divide-y divide-fd-border p-6 [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
      <PreviewRow label="Variants">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </PreviewRow>
      <PreviewRow label="Sizes">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </PreviewRow>
      <PreviewRow label="With Icons">
        <Button startIcon={<Plus />}>Add Item</Button>
        <Button variant="secondary" startIcon={<Download />}>
          Download
        </Button>
        <Button variant="outline" endIcon={<ExternalLink />}>
          Learn more
        </Button>
      </PreviewRow>
      <PreviewRow label="States">
        <Button>Default</Button>
        <Button className="bg-primary-hover">Hover</Button>
        <Button className="bg-primary-hover brightness-90">Active</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </PreviewRow>
    </Preview>
  );
}

const variantInfo: {
  variant: ButtonVariant;
  title: string;
  text: string;
  dot: string;
}[] = [
  {
    variant: 'primary',
    title: 'Primary',
    text: 'Main action on the page.',
    dot: 'bg-primary',
  },
  {
    variant: 'secondary',
    title: 'Secondary',
    text: 'For less important actions.',
    dot: 'bg-secondary-hover',
  },
  {
    variant: 'outline',
    title: 'Outline',
    text: 'A subtle button with a border.',
    dot: 'border-2 border-primary bg-transparent',
  },
  {
    variant: 'ghost',
    title: 'Ghost',
    text: 'Minimal, no background.',
    dot: 'bg-muted',
  },
  {
    variant: 'destructive',
    title: 'Destructive',
    text: 'For dangerous actions.',
    dot: 'bg-destructive',
  },
  {
    variant: 'link',
    title: 'Link',
    text: 'Looks like a text link.',
    dot: 'bg-primary/40',
  },
];

/** Cards describing each variant, each with a live example. */
export function VariantCards() {
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {variantInfo.map((v) => (
        <div
          key={v.variant}
          className="flex flex-col gap-4 rounded-xl border border-fd-border bg-fd-card p-4"
        >
          <div className="flex items-start gap-3">
            <span className={`mt-1 size-3 shrink-0 rounded-full ${v.dot}`} />
            <div>
              <div className="text-sm font-semibold text-fd-foreground">
                {v.title}
              </div>
              <div className="text-xs text-fd-muted-foreground">{v.text}</div>
            </div>
          </div>
          <div>
            <Button variant={v.variant} size="sm">
              {v.title}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SizesDemo() {
  return (
    <Preview>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </Preview>
  );
}

export function IconsDemo() {
  return (
    <Preview>
      <div className="flex flex-wrap items-center gap-3">
        <Button startIcon={<Plus />}>Add item</Button>
        <Button variant="outline" endIcon={<ArrowRight />}>
          Continue
        </Button>
        <Button variant="secondary" iconOnly aria-label="Settings">
          <Settings />
        </Button>
        <Button variant="ghost" iconOnly aria-label="Close">
          <X />
        </Button>
        <Button variant="destructive" iconOnly size="sm" aria-label="Delete">
          <Trash2 />
        </Button>
      </div>
    </Preview>
  );
}

export function LoadingDemo() {
  return (
    <Preview>
      <div className="flex flex-wrap items-center gap-3">
        <Button loading>Save</Button>
        <Button loading loadingText="Saving…">
          Save
        </Button>
        <Button variant="outline" loading startIcon={<Download />}>
          Download
        </Button>
        <Button variant="secondary" iconOnly loading aria-label="Refreshing">
          <Settings />
        </Button>
      </div>
    </Preview>
  );
}

export function DisabledDemo() {
  return (
    <Preview>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled>Disabled</Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
        <Button variant="outline" disabled focusableWhenDisabled>
          Focusable when disabled
        </Button>
      </div>
    </Preview>
  );
}

export function FullWidthDemo() {
  return (
    <Preview>
      <div className="mx-auto flex max-w-sm flex-col gap-3">
        <Button fullWidth>Sign in</Button>
        <Button fullWidth variant="outline">
          Create account
        </Button>
      </div>
    </Preview>
  );
}

export function AsLinkDemo() {
  return (
    <Preview>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          render={<a href="#theming" />}
          nativeButton={false}
          endIcon={<ArrowRight />}
        >
          Go to theming
        </Button>
        <Button
          variant="outline"
          render={
            <a href="https://base-ui.com" target="_blank" rel="noreferrer" />
          }
          nativeButton={false}
          endIcon={<ExternalLink />}
        >
          Base UI
        </Button>
      </div>
    </Preview>
  );
}

export function ThemingDemo() {
  return (
    <Preview>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="flex flex-col items-start gap-2">
          <span className="text-xs font-medium text-fd-muted-foreground">
            Default
          </span>
          <Button>Continue</Button>
        </div>
        <div
          className="flex flex-col items-start gap-2"
          style={
            {
              '--color-primary': 'var(--color-emerald-600)',
              '--color-primary-hover': 'var(--color-emerald-700)',
            } as CSSProperties
          }
        >
          <span className="text-xs font-medium text-fd-muted-foreground">
            Emerald primary
          </span>
          <Button>Continue</Button>
        </div>
        <div
          className="flex flex-col items-start gap-2"
          style={
            {
              '--color-primary': 'var(--color-violet-600)',
              '--color-primary-hover': 'var(--color-violet-700)',
            } as CSSProperties
          }
        >
          <span className="text-xs font-medium text-fd-muted-foreground">
            Violet + rounded
          </span>
          <Button className="rounded-full">Continue</Button>
        </div>
      </div>
    </Preview>
  );
}
