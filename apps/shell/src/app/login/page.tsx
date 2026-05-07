import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from '@mono/kernel/auth/server';
import { LoginForm } from '../../components/login-form';
import { MODULES } from '../../lib/modules';

export const metadata: Metadata = { title: 'Sign in | Mono' };

export default async function LoginPage() {
  const user = await getServerSession();
  if (user) redirect('/');

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-12 lg:flex">
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />

        {/* Glow orbs */}
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-600 opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-indigo-500 opacity-20 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
              <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">Mono</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-4">
          <h1 className="text-5xl font-bold leading-tight text-white">
            One platform.<br />Every team.
          </h1>
          <p className="text-lg text-indigo-200/80">
            Your enterprise workspace for {MODULES.length} integrated modules — all in one place.
          </p>
        </div>

        {/* Floating module pills */}
        <div className="relative z-10 space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-indigo-400">
            Available modules
          </p>
          <div className="flex flex-wrap gap-2">
            {MODULES.map((mod) => (
              <span
                key={mod.id}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-sm"
              >
                <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${mod.gradient}`} />
                {mod.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-900">Mono</span>
        </div>

        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1.5 text-sm text-gray-500">Sign in to your workspace to continue.</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
