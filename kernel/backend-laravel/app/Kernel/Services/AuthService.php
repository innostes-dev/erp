<?php

namespace App\Kernel\Services;

use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Security\JwtService;
use App\Kernel\Security\Passwords;
use App\Kernel\Support\Uuid;
use App\Models\PasswordHistory;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UserDevice;
use App\Models\UserSecurity;
use App\Models\UserSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

class AuthService
{
    private const KNOWN_MODULES = [
        'salesflow' => ['SalesFlow CRM', 'High-velocity pipelines, quote-to-cash & revenue forecasting.'],
        'peopleops' => ['PeopleOps HRMS', 'Workforce directory, attendance & leave approvals.'],
        'tracura' => ['Tracura Telemetry', 'Universal API telemetry, distributed tracing & request logging.'],
        'ledgerflow' => ['LedgerFlow Finance', 'General ledger, multi-currency accounts & tax filing.'],
        'docflow' => ['DocFlow Documents', 'Compliant document generation & e-signature pipelines.'],
        'stockflow' => ['StockFlow Inventory', 'Real-time inventory, purchase orders & barcode tracking.'],
        'hireflow' => ['HireFlow Recruiting', 'Candidate pipeline, applicant tracking & scorecards.'],
        'sprintflow' => ['SprintFlow Agile', 'Agile sprint boards, backlog management & issue tracking.'],
    ];

    public function __construct(
        private readonly UserService $users,
        private readonly DeviceService $devices,
        private readonly RbacService $rbac,
        private readonly EmailService $email,
        private readonly Passwords $passwords,
        private readonly JwtService $jwt,
        private readonly Presenter $presenter,
        private readonly CredentialService $credentials,
    ) {}

    public static function hashRefreshToken(string $token): string
    {
        return hash('sha256', $token);
    }

