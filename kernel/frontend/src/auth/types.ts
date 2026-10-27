/**
 * Authentication module types matching the backend OpenAPI schema.
 */

export interface UserSummary {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  mobile: string | null;
  status: string;
  is_super_admin: boolean;
  token_version: number;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_fingerprint?: string;
  device_name?: string | null;
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'scanner' | 'kiosk';
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  must_change_password: boolean;
  user: UserSummary;
}

export interface RefreshTokenPayload {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}
