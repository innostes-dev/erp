<?php

namespace Tests\Feature;

use App\Kernel\Crypto\BlindIndex;
use App\Kernel\Security\JwtService;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->install()->assertCreated();
    }

    public function test_login_returns_tokens_cookies_and_audit_row(): void
    {
        $response = $this->postJson('/auth/login', ['email' => self::ADMIN_EMAIL, 'password' => self::ADMIN_PASSWORD]);
        $response->assertOk()
            ->assertJsonPath('token_type', 'bearer')
            ->assertJsonPath('expires_in', 1800)
            ->assertJsonPath('must_change_password', false)
            ->assertJsonPath('user.email', self::ADMIN_EMAIL)
            ->assertCookie('access_token', null, false)
            ->assertCookie('refresh_token', null, false);
        $cookies = collect($response->headers->getCookies())->keyBy(fn ($c) => $c->getName());
        $this->assertTrue($cookies['access_token']->isHttpOnly());
        $this->assertSame('/auth', $cookies['refresh_token']->getPath());

        $stored = UserSession::query()->firstOrFail();
        $this->assertSame(hash('sha256', $response->json('refresh_token')), $stored->refresh_token_hash);
        $this->assertSame(1, AuditLog::query()->where('action', 'LOGIN')->count());
    }

    public function test_access_token_claims_follow_the_convention(): void
    {
        $token = $this->login()['access_token'];
        $claims = app(JwtService::class)->decode($token);
        $this->assertSame(['sub', 'email', 'token_version', 'is_super_admin', 'type', 'iat', 'exp'], array_keys($claims));
        $this->assertSame('access', $claims['type']);
        $this->assertSame(1800, $claims['exp'] - $claims['iat']);
    }

    public function test_pii_is_encrypted_at_rest_and_looked_up_by_blind_index(): void
    {
        $user = User::query()->firstOrFail();
        $this->assertStringStartsWith('v1:', $user->email_encrypted);
        $this->assertStringNotContainsString('admin', $user->email_encrypted);
        $this->assertSame(app(BlindIndex::class)->compute(self::ADMIN_EMAIL), $user->email_hash);
        $this->assertStringStartsWith('$2y$', $user->password_hash);
        $this->postJson('/auth/login', ['email' => 'ADMIN@Tests.Example.com', 'password' => self::ADMIN_PASSWORD])->assertOk();
    }

    public function test_unknown_user_and_wrong_password_are_indistinguishable(): void
    {
        $a = $this->postJson('/auth/login', ['email' => self::ADMIN_EMAIL, 'password' => 'nope-nope-nope']);
        $b = $this->postJson('/auth/login', ['email' => 'ghost@tests.example.com', 'password' => 'nope-nope-nope']);
        $a->assertStatus(401)->assertJsonPath('code', 'invalid_credentials')->assertHeader('WWW-Authenticate', 'Bearer');
        $this->assertSame($a->json(), $b->json());
    }

    public function test_lockout_persists_after_failed_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/auth/login', ['email' => self::ADMIN_EMAIL, 'password' => 'wrong-wrong'])->assertStatus(401)->assertJsonPath('code', 'invalid_credentials');
        }
        $user = User::query()->firstOrFail();
        $this->assertSame(5, $user->failed_login_attempts);
        $this->assertNotNull($user->blocked_until);

        $locked = $this->postJson('/auth/login', ['email' => self::ADMIN_EMAIL, 'password' => self::ADMIN_PASSWORD]);
        $locked->assertStatus(401)->assertJsonPath('code', 'account_locked');
        $this->assertGreaterThan(0, (int) $locked->headers->get('Retry-After'));
        $this->assertLessThanOrEqual(900, (int) $locked->headers->get('Retry-After'));
    }

    public function test_successful_login_resets_the_failure_counter(): void
    {
        $this->postJson('/auth/login', ['email' => self::ADMIN_EMAIL, 'password' => 'wrong-wrong'])->assertStatus(401);
        $this->assertSame(1, User::query()->firstOrFail()->failed_login_attempts);
        $this->login();
        $this->assertSame(0, User::query()->firstOrFail()->failed_login_attempts);
    }

    public function test_suspended_account_cannot_login(): void
    {
        User::query()->update(['status' => 'suspended']);
        $this->postJson('/auth/login', ['email' => self::ADMIN_EMAIL, 'password' => self::ADMIN_PASSWORD])
            ->assertStatus(403)->assertJsonPath('code', 'account_suspended');
    }

    public function test_refresh_rotates_and_reuse_revokes_every_session(): void
    {
        $first = $this->login();
        $second = $this->login();

        $rotated = $this->postJson('/auth/refresh', ['refresh_token' => $first['refresh_token']])->assertOk()->json();
        $this->assertNotSame($first['refresh_token'], $rotated['refresh_token']);

        // Reusing the revoked token is treated as theft: every session of the user is revoked and that sticks.
        $this->postJson('/auth/refresh', ['refresh_token' => $first['refresh_token']])->assertStatus(401)->assertJsonPath('code', 'invalid_token');
        $this->assertSame(0, UserSession::query()->whereNull('revoked_at')->count());
        $this->postJson('/auth/refresh', ['refresh_token' => $rotated['refresh_token']])->assertStatus(401);
        $this->postJson('/auth/refresh', ['refresh_token' => $second['refresh_token']])->assertStatus(401);
    }

    public function test_refresh_accepts_the_cookie_and_rejects_missing_tokens(): void
    {
        $login = $this->login();
        $this->postJson('/auth/refresh', [])->assertStatus(401)->assertJsonPath('detail', 'Refresh token missing.');
        $this->withCredentials()->withUnencryptedCookie('refresh_token', $login['refresh_token'])->postJson('/auth/refresh', [])->assertOk();
    }

    public function test_me_supports_etag_and_cookie_authentication(): void
    {
        $token = $this->login()['access_token'];
        $me = $this->getJson('/auth/me', $this->bearer($token))->assertOk()->assertHeader('ETag', '"1"');
        $me->assertJsonPath('active_tenant.slug', 'test-org')->assertJsonCount(1, 'accessible_tenants');
        $this->getJson('/auth/me', $this->bearer($token, ['If-None-Match' => '"1"']))->assertStatus(304);
        $this->withCredentials()->withUnencryptedCookie('access_token', $token)->getJson('/auth/me')->assertOk();
        $this->getJson('/auth/me', ['X-Tenant-ID' => 'nope'] + $this->bearer($token))->assertStatus(422)->assertJsonPath('detail.0.loc', ['header', 'x-tenant-id']);
    }

    public function test_invalid_tokens_are_rejected_with_invalid_token(): void
    {
        $this->getJson('/auth/me')->assertStatus(401)->assertJsonPath('code', 'invalid_token');
        $this->getJson('/auth/me', $this->bearer('garbage'))->assertStatus(401)->assertJsonPath('code', 'invalid_token');
        $reset = app(JwtService::class)->createResetToken(User::query()->firstOrFail()->id, 1);
        $this->getJson('/auth/me', $this->bearer($reset))->assertStatus(401)->assertJsonPath('detail', 'Invalid token type: expected access token.');
        $expired = app(JwtService::class)->createAccessToken(['sub' => User::query()->firstOrFail()->id, 'token_version' => 1], time() - 7200);
        $this->getJson('/auth/me', $this->bearer($expired))->assertStatus(401)->assertJsonPath('detail', 'Access token has expired.');
    }

    public function test_change_password_enforces_history_and_invalidates_tokens(): void
    {
        $token = $this->login()['access_token'];
        $this->postJson('/auth/change-password', ['current_password' => self::ADMIN_PASSWORD, 'new_password' => self::ADMIN_PASSWORD], $this->bearer($token))
            ->assertStatus(409)->assertJsonPath('code', 'password_recently_used');
        $this->postJson('/auth/change-password', ['current_password' => 'wrong-wrong', 'new_password' => 'Another-Passw0rd!'], $this->bearer($token))
            ->assertStatus(401)->assertJsonPath('detail', 'Current password is incorrect.');
        $this->postJson('/auth/change-password', ['current_password' => self::ADMIN_PASSWORD, 'new_password' => 'Another-Passw0rd!'], $this->bearer($token))->assertOk();
        $this->getJson('/auth/me', $this->bearer($token))->assertStatus(401);
        $this->assertSame(2, User::query()->firstOrFail()->token_version);
        $this->assertSame(1, AuditLog::query()->where('action', 'PASSWORD_RESET')->count());
    }

    public function test_reset_password_flow_is_single_use(): void
    {
        $user = User::query()->firstOrFail();
        $token = app(JwtService::class)->createResetToken($user->id, 1);

        $this->postJson('/auth/reset-password', ['token' => $token, 'new_password' => 'Brand-New-Passw0rd!'])->assertOk();
        $this->postJson('/auth/login', ['email' => self::ADMIN_EMAIL, 'password' => 'Brand-New-Passw0rd!'])->assertOk();
        $this->postJson('/auth/reset-password', ['token' => $token, 'new_password' => 'Yet-Another-Passw0rd!'])
            ->assertStatus(401)->assertJsonPath('detail', 'This password reset link has already been used.');
        $this->postJson('/auth/reset-password', ['token' => 'garbage', 'new_password' => 'Yet-Another-Passw0rd!'])->assertStatus(401)->assertJsonPath('code', 'invalid_token');
    }

    public function test_forgot_password_is_generic_and_issues_a_temporary_password(): void
    {
        $known = $this->postJson('/auth/forgot-password', ['email' => self::ADMIN_EMAIL])->assertOk()->json();
        $unknown = $this->postJson('/auth/forgot-password', ['email' => 'ghost@tests.example.com'])->assertOk()->json();
        $this->assertSame($known, $unknown);

        $user = User::query()->firstOrFail();
        $this->assertTrue($user->must_change_password);
        $this->assertNotNull($user->temp_password_expires_at);
        $this->assertSame(2, $user->token_version);
    }

    public function test_logout_revokes_sessions_and_clears_cookies(): void
    {
        $login = $this->login();
        $response = $this->postJson('/auth/logout', ['refresh_token' => $login['refresh_token']], $this->bearer($login['access_token']))->assertOk();
        $this->assertTrue(collect($response->headers->getCookies())->every(fn ($c) => $c->getExpiresTime() < time()));
        $this->postJson('/auth/refresh', ['refresh_token' => $login['refresh_token']])->assertStatus(401);

        $other = $this->login();
        $this->postJson('/auth/logout', ['logout_all' => true], $this->bearer($other['access_token']))->assertOk();
        $this->getJson('/auth/me', $this->bearer($other['access_token']))->assertStatus(401);
        $this->assertSame(2, AuditLog::query()->where('action', 'LOGOUT')->count());
    }

    public function test_api_keys_lifecycle(): void
    {
        $token = $this->login()['access_token'];
        $created = $this->postJson('/auth/api-keys', ['name' => 'ci', 'scopes' => ['*'], 'expires_in_days' => 30], $this->bearer($token))->assertCreated();
        $raw = $created->json('raw_key');
        $this->assertStringStartsWith('inno_live_', $raw);
        $this->assertSame(substr($raw, 0, 14).'...', $created->json('key_prefix'));
        $created->assertJsonMissingPath('key_hash');
        $this->assertSame(hash('sha256', $raw), DB::table('api_keys')->value('key_hash'));

        $this->getJson('/auth/api-keys', $this->bearer($token))->assertOk()->assertJsonCount(1, 'items')->assertJsonMissingPath('items.0.raw_key');
        $this->getJson('/auth/me', $this->bearer($raw))->assertOk()->assertJsonPath('email', self::ADMIN_EMAIL);
        $this->assertNotNull(DB::table('api_keys')->value('last_used_at'));

        $this->deleteJson('/auth/api-keys/'.$created->json('id'), [], $this->bearer($token))->assertOk()->assertJsonPath('is_revoked', true);
        $this->getJson('/auth/me', $this->bearer($raw))->assertStatus(401)->assertJsonPath('code', 'invalid_token');
        $this->deleteJson('/auth/api-keys/00000000-0000-4000-8000-000000000000', [], $this->bearer($token))->assertStatus(404);
        $this->deleteJson('/auth/api-keys/not-a-uuid', [], $this->bearer($token))->assertStatus(422)->assertJsonPath('detail.0.loc', ['path', 'key_id']);
        $this->assertSame(1, AuditLog::query()->where('entity_type', 'api_key')->where('action', 'CREATE')->count());
        $this->assertSame(1, AuditLog::query()->where('entity_type', 'api_key')->where('action', 'DELETE')->count());
    }

    public function test_expired_api_key_is_rejected(): void
    {
        $token = $this->login()['access_token'];
        $raw = $this->postJson('/auth/api-keys', ['name' => 'short'], $this->bearer($token))->json('raw_key');
        DB::table('api_keys')->update(['expires_at' => now()->subMinute()]);
        $this->getJson('/auth/me', $this->bearer($raw))->assertStatus(401);
    }
}