    private static function newRefreshToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
    }

    /**
     * @param  array{email: string, password: string, device_fingerprint?: string, device_name?: ?string, device_type?: string}  $data
     * @return array<string, mixed> TokenResponse
     */
    public function login(array $data, ?string $ip, ?string $userAgent): array
    {
        $now = Carbon::now();
        $user = $this->users->findByEmail($data['email']);

        // Neutralise account-enumeration timing differences.
        if ($user === null) {
            $this->passwords->dummyVerify($data['password']);
            throw ServiceException::invalidCredentials();
        }

        if ($user->isBlocked()) {
            if ($user->status === 'suspended') {
                throw self::suspended();
            }
            $retry = $user->blocked_until !== null ? max(1, (int) $now->diffInSeconds($user->blocked_until, false)) : 900;
            throw ServiceException::unauthorized(
                'Account is temporarily locked due to too many failed login attempts. Try again later.',
                ErrorCode::ACCOUNT_LOCKED,
                ['Retry-After' => (string) $retry]
            );
        }
        if ($user->status !== 'active') {
            throw self::suspended();
        }

        $passwordHash = $this->credentials->passwordHash($user);
        if ($passwordHash === null) {
            $this->passwords->dummyVerify($data['password']);
        }
        if ($passwordHash === null || ! $this->passwords->verify($data['password'], $passwordHash)) {
            $this->recordFailedLogin($user->id, $now);
            throw ServiceException::invalidCredentials();
        }

        if ($user->must_change_password && $user->temp_password_expires_at !== null && $user->temp_password_expires_at->lt($now)) {
            throw ServiceException::unauthorized(
                'Temporary password has expired. Please request a new password reset.',
                ErrorCode::TEMPORARY_PASSWORD_EXPIRED
            );
        }

        $rawRefresh = self::newRefreshToken();

        DB::transaction(function () use ($user, $data, $ip, $userAgent, $now, $rawRefresh): void {
            // Reset the failure counter on success (conditional update keeps concurrent attempts consistent).
            User::query()->whereKey($user->id)->update(['failed_login_attempts' => 0, 'blocked_until' => null]);

            $device = $this->devices->registerOrTouch(
                $user->id,
                $data['device_fingerprint'] ?? 'browser-client-default',
                $data['device_name'] ?? 'Web Client',
                $data['device_type'] ?? 'desktop',
                $ip
            );
            if ($device->status === 'wiped') {
                throw new ServiceException(403, 'This device has been remotely wiped. Access is blocked.', ErrorCode::DEVICE_WIPED);
            }

            UserSecurity::query()->where('user_id', $user->id)->update(['last_login_at' => $now, 'last_login_ip' => $ip]);

            UserSession::query()->create([
                'user_id' => $user->id,
                'device_id' => $device->id,
                'refresh_token_hash' => self::hashRefreshToken($rawRefresh),
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'expires_at' => $now->copy()->addDays((int) config('kernel.jwt.refresh_ttl_days')),
            ]);
        });

        $accessToken = $this->accessTokenFor($user);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $rawRefresh,
            'token_type' => 'bearer',
            'expires_in' => (int) config('kernel.jwt.access_ttl_minutes') * 60,
            'must_change_password' => (bool) $user->must_change_password,
            'user' => $this->presenter->user($user->refresh()),
        ];
    }

    /**
     * Persist the failed attempt atomically and outside any request transaction, so the counter
     * (and the lockout) survives the 401 that follows. Fixes the reference defect where it rolled back.
     */
    private function recordFailedLogin(string $userId, Carbon $now): void
    {
        $max = (int) config('kernel.auth.max_failed_attempts');
        $lock = $now->copy()->addMinutes((int) config('kernel.auth.lockout_minutes'));

        DB::transaction(function () use ($userId, $max, $lock): void {
            $user = User::query()->whereKey($userId)->lockForUpdate()->first();
            if ($user === null) {
                return;
            }
            $attempts = (int) $user->failed_login_attempts + 1;
            $user->failed_login_attempts = $attempts;
            if ($attempts >= $max) {
                $user->blocked_until = $lock;
            }
            $user->saveQuietly();
        });
    }

    private function accessTokenFor(User $user): string
    {
        return $this->jwt->createAccessToken([
            'sub' => $user->id,
            'email' => $this->users->decryptEmail($user),
            'token_version' => (int) $user->token_version,
            'is_super_admin' => (bool) $user->is_super_admin,
        ]);
    }

    private static function suspended(): ServiceException
    {
        return ServiceException::forbidden('Account has been suspended or deactivated. Contact your administrator.', ErrorCode::ACCOUNT_SUSPENDED);
    }

    /**
     * Rotate a refresh token. Reuse of a revoked token revokes every session of the user, and that
     * revocation is committed before the 401 is raised.
     *
     * @return array<string, mixed> RefreshTokenResponse
     */
    public function refresh(string $refreshToken, ?string $ip, ?string $userAgent): array
    {
        $now = Carbon::now();
        $hash = self::hashRefreshToken($refreshToken);
        $session = UserSession::query()->where('refresh_token_hash', $hash)->first();
        if ($session === null) {
            throw ServiceException::invalidToken('Invalid refresh token');
        }

        if ($session->revoked_at !== null) {
            UserSession::query()->where('user_id', $session->user_id)->whereNull('revoked_at')->update(['revoked_at' => $now]);
            throw ServiceException::invalidToken('Refresh token was previously revoked. All active sessions invalidated.');
        }

        if ($session->expires_at->lt($now)) {
            $session->revoked_at = $now;
            $session->saveQuietly();
            throw ServiceException::invalidToken('Refresh token expired');
        }

        $user = $this->users->findById($session->user_id);
        if ($user === null || $user->status !== 'active' || $user->isBlocked()) {
            $session->revoked_at = $now;
            $session->saveQuietly();
            throw ServiceException::invalidToken('User account inactive or locked');
        }

        if ($session->device_id !== null) {
            $device = UserDevice::query()->whereKey($session->device_id)->first();
            if ($device !== null && $device->status === 'wiped') {
                throw new ServiceException(403, 'This device has been remotely wiped. Access is blocked.', ErrorCode::DEVICE_WIPED);
            }
        }

        $newRaw = self::newRefreshToken();
        $rotated = DB::transaction(function () use ($session, $user, $newRaw, $now, $ip, $userAgent): bool {
            // Atomic compare-and-set: of two concurrent refreshes with the same token only one wins.
            $claimed = UserSession::query()->whereKey($session->id)->whereNull('revoked_at')->update(['revoked_at' => $now, 'updated_at' => $now]);
            if ($claimed !== 1) {
                return false;
            }
            UserSession::query()->create([
                'user_id' => $user->id,
                'device_id' => $session->device_id,
                'refresh_token_hash' => self::hashRefreshToken($newRaw),
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'expires_at' => $now->copy()->addDays((int) config('kernel.jwt.refresh_ttl_days')),
            ]);

            return true;
        });
        if (! $rotated) {
            throw ServiceException::invalidToken('Invalid refresh token');
        }

        return [
            'access_token' => $this->accessTokenFor($user),
            'refresh_token' => $newRaw,
            'token_type' => 'bearer',
            'expires_in' => (int) config('kernel.jwt.access_ttl_minutes') * 60,
        ];
    }

    public function forgotPassword(string $email): void
    {
        $now = Carbon::now();
        $user = $this->users->findByEmail($email);
        if ($user === null || $user->status !== 'active') {
            $this->passwords->dummyVerify('dummy-password');

            return;
        }

        $temp = self::generateTempPassword();
        $hours = (int) config('kernel.jwt.temp_password_hours');

        DB::transaction(function () use ($user, $temp, $now, $hours): void {
            $this->credentials->setPasswordHash($user, $this->passwords->hash($temp));
            $user->must_change_password = true;
            $user->temp_password_expires_at = $now->copy()->addHours($hours);
            $user->token_version = (int) $user->token_version + 1;
            $user->saveQuietly();
            UserSession::query()->where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => $now]);
        });

        $resetToken = $this->jwt->createResetToken($user->id, (int) $user->token_version);
        $plainEmail = $this->users->decryptEmail($user);
        $link = config('kernel.frontend_url').'/reset-password?token='.$resetToken.'&email='.rawurlencode($plainEmail);

        $this->email->sendPasswordReset(
            $plainEmail,
            $user->fullName(),
            $temp,
            $link,
            $hours,
            (int) config('kernel.jwt.reset_ttl_minutes')
        );
    }

    public function resetPassword(string $token, string $newPassword): void
    {
        try {
            $claims = $this->jwt->decode($token);
        } catch (Throwable) {
            throw ServiceException::invalidToken('Password reset link is invalid or has expired.');
        }
        if (($claims['type'] ?? null) !== 'password_reset') {
            throw ServiceException::invalidToken('Invalid token type');
        }
        $sub = $claims['sub'] ?? null;
        if (! is_string($sub) || $sub === '') {
            throw ServiceException::invalidToken('Invalid subject claim');
        }
        if (! Uuid::isValid($sub)) {
            throw ServiceException::invalidToken('Invalid token subject format.');
        }

        DB::transaction(function () use ($sub, $claims, $newPassword): void {
            $user = User::query()->whereKey($sub)->lockForUpdate()->first();
            if ($user === null || $user->status !== 'active') {
                throw ServiceException::invalidToken('User account not found or inactive');
            }
            if ($user->token_version !== ($claims['token_version'] ?? null)) {
                throw ServiceException::invalidToken('This password reset link has already been used.');
            }
            $this->assertNotRecentlyUsed($user->id, $newPassword);
            $this->applyNewPassword($user, $newPassword);
        });
    }

    public function changePassword(string $userId, string $currentPassword, string $newPassword): void
    {
        DB::transaction(function () use ($userId, $currentPassword, $newPassword): void {
            $user = User::query()->whereKey($userId)->lockForUpdate()->first();
            if ($user === null || $user->status !== 'active') {
                throw ServiceException::invalidCredentials('User account not found or inactive.');
            }
            $currentHash = $this->credentials->passwordHash($user);
            if ($currentHash === null || ! $this->passwords->verify($currentPassword, $currentHash)) {
                throw ServiceException::invalidCredentials('Current password is incorrect.');
            }
            $this->assertNotRecentlyUsed($user->id, $newPassword);
            $this->applyNewPassword($user, $newPassword);
        });
    }

    private function applyNewPassword(User $user, string $newPassword): void
    {
        $hash = $this->passwords->hash($newPassword);
        $this->credentials->setPasswordHash($user, $hash, $user->id);
        $user->must_change_password = false;
        $user->temp_password_expires_at = null;
        $user->token_version = (int) $user->token_version + 1;
        $user->save();

        PasswordHistory::query()->create(['user_id' => $user->id, 'password_hash' => $hash]);
        UserSecurity::query()->where('user_id', $user->id)->update(['password_changed_at' => Carbon::now()]);
    }

    private function assertNotRecentlyUsed(string $userId, string $newPassword, int $limit = 5): void
    {
        $hashes = PasswordHistory::query()->where('user_id', $userId)->orderByDesc('created_at')->limit($limit)->pluck('password_hash');
        foreach ($hashes as $hash) {
            if ($this->passwords->verify($newPassword, $hash)) {
                throw ServiceException::conflict(
                    'Cannot reuse a recently used password. Please choose a different password.',
                    ErrorCode::PASSWORD_RECENTLY_USED
                );
            }
        }
    }

    /**
     * @param  array{refresh_token?: ?string, logout_all?: bool}  $data
     */
    public function logout(string $userId, array $data): void
    {
        $now = Carbon::now();
        DB::transaction(function () use ($userId, $data, $now): void {
            if (! empty($data['logout_all'])) {
                UserSession::query()->where('user_id', $userId)->whereNull('revoked_at')->update(['revoked_at' => $now]);
                // Invalidate in-flight access tokens immediately.
                User::query()->whereKey($userId)->increment('token_version');
            } elseif (! empty($data['refresh_token'])) {
                UserSession::query()
                    ->where('user_id', $userId)
                    ->where('refresh_token_hash', self::hashRefreshToken($data['refresh_token']))
                    ->update(['revoked_at' => $now]);
            }
        });
    }

    private static function generateTempPassword(int $length = 16): string
    {
        $upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lower = 'abcdefghijklmnopqrstuvwxyz';
        $digits = '0123456789';
        $symbols = '!@#$%^&*()-_=+';
        $pick = static fn (string $set): string => $set[random_int(0, strlen($set) - 1)];

        $chars = [$pick($upper), $pick($upper), $pick($lower), $pick($lower), $pick($digits), $pick($digits), $pick($symbols), $pick($symbols)];
        $all = $upper.$lower.$digits.$symbols;
        while (count($chars) < $length) {
            $chars[] = $pick($all);
        }
        for ($i = count($chars) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$chars[$i], $chars[$j]] = [$chars[$j], $chars[$i]];
        }

        return implode('', $chars);
    }

    /**
     * Canonical GET /auth/me payload: profile + active tenant + accessible tenants + entitled modules.
     *
     * @return array<string, mixed>
     */
    public function profile(User $user, ?string $tenantId): array
    {
        $base = $this->presenter->user($user);

        $tenantQuery = Tenant::query()->orderBy('created_at');
        if (! $user->is_super_admin) {
            $tenantQuery->whereIn('id', DB::table('tenant_members')
                ->where('user_id', $user->id)->where('status', 'active')->select('tenant_id'));
        }
        $tenants = $tenantQuery->get(['id', 'name', 'slug']);
        $accessible = $tenants->map(fn (Tenant $t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug])->all();

        $active = null;
        foreach ($accessible as $t) {
            if ($tenantId !== null && $t['id'] === $tenantId) {
                $active = $t;
                break;
            }
        }
        $active ??= $accessible[0] ?? null;

        if ($active === null) {
            return $base + ['active_tenant' => null, 'accessible_tenants' => [], 'accessible_modules' => []];
        }

        $activeModuleIds = DB::table('tenant_modules')
            ->where('tenant_id', $active['id'])->where('is_active', true)->whereNull('deleted_at')
            ->pluck('module_id')->all();

        $roles = $this->rbac->getUserRoles($user->id, $active['id']);
        $perms = $this->rbac->getUserPermissions($user->id, $active['id']);
        $roleCodes = array_map(fn ($r) => $r->code, $roles);
        $isOwnerOrAdmin = $user->is_super_admin || array_intersect($roleCodes, ['owner', 'admin', 'super_admin']) !== [];

        if ($isOwnerOrAdmin) {
            $entitled = $activeModuleIds;
        } else {
            $grants = $this->rbac->getUserModuleGrants($user->id, $active['id']);
            $roleModules = array_values(array_filter(array_map(fn ($r) => $r->module_code, $roles)));
            $entitled = array_values(array_unique([...$grants, ...$roleModules]));
        }

        $accessibleCodes = array_values(array_intersect($activeModuleIds, $entitled));
        sort($accessibleCodes);

        $modules = [];
        foreach ($accessibleCodes as $code) {
            [$title, $desc] = self::KNOWN_MODULES[$code] ?? [ucfirst(strtolower($code)), ucfirst(strtolower($code)).' business module.'];

            $modRole = null;
            foreach ($roles as $r) {
                if ($r->module_code === $code) {
                    $modRole = $r;
                    break;
                }
            }
            if ($modRole === null && $user->is_super_admin) {
                $roleSummary = ['code' => 'super_admin', 'name' => 'Super Administrator', 'hierarchy_level' => 100];
            } elseif ($modRole === null && in_array('owner', $roleCodes, true)) {
                $roleSummary = ['code' => 'owner', 'name' => 'Organization Owner', 'hierarchy_level' => 80];
            } elseif ($modRole === null && in_array('admin', $roleCodes, true)) {
                $roleSummary = ['code' => 'admin', 'name' => 'Administrator', 'hierarchy_level' => 50];
            } elseif ($modRole !== null) {
                $roleSummary = ['code' => $modRole->code, 'name' => $modRole->name, 'hierarchy_level' => (int) $modRole->hierarchy_level];
            } else {
                $roleSummary = ['code' => 'member', 'name' => 'Member', 'hierarchy_level' => 10];
            }

            $modPerms = array_values(array_map(fn ($p) => $p['code'], array_filter($perms, fn ($p) => $p['module'] === $code)));
            if ($isOwnerOrAdmin && $modPerms === []) {
                $modPerms = DB::table('permissions')->where('module', $code)->pluck('code')->all();
            }

            $scope = 'OWN';
            if ($isOwnerOrAdmin) {
                $scope = 'ORGANIZATION';
            } else {
                $modScopes = array_map(fn ($p) => $p['scope'], array_filter($perms, fn ($p) => $p['module'] === $code));
                foreach (['ORGANIZATION', 'DEPARTMENT', 'TEAM', 'OWN'] as $candidate) {
                    if (in_array($candidate, $modScopes, true)) {
                        $scope = $candidate;
                        break;
                    }
                }
            }

            $modules[] = [
                'id' => $code, 'code' => $code, 'name' => $title, 'description' => $desc,
                'role' => $roleSummary, 'data_scope' => $scope, 'permissions' => $modPerms,
            ];
        }

        return $base + ['active_tenant' => $active, 'accessible_tenants' => $accessible, 'accessible_modules' => $modules];
    }
}
