<?php

namespace App\Kernel\Exceptions;

/** Machine-readable error codes shared by all backends (see docs/backend-parity/conventions.md). */
final class ErrorCode
{
    public const INVALID_CREDENTIALS = 'invalid_credentials';

    public const ACCOUNT_LOCKED = 'account_locked';

    public const ACCOUNT_SUSPENDED = 'account_suspended';

    public const TEMPORARY_PASSWORD_EXPIRED = 'temporary_password_expired';

    public const DEVICE_WIPED = 'device_wiped';

    public const INVALID_TOKEN = 'invalid_token';

    public const PASSWORD_RECENTLY_USED = 'password_recently_used';

    public const ALREADY_INSTALLED = 'already_installed';

    public const DATABASE_UNAVAILABLE = 'database_unavailable';

    public const SETUP_NOT_AVAILABLE = 'setup_not_available';

    public const INVALID_SETUP_TOKEN = 'invalid_setup_token';

    public const SETUP_REQUIRED = 'setup_required';

    public const TENANT_NOT_FOUND = 'tenant_not_found';

    public const SLUG_TAKEN = 'slug_taken';

    public const PERMISSION_DENIED = 'permission_denied';

    public const EMAIL_ALREADY_EXISTS = 'email_already_exists';

    public const MOBILE_ALREADY_EXISTS = 'mobile_already_exists';

    public const USER_NOT_FOUND = 'user_not_found';

    public const DEVICE_NOT_FOUND = 'device_not_found';
}
