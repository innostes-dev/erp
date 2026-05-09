import Link from 'next/link';

export default function MarketingHomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-sm uppercase tracking-widest text-secondary">Innostes Business OS</p>
      <h1 className="mt-3 text-5xl font-semibold text-white">Build your company OS on one modular platform.</h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-300">
        Multi-tenant business infrastructure with plug-and-play modules, secure tenant isolation, and first-class
        APIs.
      </p>
      <div className="mt-10 flex gap-4">
        <Link href="/docs" className="rounded-lg bg-primary px-5 py-3 text-white">
          Open API Docs
        </Link>
        <a href="http://localhost:3000/hrms" className="rounded-lg border border-slate-700 px-5 py-3 text-slate-200">
          Open OS Shell
        </a>
      </div>
    </main>
  );
}
