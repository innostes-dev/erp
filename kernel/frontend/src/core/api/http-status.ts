/**
 * HTTP status codes, as named constants.
 *
 * Compare `ApiError.status` against these instead of writing numbers:
 *
 * @example
 * if (error instanceof ApiError && error.status === HttpStatus.CONFLICT) { ... }
 *
 * The error codes match the backend exception classes in
 * `kernel/backend/kernel/core/services/errors.py` (e.g. `CONFLICT` ↔ `ConflictError`).
 * Keep both lists in sync.
 */
export const HttpStatus = {
  /** The API server could not be reached (no HTTP response at all). */
  NETWORK_ERROR: 0,

  // 2xx success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 4xx client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  IM_A_TEAPOT: 418,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,

  // 5xx server errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511,
} as const;

/** One of the `HttpStatus` values. */
export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

/** True for 4xx statuses (the request was wrong). */
export function isClientError(status: number): boolean {
  return status >= HttpStatus.BAD_REQUEST && status < HttpStatus.INTERNAL_SERVER_ERROR;
}

/** True for 5xx statuses (the server or a dependency failed). */
export function isServerError(status: number): boolean {
  return status >= HttpStatus.INTERNAL_SERVER_ERROR && status <= 599;
}
