'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { cn } from '../lib/cn';

type Step = 'email' | 'sent';

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Simulate network delay — swap for real API call when email service is wired
      await new Promise((r) => setTimeout(r, 1200));
      setStep('sent');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'sent') {
    return (
      <div className="space-y-6 text-center lg:text-left">
        {/* Success icon */}
        <div className="flex justify-center lg:justify-start">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-500">
            If <span className="font-medium text-gray-700">{email}</span> is associated with a Mono
            account, you'll receive reset instructions within a few minutes.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Didn't receive it? Check your spam folder or wait a minute before trying again.
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { setStep('email'); setEmail(''); }}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
              'bg-indigo-600 text-sm font-semibold text-white shadow-sm',
              'hover:bg-indigo-500 transition-all duration-150',
            )}
          >
            Try a different email
          </button>

          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={cn(
            'block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm',
            'placeholder:text-gray-400',
            'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
            'transition-all duration-150',
          )}
        />
        <p className="text-xs text-gray-400">
          We'll send reset instructions to this address if it's linked to a Mono account.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
          'bg-indigo-600 text-sm font-semibold text-white shadow-sm',
          'hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'transition-all duration-150',
        )}
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Sending instructions…
          </>
        ) : (
          'Send reset instructions'
        )}
      </button>

      <Link
        href="/login"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to sign in
      </Link>
    </form>
  );
}
