import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle, Button } from '@innostes/ui';
import { RefreshCw } from 'lucide-react';

import { ApiError } from '../core/api/client';
import { HttpStatus } from '../core/api/http-status';
import { getAppConfig, isSetupRequired } from './api';
import { SetupLoader } from './SetupLoader';

// Loaded only when setup is needed: normal users never download the wizard.
const SetupWizard = lazy(() => import('./SetupWizard'));

/** URL path of the setup page. */
export const SETUP_PATH = '/setup';

type GateState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; databaseDown: boolean }
  | { kind: 'setup' }
  | { kind: 'ready' };

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
 * - Bootstrapping: Calls `/config` while showing a professional animated full-page loader.
 * - Not installed: `/config` returns 503 `setup_required`, rendering the wizard at `/setup`.
 * - Installed: `/config` returns 200 OK, rendering `children`.
 * - Database unreachable (`HttpStatus.SERVICE_UNAVAILABLE`): shows an error with a retry button.
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
      await getAppConfig();
      setState({ kind: 'ready' });
    } catch (e) {
      if (isSetupRequired(e)) {
        setState({ kind: 'setup' });
        return;
      }
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

  if (state.kind === 'loading') {
    return <SetupLoader />;
  }

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
      <Suspense fallback={<SetupLoader message="Loading setup wizard..." />}>
        <SetupWizard onComplete={() => setState({ kind: 'ready' })} />
      </Suspense>
    );
  }

  return <>{children}</>;
}
