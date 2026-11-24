<?php

namespace App\Http\Middleware;

use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Security\JwtService;
use App\Kernel\Services\ApiKeyService;
use App\Kernel\Services\UserService;
use App\Kernel\Support\Uuid;
use Closure;
use Firebase\JWT\ExpiredException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * The kernel's own bearer scheme (no Sanctum/Passport): JWT access token or `inno_live_` API key,
 * from the Authorization header or the `access_token` cookie. Ports AuthDependencies.get_current_user.
 */
class AuthenticateKernel
{
    public function __construct(
        private readonly UserService $users,
        private readonly ApiKeyService $apiKeys,
        private readonly JwtService $jwt,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $raw = $this->extractToken($request);
        if ($raw === null || $raw === '') {
            throw ServiceException::invalidToken('Authentication token or API key required.');
        }
        if ($this->usesCookie($request)) {
            $this->assertSameSiteOrigin($request);
        }

        if (str_starts_with($raw, ApiKeyService::PREFIX)) {
            $key = $this->apiKeys->verify($raw);
            if ($key === null) {
                throw ServiceException::invalidToken('Invalid, expired, or revoked API key.');
            }
            $user = $this->users->findById($key->user_id);
            if ($user === null || $user->status !== 'active' || $user->isBlocked()) {
                throw self::suspended();
            }
            $request->attributes->set('kernel_api_key', $key);
            $request->attributes->set('kernel_user', $user);

            return $next($request);
        }

        try {
            $claims = $this->jwt->decode($raw);
        } catch (ExpiredException) {
            throw ServiceException::invalidToken('Access token has expired.');
        } catch (Throwable) {
            throw ServiceException::invalidToken('Invalid access token.');
        }

        if (($claims['type'] ?? null) !== 'access') {
            throw ServiceException::invalidToken('Invalid token type: expected access token.');
        }
        $sub = $claims['sub'] ?? null;
        if ($sub === null || $sub === '') {
            throw ServiceException::invalidToken('Token subject is missing.');
        }
        if (! is_string($sub) || ! Uuid::isValid($sub)) {
            throw ServiceException::invalidToken('Invalid token subject format.');
        }

        $user = $this->users->findById($sub);
        if ($user === null || $user->status !== 'active' || $user->isBlocked()) {
            throw self::suspended();
        }
        // The claim is mandatory: a token without it must not bypass server-side revocation.
        if (! isset($claims['token_version']) || ! is_int($claims['token_version']) || $user->token_version !== $claims['token_version']) {
            throw ServiceException::invalidToken('Token version invalidated. Please log in again.');
        }

        $request->attributes->set('kernel_user', $user);

        return $next($request);
    }

    private function usesCookie(Request $request): bool
    {
        return $request->headers->get('Authorization') === null && $request->cookies->has('access_token');
    }

    /**
     * Cookie-authenticated state-changing requests must come from an allowed origin (CSRF defence in depth on top of
     * SameSite): browsers always send Origin on cross-site POST/PATCH/DELETE.
     */
    private function assertSameSiteOrigin(Request $request): void
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }
        $origin = $request->headers->get('Origin');
        if ($origin === null || $origin === '') {
            return; // non-browser client
        }
        $allowed = array_map(static fn ($o) => rtrim((string) $o, '/'), (array) config('kernel.cors_origins'));
        if (! in_array(rtrim($origin, '/'), $allowed, true) && $origin !== $request->getSchemeAndHttpHost()) {
            throw ServiceException::forbidden('Cross-origin request rejected.', ErrorCode::PERMISSION_DENIED);
        }
    }

    private function extractToken(Request $request): ?string
    {
        $header = $request->headers->get('Authorization');
        if ($header !== null && preg_match('/^Bearer\s+(.+)$/i', $header, $m) === 1) {
            return trim($m[1]);
        }
        $cookie = $request->cookies->get('access_token');

        return is_string($cookie) ? $cookie : null;
    }

    private static function suspended(): ServiceException
    {
        return ServiceException::forbidden('Account has been suspended or deactivated. Contact your administrator.', ErrorCode::ACCOUNT_SUSPENDED);
    }
}
