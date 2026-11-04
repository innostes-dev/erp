'use client';

import React, { useState } from 'react';
import { Button } from '@innostes/ui';
import { Check, Mail, Phone, Building2, User, HelpCircle, X, ShieldCheck } from 'lucide-react';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultModule?: string;
}

export function QuoteModal({ isOpen, onClose, defaultModule }: QuoteModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    serviceType: 'assisted-setup',
    preferredCloud: 'aws',
    notes: defaultModule ? `Interested in assisted deployment and tailoring for ${defaultModule}.` : '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="bento-card relative z-10 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl text-left">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="size-7 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Quote Request Received
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Thank you for reaching out. An Innostes platform architect will review your
              requirements and contact you at <span className="font-semibold text-slate-900 dark:text-white">{formData.email}</span> within 24 business hours.
            </p>
            <div className="mt-8">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-all"
              >
                Return to Site
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-white/80 px-3.5 py-1 text-xs font-semibold text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 shadow-2xs mb-2">
                <ShieldCheck className="size-3.5 text-blue-500" />
                <span>Enterprise Advisory &amp; Deployment</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Request a <span className="gradient-cadence">Custom Quote</span>
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Self-hosting Innostes is 100% free with zero seat taxes. For turnkey cloud provisioning, HA clustering, database migration, or bespoke modules, connect directly with our engineering team.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Organization / Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Acme Global Inc."
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Engagement Scope *
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="assisted-setup">Assisted Cloud Setup &amp; Sizing</option>
                    <option value="custom-module">Custom Module Engineering</option>
                    <option value="migration">Data Migration &amp; Onboarding</option>
                    <option value="managed-ops">Managed Infrastructure &amp; SLA</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Infrastructure
                  </label>
                  <select
                    value={formData.preferredCloud}
                    onChange={(e) => setFormData({ ...formData, preferredCloud: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="aws">Amazon Web Services (AWS)</option>
                    <option value="gcp">Google Cloud Platform (GCP)</option>
                    <option value="azure">Microsoft Azure</option>
                    <option value="bare-metal">On-Premises / Bare Metal</option>
                    <option value="undecided">Undecided / Need Consultation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Specific Requirements or Legacy Stack
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your team size, modules required, or integrations needed..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-full bg-slate-950 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Submit Quote Request
                </button>
                <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  Zero spam. We evaluate every inquiry with our technical engineering leads.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
