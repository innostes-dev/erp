<?php

/*
 * Kernel configuration. All environment access happens here so that
 * `php artisan config:cache` works in production.
 *
 * The insecure defaults below are deliberately identical to the FastAPI
 * kernel defaults so a development database can be shared between backends;
 * the KernelServiceProvider refuses to boot with them when APP_ENV=production.
 */

$bool = static fn (string $key, bool $default): bool => filter_var(env($key, $default), FILTER_VALIDATE_BOOLEAN);

$defaultJwtSecret = 'insecure-dev-secret-key-change-in-production';
$defaultEncryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
$defaultPepper = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

$keysRaw = env('ENCRYPTION_KEYS');
$keys = [1 => $defaultEncryptionKey];
if (is_string($keysRaw) && $keysRaw !== '') {
    $decoded = json_decode($keysRaw, true);
    if (is_array($decoded) && $decoded !== []) {
        $keys = [];
        foreach ($decoded as $version => $secret) {
            $keys[(int) $version] = (string) $secret;
        }
    }
}

$origins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ORIGINS', 'http://localhost:4200,http://127.0.0.1:4200'))
)));

return [
    'name' => env('APP_NAME', 'Innostes ERP API'),
    'version' => env('APP_VERSION', '0.1.0'),
    'environment' => env('APP_ENV', 'development'),
    'frontend_url' => rtrim((string) env('FRONTEND_URL', 'http://localhost:4200'), '/'),
    'cors_origins' => $origins,

    'setup' => [
        'enabled' => $bool('SETUP_ENABLED', true),
        'token' => env('SETUP_TOKEN') ?: null,
        'token_file' => env('SETUP_TOKEN_FILE', storage_path('app/setup-token')),
        'max_attempts' => (int) env('SETUP_MAX_ATTEMPTS', 10),
        'window_seconds' => (int) env('SETUP_ATTEMPT_WINDOW_SECONDS', 900),
    ],

    'jwt' => [
        'secret' => (string) env('JWT_SECRET_KEY', $defaultJwtSecret),
        'algorithm' => env('JWT_ALGORITHM', 'HS256'),
        'access_ttl_minutes' => (int) env('ACCESS_TOKEN_EXPIRE_MINUTES', 30),
        'refresh_ttl_days' => (int) env('REFRESH_TOKEN_EXPIRE_DAYS', 7),
        'reset_ttl_minutes' => (int) env('PASSWORD_RESET_TOKEN_EXPIRE_MINUTES', 60),
        'temp_password_hours' => (int) env('TEMP_PASSWORD_EXPIRE_HOURS', 24),
    ],

    'auth' => [
        'max_failed_attempts' => (int) env('MAX_FAILED_LOGIN_ATTEMPTS', 5),
        'lockout_minutes' => (int) env('ACCOUNT_LOCKOUT_MINUTES', 15),
        'bcrypt_cost' => (int) env('BCRYPT_ROUNDS', 12),
        // Secure by default in production; plain-HTTP development keeps working.
        'cookie_secure' => $bool('COOKIE_SECURE', env('APP_ENV') === 'production'),
        'cookie_samesite' => env('COOKIE_SAMESITE', 'lax'),
    ],

    'crypto' => [
        'current_key_version' => (int) env('ENCRYPTION_CURRENT_KEY_VERSION', 1),
        'keys' => $keys,
        'blind_index_pepper' => (string) env('BLIND_INDEX_PEPPER', $defaultPepper),
    ],

    'insecure_defaults' => [
        'jwt_secret' => $defaultJwtSecret,
        'encryption_key' => $defaultEncryptionKey,
        'pepper' => $defaultPepper,
    ],

    'rate_limit' => [
        'auth_per_minute' => (int) env('RATE_LIMIT_AUTH_PER_MINUTE', 60),
        'login_per_account_per_minute' => (int) env('RATE_LIMIT_LOGIN_PER_ACCOUNT_PER_MINUTE', 10),
        'api_per_minute' => (int) env('RATE_LIMIT_API_PER_MINUTE', 600),
    ],

    'smtp' => [
        'host' => env('SMTP_HOST') ?: null,
        'port' => (int) env('SMTP_PORT', 587),
        'username' => env('SMTP_USERNAME') ?: null,
        'password' => env('SMTP_PASSWORD') ?: null,
        'from' => env('SMTP_FROM', 'Innostes ERP <noreply@innostes.com>'),
        'use_tls' => $bool('SMTP_USE_TLS', true),
    ],

    'trusted_proxies' => env('TRUSTED_PROXIES') ?: null,
];
