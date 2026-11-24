#!/bin/sh
# Container entrypoint: refuses to start with an incomplete configuration, caches config/routes, optionally migrates.
set -eu

cd /var/www

# Fails fast (non-zero exit) when APP_ENV=production and JWT/encryption/pepper are insecure defaults.
php artisan config:cache --no-ansi
php artisan route:cache --no-ansi

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force --no-ansi
fi

exec "$@"
