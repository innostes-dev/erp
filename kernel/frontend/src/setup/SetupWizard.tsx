import { useEffect, useState, type ReactNode } from 'react';
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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Eye,
  EyeOff,
  KeyRound,
  Plug,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';

import { ApiError } from '../core/api/client';
import { HttpStatus } from '../core/api/http-status';
import { getSetupChecks, getSetupStatus, runSetup, SetupErrorCode } from './api';
import { slugify } from './slug';
import type {
  AdminUserInput,
  OrganizationInput,
  SetupBrandingInput,
  SetupChecks,
  SetupResult,
} from './types';

/** Wizard steps: 7 distinct screens with mandatory and optional skipping steps. */
const STEPS = [
  { title: 'Verify', description: 'Setup token' },
  { title: 'Organization', description: 'Workspace details' },
  { title: 'Administrator', description: 'Root credentials' },
  { title: 'Branding & Theme', description: 'Look & feel (Optional)' },
  { title: 'Database', description: 'Connect & verify' },
  { title: 'Review', description: 'Confirm settings' },
  { title: 'Complete', description: 'Finish setup' },
] as const;

const VERIFY = 0;
const ORGANIZATION = 1;
const ADMINISTRATOR = 2;
const BRANDING = 3;
const DATABASE = 4;
const REVIEW = 5;
const COMPLETE = 6;

const DRAFT_STORAGE_KEY = 'innostes_setup_draft';

const COLOR_PRESETS = [
  { name: 'Innostes Blue', hex: '#2563EB' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Violet', hex: '#7C3AED' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Slate', hex: '#52525B' },
] as const;

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
  /** Called when user leaves the finished wizard ("Go to app"), or setup is done already. */
  onComplete: () => void;
}

