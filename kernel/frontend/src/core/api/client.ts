/**
 * Minimal HTTP client for the backend engine (apps/api-server).
 *
 * The UI engine sets the API address once at startup with `configureApi`;
 * every kernel and module page then calls `apiRequest`.
 */

import { HttpStatus } from './http-status';

/** Settings for talking to the API. */
export interface ApiConfig {
  /** Base URL of the API server, e.g. `http://localhost:8001`. */
  baseUrl: string;
}

let config: ApiConfig = { baseUrl: 'http://localhost:8001' };

/**
 * Set the API address. Call once before rendering, from the UI engine.
 *
 * @example
 * configureApi({ baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8001' });
 */
export function configureApi(next: ApiConfig): void {
  config = { ...next, baseUrl: next.baseUrl.replace(/\/+$/, '') };
}

/** Current API settings. */
export function getApiConfig(): ApiConfig {
  return config;
}

/**
 * Error thrown for any non-2xx response or network failure.
 *
 * `status` is `HttpStatus.NETWORK_ERROR` (0) when the server could not be reached.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;
  /** Machine-readable error id from the API (`code` in the body), e.g. `setup_required`. */
  readonly code: string | null;
  /** Seconds to wait before retrying (`Retry-After` header), if the API sent one. */
  readonly retryAfter: number | null;

  constructor(
    status: number,
    message: string,
    detail?: unknown,
    options: { code?: string | null; retryAfter?: number | null } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.code = options.code ?? null;
    this.retryAfter = options.retryAfter ?? null;
  }

  /** True if the API server could not be reached at all. */
  get isNetworkError(): boolean {
    return this.status === HttpStatus.NETWORK_ERROR;
  }
}

/** Turn a FastAPI error body (`{detail: string | [...]}`) into a readable message. */
function messageFrom(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String(d.msg) : String(d)))
      .join('; ');
  }
  return fallback;
}

/**
 * Call the API and return the parsed JSON body.
 *
 * @param path - Path starting with `/`, e.g. `/setup/status`.
 * @param init - Fetch options. A `body` object is sent as JSON.
 * @throws {ApiError} On network failure or a non-2xx status.
 */
export async function apiRequest<T>(
  path: string,
  init: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(HttpStatus.NETWORK_ERROR, `Cannot reach the API server at ${config.baseUrl}`);
  }

  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const retryAfter = Number(response.headers.get('Retry-After'));
    throw new ApiError(
      response.status,
      messageFrom(body.detail, `Request failed with status ${response.status}`),
      body.detail,
      {
        code: typeof body.code === 'string' ? body.code : null,
        retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
      },
    );
  }
  return data as T;
}
