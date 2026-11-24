<?php

namespace Tests\Feature;

use App\Kernel\Security\JwtService;
use App\Kernel\Services\RbacService;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

/** Regression tests for the findings of the 3.5 security review (docs/backend-parity/security/laravel.md). */
class SecurityReviewTest extends TestCase
{
    use RefreshDatabase;

    private const USER_PASSWORD = 'Eve-Passw0rd!!';

    private string $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->install()->assertCreated();
        $this->admin = $this->login()['access_token'];
    }

    /** @return array{0: string, 1: string} access token and user id of a fresh, tenant-less normal user */
    private function normalUser(string $email = 'eve@tests.example.com'): array
    {
        $created = $this->postJson('/users', ['first_name' => 'Eve', 'email' => $email, 'password' => self::USER_PASSWORD], $this->bearer($this->admin))->assertCreated();

        return [$this->login($email, self::USER_PASSWORD)['access_token'], $created->json('id')];
    }

    private function member(string $userId, string $tenantId): void
    {
        TenantMember::query()->create(['tenant_id' => $tenantId, 'user_id' => $userId, 'status' => 'active']);
    }

    private function role(string $userId, string $code, ?string $tenantId): void
    {
        app(RbacService::class)->assignRoleToUser($userId, Role::query()->where('code', $code)->firstOrFail()->id, $tenantId, null);
    }

    /** @return array{0: string, 1: string} token and id of a user who is an active member of $tenant with the given role (or none) */
    private function memberWithRole(string $email, Tenant $tenant, ?string $role): array
    {
        [$token, $id] = $this->normalUser($email);
        $this->member($id, $tenant->id);
        if ($role !== null) {
            $this->role($id, $role, $tenant->id);
        }

        return [$token, $id];
    }

    public function test_outsider_without_membership_or_roles_is_denied_everywhere(): void
    {
        [$eve] = $this->normalUser();
        $h = $this->bearer($eve);
        $victim = Tenant::query()->create(['name' => 'Victim', 'slug' => 'victim']);

        $this->postJson('/users', ['first_name' => 'M', 'email' => 'm@tests.example.com', 'password' => 'Mallory-Pass1!!'], $h)->assertStatus(403)->assertJsonPath('code', 'permission_denied');
        $this->postJson('/tenants', ['name' => 'Evil', 'slug' => 'evil'], $h)->assertStatus(403)->assertJsonPath('code', 'permission_denied');
        // Never 403 for a tenant the caller is not a member of: existence is hidden.
        foreach ([['patch', ['name' => 'pwned']], ['delete', []], ['getJson', []]] as [$verb, $body]) {
            $r = $verb === 'getJson' ? $this->getJson("/tenants/{$victim->id}", $h) : $this->{$verb.'Json'}("/tenants/{$victim->id}", $body, $h);
            $r->assertStatus(404)->assertJsonPath('code', 'tenant_not_found');
        }
        $this->postJson("/tenants/{$victim->id}/restore", [], $h)->assertStatus(404)->assertJsonPath('code', 'tenant_not_found');
        $this->assertSame('Victim', $victim->refresh()->name);
        $this->assertNull($victim->deleted_at);
        $this->getJson('/tenants?include_deleted=true', $h)->assertOk()->assertJsonPath('total', 0);
    }

    public function test_tenant_context_routes_without_membership_are_404_and_foreign_header_is_403(): void
    {
        [$eve, $eveId] = $this->normalUser();
        $mine = Tenant::query()->create(['name' => 'Mine', 'slug' => 'mine']);
        $other = Tenant::query()->create(['name' => 'Other', 'slug' => 'other']);

        foreach (['/tenants/current', '/tenants/current/modules', '/tenants/current/plugins', '/auth/api-keys'] as $path) {
            $this->getJson($path, $this->bearer($eve))->assertStatus(404)->assertJsonPath('code', 'tenant_not_found');
        }
        $this->postJson('/auth/api-keys', ['name' => 'k'], $this->bearer($eve))->assertStatus(404)->assertJsonPath('code', 'tenant_not_found');

        $this->member($eveId, $mine->id);
        $this->getJson('/tenants/current', $this->bearer($eve, ['X-Tenant-ID' => $other->id]))->assertStatus(403)->assertJsonPath('code', 'permission_denied');
        $this->getJson('/tenants/current/modules', $this->bearer($eve, ['X-Tenant-ID' => $other->id]))->assertStatus(403);
        $this->getJson('/auth/api-keys', $this->bearer($eve, ['X-Tenant-ID' => $other->id]))->assertStatus(403);
        $this->getJson('/tenants/current', $this->bearer($eve))->assertOk()->assertJsonPath('slug', 'mine');
        // Super admin keeps the oldest-tenant fallback.
        $this->getJson('/tenants/current', $this->bearer($this->admin))->assertOk()->assertJsonPath('slug', 'test-org');
    }

    public function test_tenant_list_is_limited_to_memberships_and_hides_deleted(): void
    {
        [$eve] = $this->memberWithRole('eve@tests.example.com', $mine = Tenant::query()->create(['name' => 'Mine', 'slug' => 'mine']), null);
        Tenant::query()->create(['name' => 'Other', 'slug' => 'other']);

        $r = $this->getJson('/tenants?include_deleted=true', $this->bearer($eve))->assertOk();
        $this->assertSame(1, $r->json('total'));
        $this->assertSame('mine', $r->json('items.0.slug'));
        $this->getJson("/tenants/{$mine->id}", $this->bearer($eve))->assertOk();
        $this->getJson('/tenants', $this->bearer($this->admin))->assertOk()->assertJsonPath('total', 3);
    }

    public function test_tenant_update_and_delete_follow_rbac_permissions(): void
    {
        $t = Tenant::query()->create(['name' => 'Acme', 'slug' => 'acme']);
        [$plain] = $this->memberWithRole('plain@tests.example.com', $t, null);
        [$member] = $this->memberWithRole('member@tests.example.com', $t, 'member');
        [$adminRole] = $this->memberWithRole('adm@tests.example.com', $t, 'admin');
        [$owner] = $this->memberWithRole('owner@tests.example.com', $t, 'owner');

        // Member without roles / with the read-only member role: 403 permission_denied (they can see the tenant).
        foreach ([$plain, $member] as $token) {
            $this->patchJson("/tenants/{$t->id}", ['name' => 'x'], $this->bearer($token))->assertStatus(403)->assertJsonPath('code', 'permission_denied');
            $this->deleteJson("/tenants/{$t->id}", [], $this->bearer($token))->assertStatus(403)->assertJsonPath('code', 'permission_denied');
        }
        // admin: tenancy.tenant.update but not tenancy.tenant.delete.
        $this->patchJson("/tenants/{$t->id}", ['name' => 'Acme 2'], $this->bearer($adminRole))->assertOk()->assertJsonPath('name', 'Acme 2');
        $this->deleteJson("/tenants/{$t->id}", [], $this->bearer($adminRole))->assertStatus(403);
        // owner: ALL permissions, including delete and restore.
        $this->deleteJson("/tenants/{$t->id}", [], $this->bearer($owner))->assertOk();
        $this->postJson("/tenants/{$t->id}/restore", [], $this->bearer($adminRole))->assertStatus(403);
        $this->postJson("/tenants/{$t->id}/restore", [], $this->bearer($owner))->assertOk()->assertJsonPath('deleted_at', null);
        // POST /tenants stays super-admin only, even for an owner.
        $this->postJson('/tenants', ['name' => 'New', 'slug' => 'new'], $this->bearer($owner))->assertStatus(403)->assertJsonPath('code', 'permission_denied');
    }

    public function test_user_creation_needs_user_users_create(): void
    {
        $t = Tenant::query()->create(['name' => 'Acme', 'slug' => 'acme']);
        [$member] = $this->memberWithRole('member@tests.example.com', $t, 'member');
        [$adminRole] = $this->memberWithRole('adm@tests.example.com', $t, 'admin');
        $body = fn (string $e) => ['first_name' => 'N', 'email' => $e, 'password' => 'New-Passw0rd!!', 'is_super_admin' => true];

        $this->postJson('/users', $body('n1@tests.example.com'), $this->bearer($member))->assertStatus(403)->assertJsonPath('code', 'permission_denied');
        $this->postJson('/users', $body('n2@tests.example.com'), $this->bearer($adminRole))->assertCreated()->assertJsonPath('is_super_admin', false);
        // The permission is evaluated in the selected tenant, which must be a membership.
        $this->postJson('/users', $body('n3@tests.example.com'), $this->bearer($adminRole, ['X-Tenant-ID' => Tenant::query()->where('slug', 'test-org')->value('id')]))->assertStatus(403);
    }

    public function test_user_profiles_need_self_super_admin_or_user_users_read_in_a_shared_tenant(): void
    {
        $t = Tenant::query()->create(['name' => 'Acme', 'slug' => 'acme']);
        [$eve, $eveId] = $this->normalUser();
        [$reader, $readerId] = $this->memberWithRole('reader@tests.example.com', $t, 'member');
        [, $peerId] = $this->memberWithRole('peer@tests.example.com', $t, null);
        [$plain] = $this->memberWithRole('plain@tests.example.com', $t, null);
        $adminId = $this->getJson('/auth/me', $this->bearer($this->admin))->json('id');

        $this->getJson("/users/{$eveId}", $this->bearer($eve))->assertOk();
        $this->getJson("/users/{$adminId}", $this->bearer($eve))->assertStatus(404)->assertJsonPath('code', 'user_not_found');
        $this->getJson("/users/{$peerId}", $this->bearer($eve))->assertStatus(404);
        $this->getJson("/users/{$peerId}", $this->bearer($plain))->assertStatus(404); // shares the tenant but lacks user.users.read
        $this->getJson("/users/{$peerId}", $this->bearer($reader))->assertOk()->assertJsonPath('email', 'peer@tests.example.com');
        $this->getJson("/users/{$adminId}", $this->bearer($reader))->assertStatus(404); // admin is not a member of that tenant
        $this->getJson("/users/{$readerId}", $this->bearer($this->admin))->assertOk();
    }

    public function test_api_keys_cannot_manage_api_keys(): void
    {
        $created = $this->postJson('/auth/api-keys', ['name' => 'ci', 'scopes' => ['read']], $this->bearer($this->admin))->assertCreated();
        $raw = $created->json('raw_key');

        $this->postJson('/auth/api-keys', ['name' => 'persist', 'scopes' => ['*']], $this->bearer($raw))->assertStatus(403)->assertJsonPath('code', 'permission_denied');
        $this->deleteJson('/auth/api-keys/'.$created->json('id'), [], $this->bearer($raw))->assertStatus(403);
        $this->getJson('/auth/api-keys', $this->bearer($raw))->assertStatus(403);
        $this->getJson('/auth/me', $this->bearer($raw))->assertOk();
    }

    public function test_api_keys_are_private_unless_members_manage_or_super_admin(): void
    {
        $t = Tenant::query()->create(['name' => 'Acme', 'slug' => 'acme']);
        [$m1] = $this->memberWithRole('m1@tests.example.com', $t, 'member');
        [$m2] = $this->memberWithRole('m2@tests.example.com', $t, 'member');
        [$mgr] = $this->memberWithRole('mgr@tests.example.com', $t, 'admin'); // has tenancy.members.manage

        $key1 = $this->postJson('/auth/api-keys', ['name' => 'k1'], $this->bearer($m1))->assertCreated()->json('id');
        $this->postJson('/auth/api-keys', ['name' => 'k2'], $this->bearer($m2))->assertCreated();

        $this->getJson('/auth/api-keys', $this->bearer($m1))->assertOk()->assertJsonCount(1, 'items');
        $this->deleteJson("/auth/api-keys/{$key1}", [], $this->bearer($m2))->assertStatus(404);
        $this->getJson('/auth/api-keys', $this->bearer($mgr))->assertOk()->assertJsonCount(2, 'items');
        $this->getJson('/auth/api-keys', $this->bearer($this->admin, ['X-Tenant-ID' => $t->id]))->assertOk()->assertJsonCount(2, 'items');
        $this->deleteJson("/auth/api-keys/{$key1}", [], $this->bearer($mgr))->assertOk()->assertJsonPath('is_revoked', true);
        // Foreign tenant header: 403.
        $this->getJson('/auth/api-keys', $this->bearer($m1, ['X-Tenant-ID' => Tenant::query()->where('slug', 'test-org')->value('id')]))->assertStatus(403);
    }

    public function test_api_key_stops_working_for_a_tenant_its_owner_left(): void
    {
        [$eve, $eveId] = $this->normalUser();
        $t = Tenant::query()->create(['name' => 'Mine', 'slug' => 'mine']);
        $this->member($eveId, $t->id);
        $raw = $this->postJson('/auth/api-keys', ['name' => 'k'], $this->bearer($eve, ['X-Tenant-ID' => $t->id]))->assertCreated()->json('raw_key');
        $this->getJson('/tenants/current', $this->bearer($raw))->assertOk();

        TenantMember::query()->where('user_id', $eveId)->delete();
        $this->getJson('/tenants/current', $this->bearer($raw))->assertStatus(403);
    }

    public function test_new_passwords_are_limited_to_72_bytes_but_login_still_accepts_128(): void
    {
        $ok = str_repeat('a', 72);
        $long = str_repeat('a', 73);
        $multi = str_repeat('é', 37); // 74 bytes, 37 characters
        $h = $this->bearer($this->admin);

        foreach ([$long, $multi] as $bad) {
            $r = $this->postJson('/users', ['first_name' => 'L', 'email' => 'l@tests.example.com', 'password' => $bad], $h)->assertStatus(422);
            $this->assertSame('string_too_long', $r->json('detail.0.type'));
            $this->assertSame(['body', 'password'], $r->json('detail.0.loc'));
            $this->postJson('/auth/change-password', ['current_password' => self::ADMIN_PASSWORD, 'new_password' => $bad], $h)->assertStatus(422);
            $this->postJson('/auth/reset-password', ['token' => 'x', 'new_password' => $bad])->assertStatus(422);
        }
        $this->postJson('/users', ['first_name' => 'L', 'email' => 'l@tests.example.com', 'password' => $ok], $h)->assertCreated();
        // login still validates up to 128 characters (bcrypt ignores the tail, which is why new passwords are capped).
        $this->assertNotSame(422, $this->postJson('/auth/login', ['email' => 'l@tests.example.com', 'password' => str_repeat('a', 128)])->status());
        $this->postJson('/auth/login', ['email' => 'l@tests.example.com', 'password' => str_repeat('a', 129)])->assertStatus(422);
        $this->postJson('/auth/login', ['email' => 'l@tests.example.com', 'password' => $ok])->assertOk();
    }

    public function test_spoofed_forwarded_for_is_not_recorded_without_trusted_proxy(): void
    {
        $this->postJson('/auth/login', ['email' => self::ADMIN_EMAIL, 'password' => self::ADMIN_PASSWORD], ['X-Forwarded-For' => '6.6.6.6'])->assertOk();
        $this->assertSame(0, AuditLog::query()->where('ip_address', '6.6.6.6')->count());
    }

    public function test_access_token_without_token_version_claim_is_rejected(): void
    {
        $me = $this->getJson('/auth/me', $this->bearer($this->admin))->json();
        $jwt = app(JwtService::class);
        $forged = $jwt->createAccessToken(['sub' => $me['id'], 'email' => $me['email'], 'is_super_admin' => true]);
        $this->getJson('/auth/me', $this->bearer($forged))->assertStatus(401)->assertJsonPath('code', 'invalid_token');
        $stale = $jwt->createAccessToken(['sub' => $me['id'], 'email' => $me['email'], 'token_version' => 999, 'is_super_admin' => true]);
        $this->getJson('/auth/me', $this->bearer($stale))->assertStatus(401);
    }

    public function test_forgot_password_is_limited_per_target_account(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/auth/forgot-password', ['email' => self::ADMIN_EMAIL])->assertOk();
        }
        $this->postJson('/auth/forgot-password', ['email' => self::ADMIN_EMAIL])->assertStatus(429);
        $this->postJson('/auth/forgot-password', ['email' => 'someone-else@tests.example.com'])->assertOk();
    }

    public function test_cookie_authenticated_writes_from_foreign_origins_are_rejected(): void
    {
        $cookie = ['access_token' => $this->admin];
        $this->withCredentials()->withUnencryptedCookies($cookie)->postJson('/auth/api-keys', ['name' => 'csrf'], ['Origin' => 'https://evil.example'])->assertStatus(403);
        $this->withCredentials()->withUnencryptedCookies($cookie)->postJson('/auth/api-keys', ['name' => 'ok'], ['Origin' => 'http://localhost:4200'])->assertCreated();
        // Bearer-authenticated calls are not ambient credentials, so Origin is irrelevant.
        $this->postJson('/auth/api-keys', ['name' => 'api'], $this->bearer($this->admin, ['Origin' => 'https://evil.example']))->assertCreated();
    }

    public function test_oversized_inputs_are_rejected(): void
    {
        $this->postJson('/auth/login', ['email' => str_repeat('a', 300).'@x.com', 'password' => 'x'])->assertStatus(422);
        $this->postJson('/auth/reset-password', ['token' => str_repeat('a', 5000), 'new_password' => 'Valid-Passw0rd!'])->assertStatus(422);
        $this->postJson('/auth/api-keys', ['name' => 'k', 'scopes' => array_fill(0, 60, 's')], $this->bearer($this->admin))->assertStatus(422);
    }

    public function test_production_rejects_wildcard_cors_and_short_setup_tokens(): void
    {
        $strong = [
            'kernel.environment' => 'production',
            'app.debug' => false,
            'kernel.jwt.secret' => str_repeat('j', 40),
            'kernel.crypto.keys' => [1 => str_repeat('a', 64)],
            'kernel.crypto.blind_index_pepper' => str_repeat('p', 40),
        ];
        config($strong + ['kernel.cors_origins' => ['*']]);
        try {
            (new AppServiceProvider($this->app))->boot();
            $this->fail('wildcard CORS must be refused in production');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('CORS_ORIGINS', $e->getMessage());
        }

        config($strong + ['kernel.cors_origins' => ['https://app.example.com'], 'kernel.setup.enabled' => true, 'kernel.setup.token' => 'short']);
        try {
            (new AppServiceProvider($this->app))->boot();
            $this->fail('short SETUP_TOKEN must be refused in production');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('SETUP_TOKEN', $e->getMessage());
        }
    }
}