interface SetupDraft {
  step: number;
  token: string;
  org: OrganizationInput;
  admin: Omit<AdminUserInput, 'password'>;
  branding: SetupBrandingInput | null;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(VERIFY);
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [org, setOrg] = useState<OrganizationInput>(() => ({ name: '', slug: '', ...browserDefaults() }));
  const [admin, setAdmin] = useState<AdminUserInput>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    mobile: '',
  });
  const [branding, setBranding] = useState<SetupBrandingInput | null>({
    theme: 'system',
    primary_color: '#2563EB',
    logo_url: null,
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [checks, setChecks] = useState<SetupChecks | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SetupResult | null>(null);

  // Draft recovery & network status
  const [draftRestored, setDraftRestored] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // 1. Initial Mount: Draft Recovery from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SetupDraft;
        if (parsed && typeof parsed.step === 'number' && parsed.step < COMPLETE) {
          if (parsed.token) setToken(parsed.token);
          if (parsed.org) setOrg(parsed.org);
          if (parsed.admin) {
            setAdmin((prev) => ({
              ...prev,
              first_name: parsed.admin.first_name || '',
              last_name: parsed.admin.last_name || '',
              email: parsed.admin.email || '',
              mobile: parsed.admin.mobile || '',
            }));
          }
          if (parsed.branding !== undefined) setBranding(parsed.branding);
          setStep(parsed.step);
          setDraftRestored(true);
        }
      }
    } catch {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  // 2. Continuous Auto-Save to sessionStorage (excluding plaintext password for security)
  useEffect(() => {
    if (step === COMPLETE) return;
    try {
      const draft: SetupDraft = {
        step,
        token,
        org,
        admin: {
          first_name: admin.first_name,
          last_name: admin.last_name,
          email: admin.email,
          mobile: admin.mobile,
        },
        branding,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore quota errors in private browsing
    }
  }, [step, token, org, admin, branding]);

  // 3. Network connection change listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  function handleResetDraft() {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraftRestored(false);
    setToken('');
    setOrg({ name: '', slug: '', ...browserDefaults() });
    setAdmin({ first_name: '', last_name: '', email: '', password: '', mobile: '' });
    setBranding({ theme: 'system', primary_color: '#2563EB', logo_url: null });
    setChecks(null);
    setError(null);
    setTokenError(null);
    setStep(VERIFY);
  }

  const updateOrg = (patch: Partial<OrganizationInput>) => setOrg((o) => ({ ...o, ...patch }));
  const updateAdmin = (patch: Partial<AdminUserInput>) => setAdmin((a) => ({ ...a, ...patch }));

  /** Setup routes answered 404: setup is done or web setup is disabled. */
  async function handleSetupGone() {
    const latest = await getSetupStatus().catch(() => null);
    if (latest?.installed) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
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

  /** Shared handling of setup API errors. Returns true if fully handled. */
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

  async function recheckDatabase() {
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
      const res = await runSetup(
        {
          organization: org,
          admin,
          branding,
        },
        token,
      );
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setResult(res);
      setToken('');
      setStep(COMPLETE);
    } catch (e) {
      if (e instanceof ApiError && e.status === HttpStatus.CONFLICT) {
        const latest = await getSetupStatus().catch(() => null);
        if (latest?.installed) {
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
          return onComplete();
        }
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
          {/* Offline Warning Banner */}
          {!isOnline && (
            <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-6 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <WifiOff className="size-4 shrink-0" />
              <span>Network connection lost. Your setup progress is safely saved locally and will resume when you reconnect.</span>
            </div>
          )}

          {/* Draft Restored Banner */}
          {draftRestored && step > VERIFY && step < COMPLETE && (
            <div className="flex items-center justify-between border-b border-primary/20 bg-primary/10 px-6 py-2 text-xs font-medium text-primary">
              <div className="flex items-center gap-2">
                <Check className="size-3.5" />
                <span>Restored your setup progress from draft.</span>
              </div>
              <button
                type="button"
                onClick={handleResetDraft}
                className="flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
              >
                <RotateCcw className="size-3" />
                <span>Start over</span>
              </button>
            </div>
          )}

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

            {/* Screen 1: Verify [MANDATORY] */}
            {step === VERIFY && (
              <VerifyStep token={token} error={tokenError} busy={busy} onChange={setToken} onVerify={verify} />
            )}

            {/* Screen 2: Organization [MANDATORY] */}
            {step === ORGANIZATION && (
              <OrganizationStep
                org={org}
                onChange={(patch) => {
                  if (patch.name !== undefined && !slugEdited) patch = { ...patch, slug: slugify(patch.name) };
                  if (patch.slug !== undefined && patch.name === undefined) setSlugEdited(true);
                  updateOrg(patch);
                }}
                onNext={() => setStep(ADMINISTRATOR)}
              />
            )}

            {/* Screen 3: Super Admin Credentials [MANDATORY] */}
            {step === ADMINISTRATOR && (
              <AdministratorStep
                admin={admin}
                onChange={updateAdmin}
                onBack={() => setStep(ORGANIZATION)}
                onNext={() => setStep(BRANDING)}
              />
            )}

            {/* Screen 4: Branding & Theme [OPTIONAL with Skip / Setup Later] */}
            {step === BRANDING && (
              <BrandingStep
                branding={branding}
                onChange={(patch) => setBranding((b) => ({ ...(b ?? { theme: 'system', primary_color: '#2563EB', logo_url: null }), ...patch }))}
                onSkip={() => {
                  setBranding(null); // Skip applies defaults on backend
                  setStep(DATABASE);
                }}
                onNext={() => setStep(DATABASE)}
                onBack={() => setStep(ADMINISTRATOR)}
              />
            )}

            {/* Screen 5: Database Check [MANDATORY] */}
            {step === DATABASE && checks && (
              <DatabaseStep
                checks={checks}
                checking={busy}
                onRecheck={recheckDatabase}
                onBack={() => setStep(BRANDING)}
                onNext={() => setStep(REVIEW)}
              />
            )}

            {/* Screen 6: Review Summary [MANDATORY] */}
            {step === REVIEW && checks && (
              <ReviewStep
                org={org}
                admin={admin}
                branding={branding}
                checks={checks}
                installing={busy}
                onBack={() => setStep(DATABASE)}
                onInstall={install}
              />
            )}

            {/* Screen 7: Automated Installation Complete [MANDATORY] */}
            {step === COMPLETE && result && (
              <CompleteStep
                result={result}
                onFinish={() => {
                  sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                  onComplete();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetupWizard;

/* -------------------------------------------------------------------------- */
/*                                   STEPS                                    */
/* -------------------------------------------------------------------------- */

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
      <StepHeader title="Verify infrastructure ownership">
        Setup is protected by a one-time token, so only someone with access to the server can set up
        this platform.
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
          Verify Token
        </Button>
      </FormActions>
    </Form>
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
        Establish the initial customer workspace for your ERP deployment.
      </StepHeader>

      <FormGrid>
        <Field name="name">
          <FieldLabel required>Organization name</FieldLabel>
          <Input required maxLength={255} value={org.name} onChange={(e) => onChange({ name: e.target.value })} />
          <FieldDescription>Your legal company or organization name.</FieldDescription>
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
          <FieldDescription>Used in URLs and system identifiers (e.g. acme).</FieldDescription>
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

      <FormActions align="end">
        <Button type="submit" endIcon={<ArrowRight />}>
          Next
        </Button>
      </FormActions>
    </Form>
  );
}

function AdministratorStep({
  admin,
  onChange,
  onBack,
  onNext,
}: {
  admin: AdminUserInput;
  onChange: (patch: Partial<AdminUserInput>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [confirmPassword, setConfirmPassword] = useState(admin.password);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  function handleSubmit() {
    if (admin.password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    onNext();
  }

  return (
    <Form className="flex flex-col gap-6" onFormSubmit={handleSubmit}>
      <StepHeader title="Root Super Administrator">
        Create the primary platform administrator. This account holds full root security rights.
      </StepHeader>

      <FormGrid>
        <Field name="first_name">
          <FieldLabel required>First name</FieldLabel>
          <Input
            required
            maxLength={100}
            value={admin.first_name}
            onChange={(e) => onChange({ first_name: e.target.value })}
            placeholder="e.g. Sai"
          />
          <FieldError />
        </Field>
        <Field name="last_name">
          <FieldLabel>Last name</FieldLabel>
          <Input
            maxLength={100}
            value={admin.last_name ?? ''}
            onChange={(e) => onChange({ last_name: e.target.value || null })}
            placeholder="e.g. Krishna"
          />
          <FieldError />
        </Field>
        <Field name="email">
          <FieldLabel required>Administrator email</FieldLabel>
          <Input
            type="email"
            required
            value={admin.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="admin@organization.com"
          />
          <FieldDescription>Used to log into the platform.</FieldDescription>
          <FieldError />
        </Field>
        <Field name="mobile">
          <FieldLabel>Mobile telephone</FieldLabel>
          <Input
            type="tel"
            value={admin.mobile ?? ''}
            onChange={(e) => onChange({ mobile: e.target.value || null })}
            placeholder="+91 98765 43210"
          />
          <FieldDescription>Optional, used for SMS security alerts.</FieldDescription>
          <FieldError />
        </Field>
        <Field name="password">
          <FieldLabel required>Root password</FieldLabel>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              maxLength={128}
              value={admin.password}
              onChange={(e) => {
                onChange({ password: e.target.value });
                if (passwordMismatch && e.target.value === confirmPassword) {
                  setPasswordMismatch(false);
                }
              }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldDescription>Minimum 8 characters with numbers or symbols.</FieldDescription>
          <FieldError />
        </Field>
        <Field name="confirm_password">
          <FieldLabel required>Confirm password</FieldLabel>
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (passwordMismatch && e.target.value === admin.password) {
                setPasswordMismatch(false);
              }
            }}
          />
          {passwordMismatch && (
            <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>
          )}
        </Field>
      </FormGrid>

      <Alert variant="info">
        <AlertTitle>Strict Zero-Knowledge Storage</AlertTitle>
        <AlertDescription>
          Passwords are salted and hashed using bcrypt. PII (email and mobile) is encrypted using AES-256-GCM.
        </AlertDescription>
      </Alert>

      <FormActions align="between">
        <Button variant="outline" startIcon={<ArrowLeft />} onClick={onBack}>
          Back
        </Button>
        <Button type="submit" endIcon={<ArrowRight />}>
          Next
        </Button>
      </FormActions>
    </Form>
  );
}

function BrandingStep({
  branding,
  onChange,
  onSkip,
  onNext,
  onBack,
}: {
  branding: SetupBrandingInput | null;
  onChange: (patch: Partial<SetupBrandingInput>) => void;
  onSkip: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const currentTheme = branding?.theme ?? 'system';
  const currentColor = branding?.primary_color ?? '#2563EB';
  const currentLogo = branding?.logo_url ?? '';

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Branding & Theme (Optional)">
        Customize your platform&apos;s visual appearance now, or skip and configure later in Settings.
      </StepHeader>

      <div className="flex flex-col gap-6">
        {/* Theme mode cards */}
        <div className="flex flex-col gap-3">
          <Label>Theme Mode</Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'system', label: '💻 System Default' },
              { id: 'light', label: '☀️ Light' },
              { id: 'dark', label: '🌙 Dark' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ theme: t.id as 'light' | 'dark' | 'system' })}
                className={`flex items-center justify-center rounded-xl border p-3 text-sm font-medium transition-all ${
                  currentTheme === t.id
                    ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary'
                    : 'border-border bg-card text-foreground hover:bg-muted/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Color Swatches */}
        <div className="flex flex-col gap-3">
          <Label>Primary Brand Color</Label>
          <div className="flex flex-wrap items-center gap-3">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => onChange({ primary_color: c.hex })}
                className="group relative flex size-9 items-center justify-center rounded-full transition-transform hover:scale-105"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {currentColor.toLowerCase() === c.hex.toLowerCase() && (
                  <Check className="size-4 text-white drop-shadow-sm" />
                )}
              </button>
            ))}
            <div className="flex items-center gap-2 pl-2">
              <span className="text-xs text-muted-foreground">Custom:</span>
              <Input
                type="text"
                className="h-8 w-24 text-xs font-mono"
                value={currentColor}
                onChange={(e) => onChange({ primary_color: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Company Logo URL */}
        <Field name="logo_url">
          <FieldLabel>Company Logo URL (Optional)</FieldLabel>
          <Input
            type="url"
            value={currentLogo}
            onChange={(e) => onChange({ logo_url: e.target.value || null })}
            placeholder="https://cdn.organization.com/logo.png"
          />
          <FieldDescription>Public image URL for your header monogram.</FieldDescription>
        </Field>
      </div>

      <FormActions align="between">
        <Button variant="outline" startIcon={<ArrowLeft />} onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          {/* THE SKIP BUTTON */}
          <Button variant="outline" onClick={onSkip}>
            Skip / Setup later
          </Button>
          <Button endIcon={<ArrowRight />} onClick={onNext}>
            Save & Next
          </Button>
        </div>
      </FormActions>
    </div>
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
      <StepHeader title="Database verification">
        The database connection is established from the server configuration. Setup verifies connectivity
        and runs migrations to create tables.
      </StepHeader>

      {connected ? (
        <Alert variant="success">
          <AlertTitle>Database connected</AlertTitle>
          <AlertDescription>
            {pending > 0
              ? `Setup will apply ${pending} pending migration${pending === 1 ? '' : 's'} to build tables.`
              : 'The database schema is up to date.'}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Cannot connect to the database</AlertTitle>
          <AlertDescription>
            Check <code>DATABASE_URL</code> (or <code>DB_HOST</code>, <code>DB_USER</code>,{' '}
            <code>DB_PASSWORD</code>, <code>DB_NAME</code>) in the API server&apos;s <code>.env</code>, make
            sure PostgreSQL is running, restart the API, then check again.
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
  admin,
  branding,
  checks,
  installing,
  onBack,
  onInstall,
}: {
  org: OrganizationInput;
  admin: AdminUserInput;
  branding: SetupBrandingInput | null;
  checks: SetupChecks;
  installing: boolean;
  onBack: () => void;
  onInstall: () => void;
}) {
  const rows: [string, ReactNode][] = [
    ['Organization name', org.name],
    ['Workspace slug', <code key="slug">{org.slug}</code>],
    ['Country / Region', org.country ?? '-'],
    ['Time zone', org.timezone ?? '-'],
    ['Default language', org.language ?? '-'],
    ['Super Admin', `${admin.first_name} ${admin.last_name || ''} (${admin.email})`],
    [
      'Branding & Theme',
      branding
        ? `${branding.theme} theme, primary: ${branding.primary_color}`
        : 'Default system look applied (Skipped)',
    ],
    ['Database migrations', String(checks.migrations_pending)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Review & Confirm">Check your configuration details below before committing setup.</StepHeader>

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
          After completing installation, this setup wizard is permanently locked and cannot be reopened.
        </AlertDescription>
      </Alert>

      <FormActions align="between">
        <Button variant="outline" startIcon={<ArrowLeft />} onClick={onBack} disabled={installing}>
          Back
        </Button>
        <Button loading={installing} onClick={onInstall}>
          Install Platform
        </Button>
      </FormActions>
    </div>
  );
}

function CompleteStep({ result, onFinish }: { result: SetupResult; onFinish: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Setup complete">
        <strong>{result.tenant.name}</strong> is ready. Your ERP platform is initialized.
      </StepHeader>
      <Alert variant="success">
        <AlertTitle>Platform initialized</AlertTitle>
        <AlertDescription>
          Organization <code>{result.tenant.slug}</code> was created on{' '}
          {new Date(result.installed_at).toLocaleString()}.
          {result.admin && (
            <span className="block mt-1">
              Super administrator account created for <strong>{result.admin.email}</strong>.
            </span>
          )}
        </AlertDescription>
      </Alert>
      <FormActions align="end">
        <Button endIcon={<ArrowRight />} onClick={onFinish}>
          Go to login
        </Button>
      </FormActions>
    </div>
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
          Set up your organization and get your platform ready in a few simple steps. This wizard is
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
