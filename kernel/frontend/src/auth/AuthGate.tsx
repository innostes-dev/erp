import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { clearStoredTokens, getMe, getStoredAccessToken, getStoredRefreshToken, logout, refreshAccessToken } from './api';
import { AuthPage } from './AuthPage';
import type { TokenResponse, UserSummary } from './types';
import { SetupLoader } from '../setup/SetupLoader';

export interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  logout: (logoutAll?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Access the authenticated user and auth utilities from any descendant component.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthGate');
  }
  return ctx;
}

export interface AuthGateProps {
  children: ReactNode;
}

type GateState =
  | { kind: 'loading' }
  | { kind: 'unauthenticated' }
  | { kind: 'authenticated'; user: UserSummary; token: string };

/**
 * Guards children behind an active authenticated session.
 *
 * If unauthenticated or if an email reset link token is present in the URL,
 * renders AuthPage. Once logged in, renders children inside AuthContext.
 */
export function AuthGate({ children }: AuthGateProps) {
  const [state, setState] = useState<GateState>({ kind: 'loading' });

  const checkAuth = useCallback(async () => {
    // If arriving from email with a password reset token, force AuthPage
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('token')) {
        setState({ kind: 'unauthenticated' });
        return;
      }
    }

    const token = getStoredAccessToken();
    if (!token) {
      setState({ kind: 'unauthenticated' });
      return;
    }

    try {
      const user = await getMe(token);
      setState({ kind: 'authenticated', user, token });
    } catch {
      // Access token may be expired; attempt single-use refresh token rotation
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        try {
          const refreshed = await refreshAccessToken({ refresh_token: refreshToken });
          const user = await getMe(refreshed.access_token);
          setState({ kind: 'authenticated', user, token: refreshed.access_token });
          return;
        } catch {
          // Refresh token invalid or revoked
          clearStoredTokens();
        }
      } else {
        clearStoredTokens();
      }
      setState({ kind: 'unauthenticated' });
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const handleAuthSuccess = useCallback(async (tokens: TokenResponse) => {
    try {
      const user = await getMe(tokens.access_token);
      setState({ kind: 'authenticated', user, token: tokens.access_token });
    } catch {
      setState({
        kind: 'authenticated',
        user: tokens.user,
        token: tokens.access_token,
      });
    }
  }, []);

  const handleLogout = useCallback(async (logoutAll: boolean = false) => {
    try {
      await logout(logoutAll);
    } catch {
      clearStoredTokens();
    } finally {
      setState({ kind: 'unauthenticated' });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setState({ kind: 'unauthenticated' });
      return;
    }
    const user = await getMe(token);
    setState({ kind: 'authenticated', user, token });
  }, []);

  if (state.kind === 'loading') {
    return <SetupLoader />;
  }

  if (state.kind === 'unauthenticated') {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthGate;
