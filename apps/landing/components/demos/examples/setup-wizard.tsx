'use client';

import { useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  CountrySelect,
  DateFormatSelect,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Label,
  Form,
  FormActions,
  FormGrid,
  IconTile,
  Input,
  LanguageSelect,
  Stepper,
  TimezoneSelect,
  toast,
} from '@innostes/ui';
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Plug,
  Settings2,
  ShieldCheck,
} from 'lucide-react';

const steps = [
  { title: 'Organization', description: 'Basic details' },
  { title: 'Database', description: 'Connect & verify' },
  { title: 'Administrator', description: 'Create your account' },
  { title: 'Review', description: 'Confirm settings' },
  { title: 'Complete', description: 'Finish setup' },
];

const features = [
  {
    icon: <Plug />,
    tone: 'chart-1',
    title: 'Modular applications',
    text: 'ERP, CRM, HRMS and more',
  },
  {
    icon: <Code2 />,
    tone: 'chart-2',
    title: 'Developer tools',
    text: 'API logger, tester, analytics',
  },
  {
    icon: <ShieldCheck />,
    tone: 'chart-3',
    title: 'Self-hosted & secure',
    text: 'Your data, your infrastructure',
  },
  {
    icon: <Settings2 />,
    tone: 'chart-7',
    title: 'Quick setup',
    text: 'Up and running in minutes',
  },
] as const;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function SetupWizardExample() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('Acme Corporation');

  return (
    <div className="@container w-full">
      <div className="grid gap-8 bg-muted/40 p-6 @4xl:grid-cols-[minmax(0,22rem)_1fr] @4xl:p-10">
        {/* Brand panel */}
        <aside className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-lg font-bold tracking-tight">Ecosystem</span>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="info">Self-hosted</Badge>
              <Badge variant="info">Open source</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl leading-tight font-bold tracking-tight">
              One platform for your{' '}
              <span className="text-primary">business</span> and{' '}
              <span className="text-primary">tools</span>
            </h2>
            <p className="text-muted-foreground">
              Set up your organization and get your platform ready in a few
              simple steps.
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {features.map((f) => (
              <li key={f.title} className="flex items-center gap-3">
                <IconTile tone={f.tone} size="lg">
                  {f.icon}
                </IconTile>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{f.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {f.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Wizard */}
        <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <Stepper steps={steps} currentStep={step} onStepClick={setStep} />
          </div>

          <Form
            className="flex flex-col gap-6 p-6 @4xl:p-10"
            onFormSubmit={() => {
              if (step < steps.length - 1) setStep(step + 1);
              else toast.success('Setup complete');
            }}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-bold tracking-tight">
                Organization details
              </h3>
              <p className="text-muted-foreground">
                Let&apos;s start with your organization details. This will be
                your primary workspace.
                {step > 0 &&
                  ` (Step ${step + 1} of ${steps.length}: this demo reuses the first step's form.)`}
              </p>
            </div>

            <FormGrid>
              <Field name="name">
                <FieldLabel required>Organization name</FieldLabel>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <FieldDescription>
                  Your company or organization name.
                </FieldDescription>
                <FieldError />
              </Field>
              <Field name="slug">
                <FieldLabel required>Organization slug</FieldLabel>
                <Input
                  required
                  key={slugify(name)}
                  defaultValue={slugify(name)}
                  pattern="[a-z0-9-]+"
                />
                <FieldDescription>
                  Used in system URLs and identifiers (e.g. acme).
                </FieldDescription>
                <FieldError match="patternMismatch">
                  Use lowercase letters, numbers and dashes.
                </FieldError>
              </Field>
              <div className="flex flex-col gap-2">
                <Label htmlFor="wiz-country" required>
                  Country / Region
                </Label>
                <CountrySelect
                  id="wiz-country"
                  name="country"
                  defaultValue="IN"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="wiz-tz" required>
                  Time zone
                </Label>
                <TimezoneSelect
                  id="wiz-tz"
                  name="timeZone"
                  defaultValue="Asia/Kolkata"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="wiz-lang" required>
                  Default language
                </Label>
                <LanguageSelect
                  id="wiz-lang"
                  name="language"
                  defaultValue="en-IN"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="wiz-date">Date format</Label>
                <DateFormatSelect
                  id="wiz-date"
                  name="dateFormat"
                  defaultValue="DD/MM/YYYY"
                />
              </div>
            </FormGrid>

            <Alert variant="info">
              <AlertTitle>Why is this information required?</AlertTitle>
              <AlertDescription>
                It configures your platform, sets default preferences and
                creates your first organization. You can change these settings
                later in the administration panel.
              </AlertDescription>
            </Alert>

            <FormActions align="between">
              {step === 0 ? (
                <Button variant="outline">Cancel</Button>
              ) : (
                <Button
                  variant="outline"
                  startIcon={<ArrowLeft />}
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                endIcon={step < steps.length - 1 ? <ArrowRight /> : undefined}
              >
                {step < steps.length - 1 ? 'Next' : 'Finish setup'}
              </Button>
            </FormActions>
          </Form>
        </div>
      </div>
    </div>
  );
}
