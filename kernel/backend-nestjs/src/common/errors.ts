/** Domain errors. Each carries its HTTP status, optional machine code and headers; the global filter renders them. */
export class ServiceError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export const ErrorCode = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_SUSPENDED: 'account_suspended',
  TEMPORARY_PASSWORD_EXPIRED: 'temporary_password_expired',
  DEVICE_WIPED: 'device_wiped',
  INVALID_TOKEN: 'invalid_token',
  PASSWORD_RECENTLY_USED: 'password_recently_used',
  ALREADY_INSTALLED: 'already_installed',
  DATABASE_UNAVAILABLE: 'database_unavailable',
  SETUP_NOT_AVAILABLE: 'setup_not_available',
  INVALID_SETUP_TOKEN: 'invalid_setup_token',
  SETUP_REQUIRED: 'setup_required',
  TENANT_NOT_FOUND: 'tenant_not_found',
  SLUG_TAKEN: 'slug_taken',
  PERMISSION_DENIED: 'permission_denied',
  EMAIL_ALREADY_EXISTS: 'email_already_exists',
  MOBILE_ALREADY_EXISTS: 'mobile_already_exists',
  USER_NOT_FOUND: 'user_not_found',
  DEVICE_NOT_FOUND: 'device_not_found',
  RATE_LIMITED: 'rate_limited',
} as const;

export class BadRequestError extends ServiceError {
  constructor(message = 'Bad request', code?: string) {
    super(400, message, code);
  }
}
export class UnauthorizedError extends ServiceError {
  constructor(message = 'Not authenticated', code?: string, headers: Record<string, string> = {}) {
    super(401, message, code, { 'WWW-Authenticate': 'Bearer', ...headers });
  }
}
export class ForbiddenError extends ServiceError {
  constructor(message = 'Not allowed', code?: string) {
    super(403, message, code);
  }
}
export class NotFoundError extends ServiceError {
  constructor(message = 'Resource not found', code?: string) {
    super(404, message, code);
  }
}
export class ConflictError extends ServiceError {
  constructor(message = 'Conflict with existing data', code?: string) {
    super(409, message, code);
  }
}
export class TooManyRequestsError extends ServiceError {
  constructor(message = 'Too many requests', retryAfter?: number) {
    super(429, message, ErrorCode.RATE_LIMITED, retryAfter === undefined ? {} : { 'Retry-After': String(retryAfter) });
  }
}
export class ServiceUnavailableError extends ServiceError {
  constructor(message = 'A required service (e.g. the database) is unavailable', code?: string) {
    super(503, message, code);
  }
}

// ---- authentication ---------------------------------------------------------
export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message = 'Invalid email or password') {
    super(message, ErrorCode.INVALID_CREDENTIALS);
  }
}
export class AccountLockedError extends UnauthorizedError {
  constructor(retryAfter = 900) {
    super(
      'Account is temporarily locked due to too many failed login attempts. Try again later.',
      ErrorCode.ACCOUNT_LOCKED,
      {
        'Retry-After': String(retryAfter),
      },
    );
  }
}
export class AccountSuspendedError extends ForbiddenError {
  constructor() {
    super('Account has been suspended or deactivated. Contact your administrator.', ErrorCode.ACCOUNT_SUSPENDED);
  }
}
export class TemporaryPasswordExpiredError extends UnauthorizedError {
  constructor() {
    super('Temporary password has expired. Please request a new password reset.', ErrorCode.TEMPORARY_PASSWORD_EXPIRED);
  }
}
export class DeviceWipedError extends ForbiddenError {
  constructor() {
    super('This device has been remotely wiped. Access is blocked.', ErrorCode.DEVICE_WIPED);
  }
}
export class InvalidTokenError extends UnauthorizedError {
  constructor(message = 'Invalid or expired token') {
    super(message, ErrorCode.INVALID_TOKEN);
  }
}
export class PasswordRecentlyUsedError extends ConflictError {
  constructor() {
    super(
      'Cannot reuse a recently used password. Please choose a different password.',
      ErrorCode.PASSWORD_RECENTLY_USED,
    );
  }
}

// ---- users / tenancy / setup ------------------------------------------------
export class EmailAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(`User with email '${email}' already exists.`, ErrorCode.EMAIL_ALREADY_EXISTS);
  }
}
export class MobileAlreadyExistsError extends ConflictError {
  constructor() {
    super('User with this mobile number already exists.', ErrorCode.MOBILE_ALREADY_EXISTS);
  }
}
export class UserNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super(`User '${identifier}' not found.`, ErrorCode.USER_NOT_FOUND);
  }
}
export class DeviceNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Device '${id}' not found.`, ErrorCode.DEVICE_NOT_FOUND);
  }
}
export class TenantNotFoundError extends NotFoundError {
  constructor(message = 'Tenant not found') {
    super(message, ErrorCode.TENANT_NOT_FOUND);
  }
}
export class SlugTakenError extends ConflictError {
  constructor(slug: string) {
    super(`Slug '${slug}' is already in use`, ErrorCode.SLUG_TAKEN);
  }
}
export class AlreadyInstalledError extends ConflictError {
  constructor() {
    super('Setup has already been completed', ErrorCode.ALREADY_INSTALLED);
  }
}
export class DatabaseUnavailableError extends ServiceUnavailableError {
  constructor() {
    super('Cannot connect to the database', ErrorCode.DATABASE_UNAVAILABLE);
  }
}
export class SetupNotAvailableError extends NotFoundError {
  constructor() {
    super('Not Found', ErrorCode.SETUP_NOT_AVAILABLE);
  }
}
export class InvalidSetupTokenError extends ServiceError {
  constructor() {
    super(401, 'Missing or invalid setup token', ErrorCode.INVALID_SETUP_TOKEN, {
      'WWW-Authenticate': 'SetupToken header="X-Setup-Token"',
    });
  }
}
export class SetupRequiredError extends ServiceUnavailableError {
  constructor() {
    super('Setup has not been completed', ErrorCode.SETUP_REQUIRED);
  }
}
