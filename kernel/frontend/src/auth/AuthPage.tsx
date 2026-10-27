import { useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Form,
  FormActions,
  Input,
} from '@innostes/ui';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';

import { ApiError } from '../core/api/client';
import { changePassword, forgotPassword, login, resetPassword } from './api';
import type { TokenResponse } from './types';

export type AuthMode = 'login' | 'forgot_password' | 'reset_password' | 'must_change_password';

export interface AuthPageProps {
  initialMode?: AuthMode;
  onSuccess: (tokens: TokenResponse) => void;
}

export function AuthPage({ initialMode = 'login', onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Temporary / new password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // UI state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [tempAuthTokens, setTempAuthTokens] = useState<TokenResponse | null>(null);

  // Check URL query params for reset token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      const emailParam = params.get('email');
      if (tokenParam) {
        setResetToken(tokenParam);
        if (emailParam) setEmail(emailParam);
        setMode('reset_password');
      }
    }
  }, []);

  async function handleLogin() {
    setBusy(true);
    setError(null);
    setInfoMessage(null);
    try {
      const res = await login({
        email,
        password,
        device_fingerprint: typeof navigator !== 'undefined' ? `${navigator.userAgent}-${screen.width}x${screen.height}` : 'web-client',
      });

      if (res.must_change_password) {
        setTempAuthTokens(res);
        setMode('must_change_password');
        setInfoMessage('You logged in with a temporary password. Please set a new secure password to continue.');
      } else {
        onSuccess(res);
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Login failed. Please check your credentials.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    setBusy(true);
    setError(null);
    try {
      const res = await forgotPassword({ email });
      setInfoMessage(res.message);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Could not process request.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await resetPassword({ token: resetToken, new_password: newPassword });
      setInfoMessage(res.message);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Password reset failed.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleMustChangePassword() {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await changePassword(
        {
          current_password: password,
          new_password: newPassword,
        },
        tempAuthTokens?.access_token,
      );

      if (tempAuthTokens) {
        onSuccess({
          ...tempAuthTokens,
          must_change_password: false,
        });
      } else {
        setMode('login');
        setInfoMessage('Password successfully updated. Please log in with your new credentials.');
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Failed to change password.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/40 p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl shadow-slate-200/50 dark:shadow-none sm:p-8">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="size-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Innostes ERP</span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Enterprise Business Platform</span>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {infoMessage && (
          <div className="mb-6">
            <Alert variant="info">
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>{infoMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Mode 1: LOGIN */}
        {mode === 'login' && (
          <Form className="flex flex-col gap-4" onFormSubmit={handleLogin}>
            <div className="mb-1 text-center">
              <h2 className="text-lg font-semibold tracking-tight">Sign in to your account</h2>
              <p className="text-xs text-muted-foreground">Enter your credentials to access your organization workspace.</p>
            </div>

            <Field name="email">
              <FieldLabel required>Email address</FieldLabel>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                autoComplete="email"
              />
              <FieldError />
            </Field>

            <Field name="password">
              <div className="flex items-center justify-between">
                <FieldLabel required>Password</FieldLabel>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setInfoMessage(null);
                    setMode('forgot_password');
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldError />
            </Field>

            <FormActions align="end" className="mt-2">
              <Button type="submit" loading={busy} endIcon={<ArrowRight />} className="w-full">
                Sign in
              </Button>
            </FormActions>
          </Form>
        )}

        {/* Mode 2: FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <Form className="flex flex-col gap-4" onFormSubmit={handleForgotPassword}>
            <div className="mb-1 text-center">
              <h2 className="text-lg font-semibold tracking-tight">Reset password</h2>
              <p className="text-xs text-muted-foreground">
                We will dispatch a secure temporary password and a one-click reset link to your email.
              </p>
            </div>

            <Field name="email">
              <FieldLabel required>Account email</FieldLabel>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
              />
              <FieldDescription>The email address associated with your ERP account.</FieldDescription>
              <FieldError />
            </Field>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" loading={busy} startIcon={<Mail />} className="w-full">
                Send credentials & reset link
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                startIcon={<ArrowLeft />}
                className="w-full"
              >
                Back to sign in
              </Button>
            </div>
          </Form>
        )}

        {/* Mode 3: RESET PASSWORD VIA LINK TOKEN */}
        {mode === 'reset_password' && (
          <Form className="flex flex-col gap-4" onFormSubmit={handleResetPassword}>
            <div className="mb-1 text-center">
              <h2 className="text-lg font-semibold tracking-tight">Set new password</h2>
              <p className="text-xs text-muted-foreground">Create a new secure password for <strong>{email}</strong>.</p>
            </div>

            <Field name="new_password">
              <FieldLabel required>New password</FieldLabel>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldDescription>Must be different from your last 5 passwords.</FieldDescription>
              <FieldError />
            </Field>

            <Field name="confirm_password">
              <FieldLabel required>Confirm password</FieldLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
              />
              <FieldError />
            </Field>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" loading={busy} endIcon={<Check />} className="w-full">
                Set new password
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => setMode('login')}
                startIcon={<ArrowLeft />}
                className="w-full"
              >
                Back to sign in
              </Button>
            </div>
          </Form>
        )}

        {/* Mode 4: MUST CHANGE PASSWORD (TEMPORARY CREDENTIAL RESET) */}
        {mode === 'must_change_password' && (
          <Form className="flex flex-col gap-4" onFormSubmit={handleMustChangePassword}>
            <div className="mb-1 text-center">
              <h2 className="text-lg font-semibold tracking-tight">First-time password reset</h2>
              <p className="text-xs text-muted-foreground">
                Your temporary password has been verified. You must create a permanent password to continue.
              </p>
            </div>

            <Field name="new_password">
              <FieldLabel required>Permanent password</FieldLabel>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldDescription>Cannot reuse recent passwords.</FieldDescription>
              <FieldError />
            </Field>

            <Field name="confirm_password">
              <FieldLabel required>Confirm permanent password</FieldLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
              />
              <FieldError />
            </Field>

            <FormActions align="end" className="mt-2">
              <Button type="submit" loading={busy} endIcon={<Check />} className="w-full">
                Save password & enter workspace
              </Button>
            </FormActions>
          </Form>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
