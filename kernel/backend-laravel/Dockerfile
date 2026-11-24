# syntax=docker/dockerfile:1.7
# Production image: nginx + php-fpm under supervisord, running as a non-root user on port 8000.

# ---- 1. PHP dependencies (no dev packages, optimised autoloader) -----------------------------
FROM composer:2.8 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --no-scripts --prefer-dist --optimize-autoloader

# ---- 2. Runtime --------------------------------------------------------------------------------
FROM php:8.2-fpm-alpine3.21 AS runtime

RUN apk add --no-cache nginx supervisor curl postgresql-libs \
    && apk add --no-cache --virtual .build-deps postgresql-dev $PHPIZE_DEPS \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql opcache pcntl \
    && apk del .build-deps \
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php.ini "$PHP_INI_DIR/conf.d/zz-kernel.ini"
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-kernel.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Unprivileged runtime user; everything it writes lives in /var/www/storage, /var/www/bootstrap/cache and /tmp.
RUN addgroup -g 10001 -S kernel && adduser -u 10001 -S -G kernel -h /var/www kernel \
    && mkdir -p /var/lib/nginx/tmp /var/log/nginx /run/nginx /var/www \
    && chown -R kernel:kernel /var/lib/nginx /var/log/nginx /run/nginx /var/www

WORKDIR /var/www
COPY --chown=kernel:kernel . .
COPY --from=vendor --chown=kernel:kernel /app/vendor ./vendor
RUN rm -rf tests docker Dockerfile .env .env.example phpunit.xml phpstan.neon \
    && mkdir -p storage/app storage/framework/cache/data storage/framework/views storage/logs bootstrap/cache \
    && chown -R kernel:kernel storage bootstrap/cache && chmod -R ug+rwX storage bootstrap/cache \
    && php artisan package:discover --ansi

ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=json
USER kernel
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD curl -fsS http://127.0.0.1:8000/health || exit 1

ENTRYPOINT ["entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
