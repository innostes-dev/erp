<?php

namespace App\Providers;

use App\Kernel\Crypto\BlindIndex;
use App\Kernel\Crypto\FieldCipher;
use App\Kernel\Security\JwtService;
use App\Kernel\Security\Passwords;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FieldCipher::class, fn () => new FieldCipher(
            (array) config('kernel.crypto.keys'),
            (int) config('kernel.crypto.current_key_version')
        ));
        $this->app->singleton(BlindIndex::class, fn () => new BlindIndex((string) config('kernel.crypto.blind_index_pepper')));
        $this->app->singleton(Passwords::class, fn () => new Passwords((int) config('kernel.auth.bcrypt_cost')));
        $this->app->singleton(JwtService::class, fn () => new JwtService(
            (string) config('kernel.jwt.secret'),
            (string) config('kernel.jwt.algorithm'),
            (int) config('kernel.jwt.access_ttl_minutes'),
            (int) config('kernel.jwt.reset_ttl_minutes'),
        ));
    }

    public function boot(): void
    {
        Validator::extend('max_bytes', static fn ($attribute, $value, $parameters): bool => ! is_string($value) || strlen($value) <= (int) ($parameters[0] ?? 72));
        $this->assertSecureConfiguration();
        $this->configureRateLimiting();

        $proxies = config('kernel.trusted_proxies');
        if (is_string($proxies) && $proxies !== '') {
            TrustProxies::at($proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)));
        }
    }

    /** Refuse to boot in production with the well-known development secrets. */
    private function assertSecureConfiguration(): void
    {
        if (config('kernel.environment') !== 'production') {
            return;
        }
        $defaults = (array) config('kernel.insecure_defaults');
        $problems = [];

        $jwt = (string) config('kernel.jwt.secret');
        if ($jwt === $defaults['jwt_secret'] || strlen($jwt) < 32) {
            $problems[] = 'JWT_SECRET_KEY must be set to a unique secret of at least 32 characters';
        }
        foreach ((array) config('kernel.crypto.keys') as $version => $key) {
            if ($key === $defaults['encryption_key'] || strlen((string) $key) < 32) {
                $problems[] = "ENCRYPTION_KEYS version {$version} is the insecure default or too short";
            }
        }
        $pepper = (string) config('kernel.crypto.blind_index_pepper');
        if ($pepper === $defaults['pepper'] || strlen($pepper) < 32) {
            $problems[] = 'BLIND_INDEX_PEPPER must be set to a unique secret of at least 32 characters';
        }
        if (config('app.debug')) {
            $problems[] = 'APP_DEBUG must be false';
        }
        // Credentialed CORS must name its origins explicitly; "*" would let any site call the API with the user's cookies.
        foreach ((array) config('kernel.cors_origins') as $origin) {
            if (trim((string) $origin) === '*') {
                $problems[] = 'CORS_ORIGINS must list explicit origins, not "*", because cookies are credentialed';
            }
        }
        $setupToken = config('kernel.setup.token');
        if (config('kernel.setup.enabled') && is_string($setupToken) && strlen($setupToken) < 16) {
            $problems[] = 'SETUP_TOKEN must be at least 16 characters (or leave it unset to generate a random one)';
        }

        if ($problems !== []) {
            throw new RuntimeException('Refusing to start in production with insecure configuration: '.implode('; ', $problems).'.');
        }
    }

    private function configureRateLimiting(): void
    {
        $auth = (int) config('kernel.rate_limit.auth_per_minute');
        $perAccount = (int) config('kernel.rate_limit.login_per_account_per_minute');
        $api = (int) config('kernel.rate_limit.api_per_minute');

        RateLimiter::for('kernel-auth', fn (Request $request) => Limit::perMinute($auth)->by('auth:'.$request->ip()));

        // Forgot-password rotates the victim's password, so it is also limited per target account
        // (otherwise anyone could keep an account permanently locked out by looping over its email).
        RateLimiter::for('kernel-forgot', function (Request $request) use ($auth) {
            $email = $request->json('email');
            $account = is_string($email) ? sha1(strtolower(trim($email))) : 'none';

            return [
                Limit::perMinute($auth)->by('forgot-ip:'.$request->ip()),
                Limit::perHour(5)->by('forgot-acct:'.$account),
            ];
        });

        RateLimiter::for('kernel-login', function (Request $request) use ($auth, $perAccount) {
            $email = $request->json('email');
            $account = is_string($email) ? sha1(strtolower(trim($email))) : 'none';

            return [
                Limit::perMinute($auth)->by('login-ip:'.$request->ip()),
                Limit::perMinute($perAccount)->by('login-acct:'.$request->ip().'|'.$account),
            ];
        });

        RateLimiter::for('kernel-api', function (Request $request) use ($api) {
            $user = $request->attributes->get('kernel_user');

            return Limit::perMinute($api)->by('api:'.($user instanceof User ? $user->id : $request->ip()));
        });
    }
}
