'use client';

import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { AuthContext } from './auth.context';
import type { AuthState, LoginCredentials } from './auth.types';
import type { User, ApiResponse } from '@mono/shared/types';

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'AUTH_LOGOUT' };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return { ...initialState, isLoading: false };
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, {
    ...initialState,
    user: initialUser ?? null,
    isAuthenticated: !!initialUser,
    isLoading: !initialUser,
  });

  useEffect(() => {
    if (initialUser) return;
    void restoreSession();
  }, [initialUser]);

  const restoreSession = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) { dispatch({ type: 'AUTH_FAILURE' }); return; }

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Session invalid');

      const { data: user } = (await res.json()) as ApiResponse<User>;
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch {
      sessionStorage.removeItem('auth_token');
      dispatch({ type: 'AUTH_FAILURE' });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        dispatch({ type: 'AUTH_FAILURE' });
        throw new Error('Login failed');
      }
      const { data } = (await res.json()) as ApiResponse<{ user: User; token: string }>;
      sessionStorage.setItem('auth_token', data.token);
      // Cookie lets server components (getServerSession) read the token on navigation
      document.cookie = `auth_token=${data.token}; path=/; SameSite=Lax`;
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: data.user, token: data.token } });
    } catch (err) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    sessionStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; max-age=0';
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) { dispatch({ type: 'AUTH_LOGOUT' }); return; }

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { dispatch({ type: 'AUTH_LOGOUT' }); return; }

      const { data } = (await res.json()) as ApiResponse<{ user: User; token: string }>;
      sessionStorage.setItem('auth_token', data.token);
      document.cookie = `auth_token=${data.token}; path=/; SameSite=Lax`;
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: data.user, token: data.token } });
    } catch {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout, refreshToken }),
    [state, login, logout, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
