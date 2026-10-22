import type { Metadata } from 'next';
import { Button } from '@innostes/ui';
import {
  Accessibility,
  ArrowRight,
  Code2,
  Download,
  Layers,
  Moon,
  Package,
  Palette,
  Plus,
  Trash2,
  Wind,
} from 'lucide-react';
import { InstallCommand } from '@/components/docs/install-command';
import { uiName, uiPackage, uiVersion } from '@/lib/shared';

export const metadata: Metadata = {
  title: 'Design System',
  description:
    'innostes UI: accessible React components that follow your Tailwind theme.',
};

const principles = [
  {
    Icon: Palette,
    title: 'Themeable by design',
    text: 'Every colour is a token. Set it in your Tailwind theme and every component updates.',
  },
  {
    Icon: Accessibility,
    title: 'Accessible first',
    text: 'Built on Base UI: keyboard support, focus management and ARIA out of the box.',
  },
  {
    Icon: Wind,
    title: 'Tailwind native',
    text: 'Components share your Tailwind setup. No Tailwind? Import one small stylesheet.',
  },
  {
    Icon: Code2,
    title: 'Made for developers',
    text: 'Typed props, sensible defaults, render-as-link, and className that always wins.',
  },
  {
    Icon: Moon,
    title: 'Light and dark',
    text: 'Redefine the tokens for your dark theme and the components follow.',
  },
  {
    Icon: Package,
    title: 'One package',
    text: `Install ${uiPackage} from npm. ESM, tree-shakable, ready for Next.js.`,
  },
];

const swatches = [
  { name: 'primary', className: 'bg-primary' },
  { name: 'secondary', className: 'bg-secondary' },
  { name: 'muted', className: 'bg-muted' },
  { name: 'destructive', className: 'bg-destructive' },
  { name: 'border', className: 'bg-border' },
  { name: 'ring', className: 'bg-ring' },
];

export default function UiPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="border-b border-fd-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-fd-border px-3 py-1 text-xs font-medium text-fd-muted-foreground">
              <Layers className="size-3.5" /> {uiName} · v{uiVersion}
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-fd-foreground md:text-6xl">
              One design system for every innostes product
            </h1>
            <p className="mt-6 max-w-xl text-lg text-fd-muted-foreground">
              Accessible React components, styled with Tailwind CSS and driven
              by design tokens. Bring your own theme, or use ours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                endIcon={<ArrowRight />}
                render={<a href="/ui/docs" />}
                nativeButton={false}
              >
                Read the docs
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<a href="/ui/docs/components/actions/button" />}
                nativeButton={false}
              >
                Browse components
              </Button>
            </div>
            <InstallCommand
              command={`pnpm add ${uiPackage}`}
              className="mt-8 max-w-sm"
            />
          </div>

          {/* Live sample */}
          <div className="rounded-2xl border border-fd-border bg-fd-card p-6 shadow-sm">
            <div className="mb-4 text-xs font-medium tracking-wide text-fd-muted-foreground uppercase">
              Live components
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" startIcon={<Plus />}>
                  Add item
                </Button>
                <Button size="sm" variant="secondary" startIcon={<Download />}>
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  iconOnly
                  aria-label="Delete"
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button loading loadingText="Saving…">
                  Save
                </Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-fd-foreground">
          Principles
        </h2>
        <p className="mt-3 max-w-2xl text-fd-muted-foreground">
          What every component in {uiName} is built to do.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-fd-border bg-fd-card p-6"
            >
              <Icon className="mb-4 size-6 text-fd-primary" />
              <h3 className="font-semibold text-fd-foreground">{title}</h3>
              <p className="mt-1 text-sm text-fd-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tokens */}
      <section className="border-y border-fd-border bg-fd-muted/50">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-fd-foreground">
              Design tokens
            </h2>
            <p className="mt-3 text-fd-muted-foreground">
              Components never use raw colours. They use semantic tokens with
              defaults from Tailwind's palette, so your theme always wins.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {swatches.map((s) => (
                <div
                  key={s.name}
                  className="overflow-hidden rounded-lg border border-fd-border bg-fd-card"
                >
                  <div className={`h-14 ${s.className}`} />
                  <div className="px-3 py-2 font-mono text-xs text-fd-foreground">
                    {s.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <SetupCard
              title="With Tailwind CSS"
              text="Components share your theme. Override any token."
              code={`@import 'tailwindcss';
@import '${uiPackage}/tailwind.css';

@theme {
  --color-primary: var(--color-emerald-600);
}`}
            />
            <SetupCard
              title="Without Tailwind CSS"
              text="One precompiled stylesheet with the default theme."
              code={`import '${uiPackage}/styles.css';`}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-fd-foreground">
          Start building
        </h2>
        <p className="mt-3 max-w-lg text-fd-muted-foreground">
          Install the package, add the styles, and use your first component in
          minutes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            render={<a href="/ui/docs/installation" />}
            nativeButton={false}
          >
            Installation guide
          </Button>
          <Button
            size="lg"
            variant="ghost"
            render={<a href="/ui/docs/theming" />}
            nativeButton={false}
          >
            Theming
          </Button>
        </div>
      </section>
    </main>
  );
}

function SetupCard({
  title,
  text,
  code,
}: {
  title: string;
  text: string;
  code: string;
}) {
  return (
    <div className="rounded-xl border border-fd-border bg-fd-card p-5">
      <h3 className="font-semibold text-fd-foreground">{title}</h3>
      <p className="mt-1 text-sm text-fd-muted-foreground">{text}</p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
        {code}
      </pre>
    </div>
  );
}
