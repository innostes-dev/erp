import { useState, type ReactNode } from 'react';
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
  Form,
  FormActions,
  FormGrid,
  IconTile,
  Input,
  Label,
  LanguageSelect,
  Stepper,
  TimezoneSelect,
} from '@innostes/ui';
import { ArrowLeft, ArrowRight, Code2, KeyRound, Plug, RefreshCw, Settings2, ShieldCheck } from 'lucide-react';

import { ApiError } from '../core/api/client';
import { HttpStatus } from '../core/api/http-status';
import { getSetupChecks, getSetupStatus, runSetup, SetupErrorCode } from './api';
import { slugify } from './slug';
import type { OrganizationInput, SetupChecks, SetupResult } from './types';

/** Wizard steps. To add the Administrator step later, insert it before Review. */
const STEPS = [
  { title: 'Verify', description: 'Setup token' },
  { title: 'Organization', description: 'Basic details' },
  { title: 'Database', description: 'Connect & verify' },
  { title: 'Review', description: 'Confirm settings' },
  { title: 'Complete', description: 'Finish setup' },
] as const;

const VERIFY = 0;
const ORGANIZATION = 1;
const DATABASE = 2;
const REVIEW = 3;
const COMPLETE = 4;

const FEATURES = [
  { icon: <Plug />, tone: 'chart-1', title: 'Modular applications', text: 'ERP, CRM, HRMS and more' },
  { icon: <Code2 />, tone: 'chart-2', title: 'Developer tools', text: 'API logger, tester, analytics' },
  { icon: <ShieldCheck />, tone: 'chart-3', title: 'Self-hosted & secure', text: 'Your data, your infrastructure' },
  { icon: <Settings2 />, tone: 'chart-7', title: 'Quick setup', text: 'Up and running in minutes' },
] as const;

/** Sensible defaults from the browser: time zone, language and the language's country. */
function browserDefaults(): Pick<OrganizationInput, 'country' | 'timezone' | 'language' | 'date_format'> {
  const language = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  const region = language.split('-')[1];
  return {
    language,
    country: region && region.length === 2 ? region.toUpperCase() : null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    date_format: 'DD/MM/YYYY',
  };
}

export interface SetupWizardProps {
  /** Called when the user leaves the finished wizard ("Go to app"), or setup turns out to be done already. */
  onComplete: () => void;
}

/**
 * The first-run setup wizard: verify the setup token, organization details,
 * database check, review, install.
 *
 * The token is kept in component state only (never stored) and sent as
 * `X-Setup-Token` on every setup call. Showing or hiding the wizard is the job
 * of `SetupGate`, which lazy-loads this module as its own bundle.
 */
