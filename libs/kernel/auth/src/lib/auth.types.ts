export type { User, LoginCredentials } from '@mono/shared/types';

export interface AuthState {
  user: import('@mono/shared/types').User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  login: (credentials: import('@mono/shared/types').LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export type AuthContextValue = AuthState & AuthActions;
