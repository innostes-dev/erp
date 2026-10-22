import { Button } from '@innostes/ui';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ShieldCheck,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

const features = [
  {
    Icon: Boxes,
    title: 'Operations',
    text: 'Keep stock, orders and suppliers in one place.',
  },
  {
    Icon: Wallet,
    title: 'Finance',
    text: 'Invoices, payments and reports that add up.',
  },
  {
    Icon: Users,
    title: 'People',
    text: 'Teams, roles and approvals without the spreadsheets.',
  },
  {
    Icon: BarChart3,
    title: 'Insights',
    text: 'Dashboards that show how the business is doing.',
  },
  {
    Icon: ShieldCheck,
    title: 'Secure',
    text: 'Role-based access and an audit trail for every change.',
  },
  {
    Icon: Zap,
    title: 'Fast',
    text: 'A modern interface built on the innostes design system.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-fd-border">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--color-blue-100),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-blue-500)_20%,transparent),transparent_60%)]" />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center md:py-32">
          <span className="mb-6 rounded-full border border-fd-border bg-fd-background px-3 py-1 text-xs font-medium text-fd-muted-foreground">
            Now building with innostes UI
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-fd-foreground md:text-6xl">
            Run your whole business from one place
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-fd-muted-foreground">
            innostes brings operations, finance and people together in a single,
            simple platform.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              endIcon={<ArrowRight />}
              render={<a href="#features" />}
              nativeButton={false}
            >
              Explore features
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href="/ui" />}
              nativeButton={false}
            >
              Our design system
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-5xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-fd-foreground">
          Everything in one platform
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-fd-muted-foreground">
          Replace a stack of disconnected tools with one system your whole team
          can use.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-fd-border bg-fd-card p-6"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-fd-accent text-fd-accent-foreground">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold text-fd-foreground">{title}</h3>
              <p className="mt-1 text-sm text-fd-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-24">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-blue-600 px-6 py-14 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to get started?
          </h2>
          <p className="max-w-lg text-blue-100">
            Talk to us and see innostes in action.
          </p>
          <Button
            size="lg"
            variant="secondary"
            render={<a href="mailto:hello@example.com" />}
            nativeButton={false}
          >
            Contact us
          </Button>
        </div>
      </section>

      <footer className="border-t border-fd-border py-8 text-center text-sm text-fd-muted-foreground">
        © {new Date().getFullYear()} innostes
      </footer>
    </main>
  );
}
