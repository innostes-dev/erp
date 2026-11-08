'use client';

import React, { useState } from 'react';
import { Button } from '@innostes/ui';
import { Check, Mail, Phone, Building2, User, HelpCircle, X, ShieldCheck } from 'lucide-react';

/** External email API (POST { emailto, subject, body, replyTo }). */
const CONTACT_API_URL = process.env.NEXT_PUBLIC_CONTACT_API_URL || 'https://api.innostes.com';

export type QuoteVariant = 'demo' | 'build';

interface QuoteModalProps {
  variant?: QuoteVariant;
  isOpen: boolean;
  onClose: () => void;
  defaultModule?: string;
}

export function QuoteModal({ isOpen, onClose, defaultModule, variant = 'demo' }: QuoteModalProps) {
  const isBuild = variant === 'build';
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    serviceType: isBuild ? 'custom-module' : 'assisted-setup',
    preferredCloud: 'aws',
    notes: isBuild || !defaultModule ? '' : `Interested in a demo of ${defaultModule}.`,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      // Honeypot: bots fill the hidden "website" field; pretend success and send nothing.
      if (new FormData(e.currentTarget).get('website')) {
        setSubmitted(true);
        return;
      }
      const type = isBuild ? 'Talk to an engineer' : 'Book a demo';
      const body = [
        `Request: ${type}`,
        `Name: ${formData.name}`,
        `Email: ${formData.email}`,
        `Company: ${formData.company}`,
        defaultModule && `From: ${defaultModule}`,
        !isBuild && `Scope: ${formData.serviceType}`,
        !isBuild && `Infrastructure: ${formData.preferredCloud}`,
        '',
        'Message:',
        formData.notes || '(none)',
      ]
        .filter((line) => line !== false && line !== undefined)
        .join('\n');
      const res = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailto: 'innostes@gmail.com',
          subject: `${type}: ${formData.name} (${formData.company})`,
          body,
          replyTo: formData.email,
        }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: '' }));
        throw new Error(msg || 'Something went wrong.');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please email innostes@gmail.com.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="bento-card relative z-10 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl text-left">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-strong-foreground dark:hover:bg-card dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-success-bg text-success-text ">
              <Check className="size-7 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
              {isBuild ? 'Thanks, we have your problem' : 'Request received'}
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
              {isBuild
                ? 'An engineer from our core team will read it and reply to'
                : 'Our team will reply to'}{' '} <span className="font-semibold text-foreground dark:text-white">{formData.email}</span> within one business day.
            </p>
            <div className="mt-8">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full bg-brand-navy px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-navy dark:bg-card transition-all"
              >
                Return to Site
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-semibold text-foreground dark:border-white/10 dark:bg-card shadow-2xs mb-2">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>{isBuild ? 'Problem first, software second' : 'Book a demo'}</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground dark:text-white">
                {isBuild ? (
                  <>Talk to an <span className="gradient-cadence">engineer</span></>
                ) : (
                  <>See INNOSTES <span className="gradient-cadence">with your workflows</span></>
                )}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isBuild
                  ? "You'll speak with an engineer from the team that built INNOSTES, not a salesperson. Tell us what isn't working; we'll start there."
                  : 'A 30-minute walkthrough with our team, shaped around how your company runs.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot for bots; hidden from people and assistive tech */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-strong-foreground ">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-subtle-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-border bg-card dark:border-white/10 dark:bg-card py-2 pl-9 pr-3 text-sm text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-strong-foreground ">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-subtle-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-border bg-card dark:border-white/10 dark:bg-card py-2 pl-9 pr-3 text-sm text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-strong-foreground ">
                  Organization / Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 size-4 text-subtle-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Acme Global Inc."
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-xl border border-border bg-card dark:border-white/10 dark:bg-card py-2 pl-9 pr-3 text-sm text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {!isBuild && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-strong-foreground ">
                    Engagement Scope *
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full rounded-xl border border-border bg-card dark:border-white/10 px-3 py-2 text-sm text-foreground dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="assisted-setup">Assisted Cloud Setup &amp; Sizing</option>
                    <option value="custom-module">Custom Module Engineering</option>
                    <option value="migration">Data Migration &amp; Onboarding</option>
                    <option value="managed-ops">Managed Infrastructure &amp; SLA</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-strong-foreground ">
                    Target Infrastructure
                  </label>
                  <select
                    value={formData.preferredCloud}
                    onChange={(e) => setFormData({ ...formData, preferredCloud: e.target.value })}
                    className="w-full rounded-xl border border-border bg-card dark:border-white/10 px-3 py-2 text-sm text-foreground dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="aws">Amazon Web Services (AWS)</option>
                    <option value="gcp">Google Cloud Platform (GCP)</option>
                    <option value="azure">Microsoft Azure</option>
                    <option value="bare-metal">On-Premises / Bare Metal</option>
                    <option value="undecided">Undecided / Need Consultation</option>
                  </select>
                </div>
              </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-strong-foreground ">
                  {isBuild ? "What's not working today? *" : 'Anything we should know?'}
                </label>
                <textarea
                  rows={3}
                  required={isBuild}
                  placeholder={
                    isBuild
                      ? 'e.g. We track hours in one tool, then re-type them into timesheets to invoice clients…'
                      : 'Team size, the modules you care about, how you work today…'
                  }
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card dark:border-white/10 dark:bg-card p-3 text-sm text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-2">
                {error && (
                  <p role="alert" className="mb-3 rounded-xl bg-error-bg px-3 py-2 text-sm text-error-text">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-full bg-brand-navy py-3.5 text-sm font-semibold text-white shadow-md hover:bg-brand-navy dark:bg-card transition-all cursor-pointer disabled:cursor-wait disabled:opacity-70"
                >
                  {sending ? 'Sending…' : isBuild ? 'Send to our engineers' : 'Book my demo'}
                </button>
                <p className="mt-2 text-center text-xs text-muted-foreground ">
                  No spam. A real person reads every message.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
