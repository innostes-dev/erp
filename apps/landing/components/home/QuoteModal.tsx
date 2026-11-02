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
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-fd-border bg-fd-background p-6 shadow-2xl md:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="size-7 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-fd-foreground">
              Quote Request Received
            </h3>
            <p className="mt-2 max-w-md text-sm text-fd-muted-foreground">
              Thank you for reaching out. An Innostes deployment engineer will review your
              requirements and contact you at <span className="font-semibold text-fd-foreground">{formData.email}</span> within 24 business hours.
            </p>
            <div className="mt-8">
              <Button size="md" onClick={onClose}>
                Return to Site
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <ShieldCheck className="size-3.5" />
                Enterprise Advisory & Deployment
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-fd-foreground">
                Request a Custom Quote
              </h2>
              <p className="mt-1 text-sm text-fd-muted-foreground">
                Self-hosting Innostes is 100% free. For turnkey infrastructure provisioning, database migration, or custom module engineering, talk directly to our team.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fd-foreground">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-fd-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-fd-border bg-fd-card py-2 pl-9 pr-3 text-sm text-fd-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fd-foreground">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-fd-muted-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-fd-border bg-fd-card py-2 pl-9 pr-3 text-sm text-fd-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-fd-foreground">
                  Organization / Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 size-4 text-fd-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Acme Global Inc."
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-lg border border-fd-border bg-fd-card py-2 pl-9 pr-3 text-sm text-fd-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fd-foreground">
                    Engagement Scope *
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full rounded-lg border border-fd-border bg-fd-card px-3 py-2 text-sm text-fd-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="assisted-setup">Assisted Cloud Setup & Sizing</option>
                    <option value="custom-module">Custom Module Engineering</option>
                    <option value="migration">Data Migration & Onboarding</option>
                    <option value="managed-ops">Managed Infrastructure & SLA</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-fd-foreground">
                    Target Infrastructure
                  </label>
                  <select
                    value={formData.preferredCloud}
                    onChange={(e) => setFormData({ ...formData, preferredCloud: e.target.value })}
                    className="w-full rounded-lg border border-fd-border bg-fd-card px-3 py-2 text-sm text-fd-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="mb-1.5 block text-xs font-medium text-fd-foreground">
                  Specific Requirements or Legacy Stack
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your team size, modules required, or integrations needed..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-fd-border bg-fd-card p-3 text-sm text-fd-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" size="lg" className="w-full">
                  Submit Quote Request
                </Button>
                <p className="mt-2 text-center text-xs text-fd-muted-foreground">
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