export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(VERIFY);
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [org, setOrg] = useState<OrganizationInput>(() => ({ name: '', slug: '', ...browserDefaults() }));
  const [slugEdited, setSlugEdited] = useState(false);
  const [checks, setChecks] = useState<SetupChecks | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SetupResult | null>(null);

  const update = (patch: Partial<OrganizationInput>) => setOrg((o) => ({ ...o, ...patch }));

  /** Setup routes answered 404: either setup is done, or web setup is disabled on the server. */
  async function handleSetupGone() {
    const latest = await getSetupStatus().catch(() => null);
    if (latest?.installed) {
      onComplete();
      return;
    }
    setTokenError(null);
    setError(
      'Web setup is disabled on this server (SETUP_ENABLED=false). ' +
        'Set the system up from the server instead: python -m kernel.setup install --help',
    );
    setStep(VERIFY);
  }

  /** Shared handling of setup API errors. Returns true if it fully handled the error. */
  function handleApiError(e: unknown): boolean {
    if (!(e instanceof ApiError)) {
      setError(e instanceof Error ? e.message : String(e));
      return true;
    }
    if (e.status === HttpStatus.NOT_FOUND) {
      void handleSetupGone();
      return true;
    }
    if (e.status === HttpStatus.UNAUTHORIZED) {
      setTokenError('That setup token is not valid. Check the API server log or SETUP_TOKEN in .env.');
      setStep(VERIFY);
      return true;
    }
    if (e.status === HttpStatus.TOO_MANY_REQUESTS) {
      const wait = e.retryAfter ? ` Try again in ${Math.ceil(e.retryAfter / 60)} minute(s).` : '';
      setTokenError(`Too many invalid attempts.${wait}`);
      setStep(VERIFY);
      return true;
    }
    if (e.code === SetupErrorCode.DATABASE_UNAVAILABLE) {
      setChecks({ database_connected: false, migrations_pending: 0 });
      return false;
    }
    setError(e.message);
    return true;
  }

  async function verify() {
    setBusy(true);
    setTokenError(null);
    setError(null);
    const value = token.trim();
    try {
      setChecks(await getSetupChecks(value));
      setToken(value);
      setStep(ORGANIZATION);
    } catch (e) {
      if (e instanceof ApiError && e.code === SetupErrorCode.DATABASE_UNAVAILABLE) {
        // The token can't be verified while the database is down (availability is checked first).
        setTokenError(
          'The server cannot reach its database, so the token cannot be checked yet. ' +
            'Check the database settings in the server .env, then verify again.',
        );
      } else {
        handleApiError(e);
      }
    } finally {
      setBusy(false);
    }
  }

  async function recheck() {
    setBusy(true);
    setError(null);
    try {
      setChecks(await getSetupChecks(token));
    } catch (e) {
      handleApiError(e);
    } finally {
      setBusy(false);
    }
  }

  async function install() {
    setBusy(true);
    setError(null);
    try {
      setResult(await runSetup({ organization: org }, token));
      setToken('');
      setStep(COMPLETE);
    } catch (e) {
      if (e instanceof ApiError && e.status === HttpStatus.CONFLICT) {
        // Either another request finished setup, or the slug is taken.
        const latest = await getSetupStatus().catch(() => null);
        if (latest?.installed) return onComplete();
        setError(e.message);
      } else if (!handleApiError(e)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }

  const canGoTo = (index: number) => step !== COMPLETE && index > VERIFY && index < step;

  return (
    <div className="@container min-h-svh w-full bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 p-6 @4xl:grid-cols-[minmax(0,22rem)_1fr] @4xl:p-10">
        <BrandPanel />

        <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <Stepper
              steps={STEPS}
              currentStep={step}
              onStepClick={(index) => canGoTo(index) && setStep(index)}
            />
          </div>

          <div className="flex flex-col gap-6 p-6 @4xl:p-10">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === VERIFY && (
              <VerifyStep token={token} error={tokenError} busy={busy} onChange={setToken} onVerify={verify} />
            )}

            {step === ORGANIZATION && (
              <OrganizationStep
                org={org}
                onChange={(patch) => {
                  if (patch.name !== undefined && !slugEdited) patch = { ...patch, slug: slugify(patch.name) };
                  if (patch.slug !== undefined && patch.name === undefined) setSlugEdited(true);
                  update(patch);
                }}
                onNext={() => setStep(DATABASE)}
              />
            )}

            {step === DATABASE && checks && (
              <DatabaseStep
                checks={checks}
                checking={busy}
                onRecheck={recheck}
                onBack={() => setStep(ORGANIZATION)}
                onNext={() => setStep(REVIEW)}
              />
            )}

            {step === REVIEW && checks && (
              <ReviewStep
                org={org}
                checks={checks}
                installing={busy}
                onBack={() => setStep(DATABASE)}
                onInstall={install}
              />
            )}

            {step === COMPLETE && result && <CompleteStep result={result} onFinish={onComplete} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetupWizard;

function VerifyStep({
  token,
  error,
  busy,
  onChange,
  onVerify,
}: {
  token: string;
  error: string | null;
  busy: boolean;
  onChange: (token: string) => void;
  onVerify: () => void;
}) {
  return (
    <Form className="flex flex-col gap-6" onFormSubmit={onVerify}>
      <StepHeader title="Verify it's you">
        Setup is protected by a one-time token, so only someone with access to the server can set up
        this system.
      </StepHeader>

      <Field name="token">
        <FieldLabel required>Setup token</FieldLabel>
        <Input
          type="password"
          required
          autoComplete="off"
          spellCheck={false}
          value={token}
          onChange={(e) => onChange(e.target.value)}
        />
        <FieldDescription>
          Find it in the API server log (&quot;FIRST-RUN SETUP REQUIRED&quot;), run{' '}
          <code>python -m kernel.setup token</code>, or use <code>SETUP_TOKEN</code> from the server&apos;s{' '}
          <code>.env</code>.
        </FieldDescription>
        <FieldError />
      </Field>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not verify</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormActions align="end">
        <Button type="submit" loading={busy} startIcon={<KeyRound />}>
          Verify
        </Button>
      </FormActions>
    </Form>
  );
}

function StepHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="text-lg font-bold tracking-tight">innostes ERP</span>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="info">Self-hosted</Badge>
          <Badge variant="info">First-time setup</Badge>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl leading-tight font-bold tracking-tight">
          One platform for your <span className="text-primary">business</span> and{' '}
          <span className="text-primary">tools</span>
        </h2>
        <p className="text-muted-foreground">
          Set up your organization and get your platform ready in a few simple steps. This page is
          only available until setup is complete.
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex items-center gap-3">
            <IconTile tone={f.tone} size="lg">
              {f.icon}
            </IconTile>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{f.title}</span>
              <span className="text-sm text-muted-foreground">{f.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function OrganizationStep({
  org,
  onChange,
  onNext,
}: {
  org: OrganizationInput;
  onChange: (patch: Partial<OrganizationInput>) => void;
  onNext: () => void;
}) {
  return (
    <Form className="flex flex-col gap-6" onFormSubmit={onNext}>
      <StepHeader title="Organization details">
        Let&apos;s start with your organization. It becomes your first workspace.
      </StepHeader>

      <FormGrid>
        <Field name="name">
          <FieldLabel required>Organization name</FieldLabel>
          <Input required maxLength={255} value={org.name} onChange={(e) => onChange({ name: e.target.value })} />
          <FieldDescription>Your company or organization name.</FieldDescription>
          <FieldError />
        </Field>
        <Field name="slug">
          <FieldLabel required>Organization slug</FieldLabel>
          <Input
            required
            maxLength={63}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={org.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
          />
          <FieldDescription>Used in URLs and system ids (e.g. acme).</FieldDescription>
          <FieldError match="patternMismatch">Use lowercase letters and numbers, separated by single dashes.</FieldError>
          <FieldError match="valueMissing" />
        </Field>
        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-country" required>
            Country / Region
          </Label>
          <CountrySelect
            id="setup-country"
            name="country"
            required
            value={org.country ?? null}
            onValueChange={(country) => onChange({ country })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-tz" required>
            Time zone
          </Label>
          <TimezoneSelect
            id="setup-tz"
            name="timezone"
            required
            value={org.timezone ?? null}
            onValueChange={(timezone) => onChange({ timezone })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-lang" required>
            Default language
          </Label>
          <LanguageSelect
            id="setup-lang"
            name="language"
            required
            value={org.language ?? null}
            onValueChange={(language) => onChange({ language })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-date">Date format</Label>
          <DateFormatSelect
            id="setup-date"
            value={org.date_format ?? null}
            onValueChange={(date_format) => onChange({ date_format })}
          />
        </div>
      </FormGrid>

      <Alert variant="info">
        <AlertTitle>Why is this information required?</AlertTitle>
        <AlertDescription>
          It sets your platform&apos;s default preferences and creates your first organization. You can
          change these later in the administration panel.
        </AlertDescription>
      </Alert>

      <FormActions align="end">
        <Button type="submit" endIcon={<ArrowRight />}>
          Next
        </Button>
      </FormActions>
    </Form>
  );
}

function DatabaseStep({
  checks,
  checking,
  onRecheck,
  onBack,
  onNext,
}: {
  checks: SetupChecks;
  checking: boolean;
  onRecheck: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const connected = checks.database_connected;
  const pending = checks.migrations_pending;

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Database">
        The database connection comes from the server&apos;s <code>.env</code> file. Setup checks it and
        creates the tables.
      </StepHeader>

      {connected ? (
        <Alert variant="success">
          <AlertTitle>Database connected</AlertTitle>
          <AlertDescription>
            {pending > 0
              ? `Setup will apply ${pending} database update${pending === 1 ? '' : 's'} to create the tables.`
              : 'The database tables are up to date.'}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Cannot connect to the database</AlertTitle>
          <AlertDescription>
            Check <code>DATABASE_URL</code> (or <code>DB_HOST</code>, <code>DB_USER</code>,{' '}
            <code>DB_PASSWORD</code>, <code>DB_NAME</code>) in the API server&apos;s <code>.env</code>, make
            sure Postgres is running, restart the API, then check again.
          </AlertDescription>
        </Alert>
      )}

      <FormActions align="between">
        <Button variant="outline" startIcon={<ArrowLeft />} onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" startIcon={<RefreshCw />} loading={checking} onClick={onRecheck}>
            Check again
          </Button>
          <Button endIcon={<ArrowRight />} disabled={!connected} onClick={onNext}>
            Next
          </Button>
        </div>
      </FormActions>
    </div>
  );
}

function ReviewStep({
  org,
  checks,
  installing,
  onBack,
  onInstall,
}: {
  org: OrganizationInput;
  checks: SetupChecks;
  installing: boolean;
  onBack: () => void;
  onInstall: () => void;
}) {
  const rows: [string, ReactNode][] = [
    ['Organization name', org.name],
    ['Slug', <code key="slug">{org.slug}</code>],
    ['Country / Region', org.country ?? '-'],
    ['Time zone', org.timezone ?? '-'],
    ['Default language', org.language ?? '-'],
    ['Date format', org.date_format ?? '-'],
    ['Database updates', String(checks.migrations_pending)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Review">Check the details below, then install.</StepHeader>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-border p-4 @2xl:grid-cols-[12rem_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <Alert variant="warning">
        <AlertTitle>Setup runs only once</AlertTitle>
        <AlertDescription>
          After installing, this setup page is locked and cannot be opened again.
        </AlertDescription>
      </Alert>

      <FormActions align="between">
        <Button variant="outline" startIcon={<ArrowLeft />} onClick={onBack} disabled={installing}>
          Back
        </Button>
        <Button loading={installing} onClick={onInstall}>
          Install
        </Button>
      </FormActions>
    </div>
  );
}

function CompleteStep({ result, onFinish }: { result: SetupResult; onFinish: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Setup complete">
        <strong>{result.tenant.name}</strong> is ready. The setup page is now locked.
      </StepHeader>
      <Alert variant="success">
        <AlertTitle>Installed</AlertTitle>
        <AlertDescription>
          Your organization <code>{result.tenant.slug}</code> was created on{' '}
          {new Date(result.installed_at).toLocaleString()}.
        </AlertDescription>
      </Alert>
      <FormActions align="end">
        <Button endIcon={<ArrowRight />} onClick={onFinish}>
          Go to app
        </Button>
      </FormActions>
    </div>
  );
}
