/**
 * Frontend client API for backend authentication endpoints.
 */

import { apiRequest } from '../core/api/client';
import type {
  ApiKeyCreatedResponse,
  ApiKeyItem,
  ApiKeyListResponse,
  ChangePasswordPayload,
  CreateApiKeyPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  MessageResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
  ResetPasswordPayload,
  TokenResponse,
  UserSummary,
} from './types';

const ACCESS_TOKEN_KEY = 'innostes_access_token';
const REFRESH_TOKEN_KEY = 'innostes_refresh_token';

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeAuthTokens(tokens: { access_token: string; refresh_token: string }): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Authenticate user and store session tokens. */
export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const result = await apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
  storeAuthTokens(result);
  return result;
}

/** Rotate refresh token. */
export async function refreshAccessToken(payload: RefreshTokenPayload): Promise<RefreshTokenResponse> {
  const result = await apiRequest<RefreshTokenResponse>('/auth/refresh', {
    method: 'POST',
    body: payload,
  });
  storeAuthTokens(result);
  return result;
}

/** Trigger password reset email with temporary password and one-click reset link. */
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: payload,
  });
}

/** Consume single-use reset token and set new password. */
export async function resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
  return apiRequest<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: payload,
  });
}

/** Change password for authenticated actor. */
export async function changePassword(payload: ChangePasswordPayload, token?: string): Promise<MessageResponse> {
  const bearer = token || getStoredAccessToken();
  return apiRequest<MessageResponse>('/auth/change-password', {
    method: 'POST',
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
    body: payload,
  });
}

/** Terminate session and clear tokens. */
export async function logout(logoutAll: boolean = false): Promise<MessageResponse> {
  const bearer = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  try {
    return await apiRequest<MessageResponse>('/auth/logout', {
      method: 'POST',
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
      body: {
        refresh_token: refreshToken,
        logout_all: logoutAll,
      },
    });
  } finally {
    clearStoredTokens();
  }
}

/** Fetch authenticated user profile. */
export async function getMe(token?: string): Promise<UserSummary> {
  const bearer = token || getStoredAccessToken();
  return apiRequest<UserSummary>('/auth/me', {
    method: 'GET',
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
  });
}

/** List all API keys for tenant. */
export async function listApiKeys(): Promise<ApiKeyListResponse> {
  const bearer = getStoredAccessToken();
  return apiRequest<ApiKeyListResponse>('/auth/api-keys', {
    method: 'GET',
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
  });
}

/** Generate a new API key. */
export async function createApiKey(payload: CreateApiKeyPayload): Promise<ApiKeyCreatedResponse> {
  const bearer = getStoredAccessToken();
  return apiRequest<ApiKeyCreatedResponse>('/auth/api-keys', {
    method: 'POST',
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
    body: payload,
  });
}

/** Revoke an API key. */
export async function revokeApiKey(keyId: string): Promise<ApiKeyItem> {
  const bearer = getStoredAccessToken();
  return apiRequest<ApiKeyItem>(`/auth/api-keys/${keyId}`, {
    method: 'DELETE',
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
  });
}

