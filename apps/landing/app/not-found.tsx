import Link from 'next/link';
import { ArrowLeft, BookOpen, Compass, Home, Layers, Search } from 'lucide-react';
import { Button } from '@innostes/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
          404 Error
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The documentation page you are looking for does not exist or has been moved to a new section in the navigation hierarchy.
        </p>

        {/* Quick Search Action */}
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Button
            render={<Link href="/ui/docs" />}
            variant="primary"
            className="w-full sm:w-auto"
            startIcon={<Home className="size-4" />}
          >
            Documentation home
          </Button>
          <Button
            render={<Link href="/ui/docs/components/actions/button" />}
            variant="outline"
            className="w-full sm:w-auto"
            startIcon={<Layers className="size-4" />}
          >
            Component directory
          </Button>
        </div>

        {/* Popular destinations */}
        <div className="mt-12 w-full border-t border-border pt-8 text-start">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Popular destinations
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <li>
              <Link
                href="/ui/docs/installation"
                className="group flex items-center gap-2.5 rounded-lg border border-border p-3 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:border-primary/40"
              >
                <Compass className="size-4 text-muted-foreground group-hover:text-primary" />
                <span>Installation guide</span>
              </Link>
            </li>
            <li>
              <Link
                href="/ui/docs/theming"
                className="group flex items-center gap-2.5 rounded-lg border border-border p-3 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:border-primary/40"
              >
                <BookOpen className="size-4 text-muted-foreground group-hover:text-primary" />
                <span>Theming & design tokens</span>
              </Link>
            </li>
            <li>
              <Link
                href="/ui/docs/examples/dashboard"
                className="group flex items-center gap-2.5 rounded-lg border border-border p-3 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:border-primary/40"
              >
                <Layers className="size-4 text-muted-foreground group-hover:text-primary" />
                <span>ERP Dashboard example</span>
              </Link>
            </li>
            <li>
              <Link
                href="/docs"
                className="group flex items-center gap-2.5 rounded-lg border border-border p-3 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:border-primary/40"
              >
                <Search className="size-4 text-muted-foreground group-hover:text-primary" />
                <span>Developer architecture</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
