<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\CreateApiKeyRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\LogoutRequest;
use App\Http\Requests\RefreshTokenRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Services\ApiKeyService;
use App\Kernel\Services\AuthService;
use App\Kernel\Services\Presenter;
use App\Kernel\Services\RbacService;
use App\Kernel\Services\TenantContext;
use App\Kernel\Services\TenantService;
use App\Kernel\Support\ClientIp;
use App\Kernel\Support\Uuid;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    private const FORGOT_MESSAGE = 'If an account exists with that email address, a password reset link and temporary password have been sent.';

    public function __construct(
        private readonly AuthService $auth,
        private readonly ApiKeyService $apiKeys,
        private readonly TenantContext $tenantContext,
        private readonly RbacService $rbac,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $ip = ClientIp::resolve($request);
        $ua = $request->headers->get('User-Agent');
        $result = $this->auth->login($request->validated(), $ip, $ua);

        $userId = (string) $result['user']['id'];
        $name = trim(($result['user']['first_name'] ?? '').' '.($result['user']['last_name'] ?? ''));
        $this->audit($request, null, 'LOGIN', 'user', $userId, [
            'entity_name' => $name !== '' ? $name : $result['user']['email'],
            'actor_id' => $userId,
            'actor_email' => $result['user']['email'],
            'actor_name' => $name !== '' ? $name : $result['user']['email'],
            'reason' => 'User authenticated via password credentials',
        ]);

        return $this->withAuthCookies($this->json($result), $result['access_token'], $result['refresh_token']);
    }

    public function refresh(RefreshTokenRequest $request): JsonResponse
    {
        $token = $request->validated('refresh_token') ?: $request->cookies->get('refresh_token');
        if (! is_string($token) || $token === '') {
            throw ServiceException::invalidToken('Refresh token missing.');
        }
        $result = $this->auth->refresh($token, ClientIp::resolve($request), $request->headers->get('User-Agent'));

        return $this->withAuthCookies($this->json($result), $result['access_token'], $result['refresh_token']);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->auth->forgotPassword($request->validated('email'));

        return $this->json(['message' => self::FORGOT_MESSAGE]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->auth->resetPassword($request->validated('token'), $request->validated('new_password'));

        return $this->json(['message' => 'Password has been successfully reset. You can now log in.']);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $this->actor($request);
        $this->auth->changePassword($user->id, $request->validated('current_password'), $request->validated('new_password'));
        $this->audit($request, $user, 'PASSWORD_RESET', 'user', $user->id, [
            'entity_name' => $user->fullName(),
            'reason' => 'User changed account password',
        ]);

        return $this->json(['message' => 'Password has been changed successfully.']);
    }

    public function logout(LogoutRequest $request): JsonResponse
    {
        $user = $this->actor($request);
        $data = $request->validated();
        $this->auth->logout($user->id, $data);
        $this->audit($request, $user, 'LOGOUT', 'user', $user->id, [
            'entity_name' => $user->fullName(),
            'reason' => ! empty($data['logout_all']) ? 'User logged out of all active sessions' : 'User logged out of active session',
        ]);

        $response = $this->json(['message' => 'Logged out successfully.']);
        $response->headers->setCookie($this->cookie('access_token', '', '/', -1));
        $response->headers->setCookie($this->cookie('refresh_token', '', '/auth', -1));

        return $response;
    }

    public function me(Request $request): JsonResponse|Response
    {
        $user = $this->actor($request);
        $etag = '"'.$user->token_version.'"';
        $ifNoneMatch = $request->headers->get('If-None-Match');
        if ($ifNoneMatch !== null && trim($ifNoneMatch) === $etag) {
            return response('', 304, ['ETag' => $etag]);
        }

        $tenantHeader = $request->headers->get('X-Tenant-ID');
        $tenantId = $tenantHeader !== null ? Uuid::require($tenantHeader, 'header', 'x-tenant-id') : null;

        return $this->json($this->auth->profile($user, $tenantId), 200, ['ETag' => $etag]);
    }

    // ---- API keys ------------------------------------------------------

    public function listApiKeys(Request $request): JsonResponse
    {
        $user = $this->actor($request);
        $tenantId = $this->keyTenant($request, $user);

        return $this->json(['items' => $this->apiKeys->list($tenantId, $this->keyOwnerFilter($user, $tenantId))->map(fn ($k) => Presenter::apiKey($k))->all()]);
    }

    public function createApiKey(CreateApiKeyRequest $request): JsonResponse
    {
        $user = $this->actor($request);
        $tenantId = $this->keyTenant($request, $user);
        $data = $request->validated();

        [$key, $raw] = $this->apiKeys->create($tenantId, $user->id, $data['name'], $data['scopes'] ?? null, $data['expires_in_days'] ?? null);
        $this->audit($request, $user, 'CREATE', 'api_key', $key->id, [
            'entity_name' => $key->name,
            'changes' => ['name' => ['old' => null, 'new' => $key->name], 'scopes' => ['old' => null, 'new' => $key->scopes]],
            'tenant_id' => $tenantId,
            'reason' => "Generated API key '{$key->name}'",
        ]);

        return $this->json(Presenter::apiKey($key) + ['raw_key' => $raw], 201);
    }

    public function revokeApiKey(Request $request, string $keyId): JsonResponse
    {
        $user = $this->actor($request);
        $keyId = Uuid::require($keyId, 'path', 'key_id');
        $tenantId = $this->keyTenant($request, $user);
        $key = $this->apiKeys->revoke($keyId, $tenantId, $user->id, $this->keyOwnerFilter($user, $tenantId));
        $this->audit($request, $user, 'DELETE', 'api_key', $key->id, [
            'entity_name' => $key->name,
            'changes' => ['is_active' => ['old' => true, 'new' => false]],
            'tenant_id' => $tenantId,
            'reason' => "Revoked API key '{$key->name}'",
        ]);

        return $this->json(Presenter::apiKey($key));
    }

    /**
     * API keys may not mint or revoke API keys: a stolen key could otherwise create a replacement that survives
     * its own revocation (and could widen its scopes/expiry). Key management needs an interactive login.
     */
    private function denyApiKeyPrincipal(Request $request): void
    {
        if ($this->apiKey($request) !== null) {
            throw ServiceException::forbidden('API keys cannot manage API keys; sign in with a user session.', ErrorCode::PERMISSION_DENIED);
        }
    }

    private function keyTenant(Request $request, User $user): string
    {
        $this->denyApiKeyPrincipal($request);
        $header = $request->headers->get('X-Tenant-ID');
        $header = $header !== null ? Uuid::require($header, 'header', 'x-tenant-id') : null;
        $tenantId = $this->tenantContext->resolveForMember($user, $header);
        if (Tenant::query()->whereKey($tenantId)->doesntExist()) {
            throw TenantService::notFound();
        }

        return $tenantId;
    }

    /** Keys are private to their creator unless the caller is a super admin or holds tenancy.members.manage in the tenant. */
    private function keyOwnerFilter(User $user, string $tenantId): ?string
    {
        if ($user->is_super_admin || $this->rbac->hasPermission($user->id, 'tenancy.members.manage', $tenantId)) {
            return null;
        }

        return $user->id;
    }

    // ---- cookies -------------------------------------------------------

    private function withAuthCookies(JsonResponse $response, string $access, string $refresh): JsonResponse
    {
        $response->headers->setCookie($this->cookie('access_token', $access, '/', 900));
        $response->headers->setCookie($this->cookie('refresh_token', $refresh, '/auth', 7 * 86400));

        return $response;
    }

    private function cookie(string $name, string $value, string $path, int $maxAge): Cookie
    {
        return Cookie::create(
            $name,
            $value,
            $maxAge < 0 ? 1 : time() + $maxAge,
            $path,
            null,
            (bool) config('kernel.auth.cookie_secure'),
            true,
            false,
            (string) config('kernel.auth.cookie_samesite')
        );
    }
}
