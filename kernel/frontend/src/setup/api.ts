import { ApiError, apiRequest } from '../core/api/client';
import type { AppConfig, SetupChecks, SetupRequest, SetupResult, SetupStatus } from './types';

/** Header that carries the one-time setup token. */
export const SETUP_TOKEN_HEADER = 'X-Setup-Token';

/** Error codes the setup API returns in `ApiError.code`. */
export const SetupErrorCode = {
  /** Normal API routes are blocked until setup is complete. */
  SETUP_REQUIRED: 'setup_required',
  /** The setup token is missing or wrong. */
  INVALID_SETUP_TOKEN: 'invalid_setup_token',
  /** The database can't be reached. */
  DATABASE_UNAVAILABLE: 'database_unavailable',
} as const;

/** True if an API call failed because the system isn't set up yet. */
export function isSetupRequired(error: unknown): boolean {
  return error instanceof ApiError && error.code === SetupErrorCode.SETUP_REQUIRED;
}

/**
 * Fetch application metadata/config.
 * Intercepted with 503 `setup_required` if setup has not been completed.
 */
export function getAppConfig(): Promise<AppConfig> {
  return apiRequest<AppConfig>('/config');
}

/** Public: is the system installed? (Reveals nothing else.) */
export function getSetupStatus(): Promise<SetupStatus> {
  return apiRequest<SetupStatus>('/setup/status');
}

/**
 * Pre-install checks. Also verifies the token.
 *
 * @throws {ApiError} `HttpStatus.UNAUTHORIZED` wrong token, `HttpStatus.TOO_MANY_REQUESTS`
 *   too many wrong tokens, `HttpStatus.NOT_FOUND` setup no longer available.
 */
export function getSetupChecks(token: string): Promise<SetupChecks> {
  return apiRequest<SetupChecks>('/setup/checks', { headers: { [SETUP_TOKEN_HEADER]: token } });
}

/**
 * Run first-run setup. Works only once.
 *
 * @throws {ApiError} Same as `getSetupChecks`, plus `HttpStatus.CONFLICT` if the slug is taken
 *   or another request finished setup first.
 */
export function runSetup(request: SetupRequest, token: string): Promise<SetupResult> {
  return apiRequest<SetupResult>('/setup', {
    method: 'POST',
    body: request,
    headers: { [SETUP_TOKEN_HEADER]: token },
  });
}
