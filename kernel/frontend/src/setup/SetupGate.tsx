import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle, Button, Spinner } from '@innostes/ui';
import { RefreshCw } from 'lucide-react';

import { ApiError } from '../core/api/client';
import { HttpStatus } from '../core/api/http-status';
import { getSetupStatus } from './api';

// Loaded only when setup is needed: normal users never download the wizard.
const SetupWizard = lazy(() => import('./SetupWizard'));

/** URL path of the setup page. */
export const SETUP_PATH = '/setup';

type GateState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; databaseDown: boolean }
  | { kind: 'setup' }
  | { kind: 'ready' };

/** Full-page spinner. */
function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-6 text-primary" label="Loading" />
    </div>
  );
}

/** Replace the current URL without a page reload (no router needed). */
function replacePath(path: string) {
  if (window.location.pathname !== path) window.history.replaceState(null, '', path);
}

export interface SetupGateProps {
  /** The application, rendered once setup has been completed. */
  children: ReactNode;
}

/**
 * Shows the setup wizard on a fresh install and the app afterwards.
 *
 * - Not installed: renders the wizard at `/setup`, whatever URL was opened.
 * - Database unreachable (`HttpStatus.SERVICE_UNAVAILABLE`): shows an error with a retry button, never the
 *   wizard, because the setup state is unknown.
 * - Installed: renders `children`. Opening `/setup` redirects to `/`, so the
 *   setup page can never be reached again (the API refuses it too, with `HttpStatus.CONFLICT`).
 *
 * @example
 * <SetupGate>
 *   <App />
 * </SetupGate>
 */
export function SetupGate({ children }: SetupGateProps) {
  const [state, setState] = useState<GateState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const status = await getSetupStatus();
      setState(status.installed ? { kind: 'ready' } : { kind: 'setup' });
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : String(e),
        databaseDown: e instanceof ApiError && e.status === HttpStatus.SERVICE_UNAVAILABLE,
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (state.kind === 'setup') replacePath(SETUP_PATH);
    if (state.kind === 'ready' && window.location.pathname.startsWith(SETUP_PATH)) replacePath('/');
  }, [state.kind]);

  if (state.kind === 'loading') return <Loading />;

  if (state.kind === 'error') {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col gap-4">
          {state.databaseDown ? (
            <Alert variant="destructive">
              <AlertTitle>The database is unavailable</AlertTitle>
              <AlertDescription>
                The API server is running but cannot connect to the database. Check{' '}
                <code>DATABASE_URL</code> (or <code>DB_HOST</code>, <code>DB_USER</code>,{' '}
                <code>DB_PASSWORD</code>, <code>DB_NAME</code>) in its <code>.env</code>, make sure
                Postgres is running, then try again.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>Cannot reach the server</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <Button variant="outline" startIcon={<RefreshCw />} onClick={() => void load()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (state.kind === 'setup') {
    return (
      <Suspense fallback={<Loading />}>
        <SetupWizard onComplete={() => setState({ kind: 'ready' })} />
      </Suspense>
    );
  }

  return <>{children}</>;
}
