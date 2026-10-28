'use client';

import { useState } from 'react';
import {
  FormSection,
  FormGrid,
  Field,
  FieldLabel,
  FieldDescription,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Button,
  Card,
  toast,
} from '@innostes/ui';
import { Building2, Globe, Bell, Shield, Save, RotateCcw } from 'lucide-react';

interface SettingsState {
  orgName: string;
  legalEntity: string;
  gstin: string;
  currency: string;
  fiscalStart: string;
  timezone: string;
  whatsappAlerts: boolean;
  smsAlerts: boolean;
  weeklyDigest: boolean;
  enforce2FA: boolean;
  sessionTimeout: string;
}

const INITIAL_SETTINGS: SettingsState = {
  orgName: 'Northwind Traders Pvt Ltd',
  legalEntity: 'Northwind Logistics & Warehousing Private Limited',
  gstin: '29AABCN8291Q1ZH',
  currency: 'INR',
  fiscalStart: 'april',
  timezone: 'Asia/Kolkata',
  whatsappAlerts: true,
  smsAlerts: true,
  weeklyDigest: false,
  enforce2FA: true,
  sessionTimeout: '30',
};

export default function SettingsExample() {
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);
  const [initialSnapshot, setInitialSnapshot] = useState<SettingsState>(INITIAL_SETTINGS);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSnapshot);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setInitialSnapshot(settings);
    toast('Configuration committed', {
      description: 'Enterprise organization preferences updated across Northwind cloud instances.',
    });
  };

  const handleDiscard = () => {
    setSettings(initialSnapshot);
    toast('Changes discarded', {
      description: 'Form reset to last persisted configuration snapshot.',
    });
  };

  return (
    <div className="p-6 space-y-8 bg-background border rounded-lg max-w-4xl mx-auto relative pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Tenant preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure statutory corporate identity, notification dispatch, and security policy.
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1: Corporate Identity */}
        <FormSection
          title="Corporate & statutory registration"
          description="Legal identity and Goods and Services Tax compliance parameters."
        >
          <FormGrid>
            <Field id="org-name" className="sm:col-span-2">
              <FieldLabel>Trading name</FieldLabel>
              <Input
                value={settings.orgName}
                onChange={(e) => updateSetting('orgName', e.target.value)}
              />
              <FieldDescription>Brand identity displayed on invoices and purchase orders</FieldDescription>
            </Field>

            <Field id="legal-entity" className="sm:col-span-2">
              <FieldLabel>Registered legal entity</FieldLabel>
              <Input
                value={settings.legalEntity}
                onChange={(e) => updateSetting('legalEntity', e.target.value)}
              />
              <FieldDescription>As registered under Ministry of Corporate Affairs (MCA)</FieldDescription>
            </Field>

            <Field id="gstin">
              <FieldLabel>GSTIN</FieldLabel>
              <Input
                value={settings.gstin}
                onChange={(e) => updateSetting('gstin', e.target.value)}
                className="font-mono"
              />
              <FieldDescription>Karnataka state GST identification number</FieldDescription>
            </Field>

            <Field id="currency">
              <FieldLabel>Base ledger currency</FieldLabel>
              <Select
                value={settings.currency}
                onValueChange={(val) => {
                  if (val) updateSetting('currency', val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹) – Indian Rupee</SelectItem>
                  <SelectItem value="USD">USD ($) – US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR (€) – Euro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FormGrid>
        </FormSection>

        {/* Section 2: Regional & Fiscal Accounting */}
        <FormSection
          title="Fiscal calendar and timezone"
          description="Accounting year boundaries and statutory filing calendars."
        >
          <FormGrid>
            <Field id="fiscal-start">
              <FieldLabel>Fiscal year commencement</FieldLabel>
              <Select
                value={settings.fiscalStart}
                onValueChange={(val) => {
                  if (val) updateSetting('fiscalStart', val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Commencement date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="april">1 April (Standard Indian Fiscal Cycle)</SelectItem>
                  <SelectItem value="january">1 January (Calendar Year Cycle)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field id="timezone">
              <FieldLabel>Operational timezone</FieldLabel>
              <Select
                value={settings.timezone}
                onValueChange={(val) => {
                  if (val) updateSetting('timezone', val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Operational timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST +04:00)</SelectItem>
                  <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FormGrid>
        </FormSection>

        {/* Section 3: Notification Channels */}
        <FormSection
          title="Automated dispatch alerts"
          description="Configure realtime communication triggers for logistics and consignments."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">WhatsApp dispatch notifications</span>
                <p className="text-xs text-muted-foreground">
                  Send real-time consignment tracking links to client logistics leads upon gate dispatch.
                </p>
              </div>
              <Switch
                checked={settings.whatsappAlerts}
                onCheckedChange={(val) => updateSetting('whatsappAlerts', val)}
                aria-label="Toggle WhatsApp dispatch notifications"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">E-way bill SMS alerts</span>
                <p className="text-xs text-muted-foreground">
                  Notify freight drivers when e-way bills are auto-generated at the weighbridge.
                </p>
              </div>
              <Switch
                checked={settings.smsAlerts}
                onCheckedChange={(val) => updateSetting('smsAlerts', val)}
                aria-label="Toggle E-way bill SMS alerts"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">Weekly executive financial digest</span>
                <p className="text-xs text-muted-foreground">
                  Compile aggregated procurement commitments and send to directors on Monday mornings.
                </p>
              </div>
              <Switch
                checked={settings.weeklyDigest}
                onCheckedChange={(val) => updateSetting('weeklyDigest', val)}
                aria-label="Toggle weekly financial digest"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 4: Security Policy */}
        <FormSection
          title="Security and compliance"
          description="Multi-factor authentication and session inactivity boundaries."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground">
                  Mandatory 2FA for disbursement approvals
                </span>
                <p className="text-xs text-muted-foreground">
                  Require authenticator app OTP verification for invoice disbursements exceeding ₹1,00,000.
                </p>
              </div>
              <Switch
                checked={settings.enforce2FA}
                onCheckedChange={(val) => updateSetting('enforce2FA', val)}
                aria-label="Toggle mandatory 2FA"
              />
            </div>

            <Field id="session-timeout">
              <FieldLabel>Idle session timeout</FieldLabel>
              <Select
                value={settings.sessionTimeout}
                onValueChange={(val) => {
                  if (val) updateSetting('sessionTimeout', val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Session timeout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes (Recommended)</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>Automatically locks terminals after inactive duration</FieldDescription>
            </Field>
          </div>
        </FormSection>
      </div>

      {/* Floating / Sticky Save Bar when Unsaved Changes Exist */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between p-4 bg-background border-2 border-primary/40 shadow-xl rounded-xl">
            <div className="text-sm">
              <span className="font-semibold text-foreground">Unsaved modifications</span>
              <p className="text-xs text-muted-foreground">You have pending configuration updates.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDiscard}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Discard
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
