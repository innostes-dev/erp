import { useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@innostes/ui';
import { useAuth } from '@innostes/kernel';
import {
  Building2,
  CheckCircle2,
  KeyRound,
  LogOut,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react';

/**
 * The authenticated workspace shell displayed after sign-in.
 */
export function App() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout(allDevices: boolean = false) {
    setLoggingOut(true);
    try {
      await logout(allDevices);
    } finally {
      setLoggingOut(false);
    }
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Administrator';

  return (
    <main className="mx-auto flex min-h-svh max-w-4xl flex-col gap-6 p-6 md:p-10">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
            E
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Innostes ERP</h1>
            <p className="text-xs text-muted-foreground">Modular Business Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            loading={loggingOut}
            startIcon={<LogOut />}
            onClick={() => void handleLogout(false)}
          >
            Sign out
          </Button>
        </div>
      </header>

      {/* Main Status & Welcome Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-2xl font-bold">Welcome, {fullName}</CardTitle>
            {user?.is_super_admin && (
              <Badge variant="default">
                Super Admin
              </Badge>
            )}
            <Badge variant="success" dot>
              {user?.status ? user.status.toUpperCase() : 'ACTIVE'}
            </Badge>
          </div>
          <CardDescription>
            You are securely authenticated to the organization workspace with token-based access control.
          </CardDescription>
          <CardAction>
            <Button
              variant="secondary"
              size="sm"
              loading={loggingOut}
              onClick={() => void handleLogout(true)}
            >
              Sign out all devices
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="grid gap-6 sm:grid-cols-2">
          {/* User Details */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-4 bg-muted/20">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="size-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identity</span>
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-muted-foreground font-mono">{user?.email}</p>
            </div>
          </div>

          {/* Security & Token Governance */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-4 bg-muted/20">
            <div className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Security</span>
              <p className="text-sm font-medium">SOC 2 Multi-Tenant IAM</p>
              <p className="text-xs text-muted-foreground">Token Version: {user?.token_version ?? 1} (Single-use rotation)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auth Features Overview */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Authentication & Security Status</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <KeyRound className="size-4" />
              <span className="font-semibold text-sm">Login & Lockout</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Anti-enumeration defenses, timing-resistant dummy bcrypt hashing, and automated account lockout after 5 consecutive failed attempts.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="size-4" />
              <span className="font-semibold text-sm">Temporary Password</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cryptographically generated 16-character temporary password dispatched via email with strict 24-hour expiration and mandatory password reset.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="size-4" />
              <span className="font-semibold text-sm">Password History</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              SOC 2 compliant password reuse prevention prohibiting any of the last 5 historical passwords across resets and manual changes.
            </p>
          </div>
        </div>
      </div>

      {/* Setup Success Banner */}
      <Alert variant="success">
        <CheckCircle2 className="size-4 text-success" />
        <AlertTitle>Platform & Auth Operational</AlertTitle>
        <AlertDescription>
          Setup initialization is complete and the authentication subsystem is fully active. Module navigation will load here as additional ERP packages are installed.
        </AlertDescription>
      </Alert>
    </main>
  );
}

export default App;
