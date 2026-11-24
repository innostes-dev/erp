<?php

namespace Tests\Feature;

use App\Kernel\Services\AuditService;
use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TenancyUsersTest extends TestCase
{
    use RefreshDatabase;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->install()->assertCreated();
        $this->token = $this->login()['access_token'];
    }

    /** @return array<string, string> */
    private function auth(): array
    {
        return $this->bearer($this->token);
    }

    public function test_tenant_routes_require_authentication(): void
    {
        foreach (['/tenants', '/tenants/current', '/tenants/current/modules', '/tenants/current/plugins'] as $path) {
            $this->getJson($path)->assertStatus(401)->assertJsonPath('code', 'invalid_token');
        }
    }

    public function test_tenant_crud_slug_uniqueness_and_soft_delete(): void
    {
        $created = $this->postJson('/tenants', ['name' => 'Second', 'slug' => 'second', 'country' => 'US'], $this->auth())->assertCreated();
        $id = $created->json('id');
        $created->assertJsonPath('deleted_at', null)->assertJsonPath('created_by', User::query()->value('id'));

        $this->postJson('/tenants', ['name' => 'Dup', 'slug' => 'second'], $this->auth())->assertStatus(409)->assertJsonPath('code', 'slug_taken');
        $this->patchJson("/tenants/{$id}", ['slug' => 'test-org'], $this->auth())->assertStatus(409)->assertJsonPath('code', 'slug_taken');
        $this->patchJson("/tenants/{$id}", ['name' => 'Renamed'], $this->auth())->assertOk()->assertJsonPath('name', 'Renamed')->assertJsonPath('slug', 'second');

        $this->deleteJson("/tenants/{$id}", [], $this->auth())->assertOk()->assertJsonPath('deleted_at', fn ($v) => $v !== null);
        $this->getJson("/tenants/{$id}", $this->auth())->assertStatus(404)->assertJsonPath('code', 'tenant_not_found');
        // A soft-deleted slug stays reserved so a restored tenant never clashes.
        $this->postJson('/tenants', ['name' => 'Again', 'slug' => 'second'], $this->auth())->assertStatus(409);
        $this->postJson("/tenants/{$id}/restore", [], $this->auth())->assertOk()->assertJsonPath('deleted_at', null);

        foreach (['CREATE', 'UPDATE', 'DELETE', 'RESTORE'] as $action) {
            $this->assertSame(1, AuditLog::query()->where('entity_type', 'tenant')->where('action', $action)->count(), $action);
        }
        $this->assertSame('Renamed', AuditLog::query()->where('action', 'UPDATE')->value('changes')['name']['new']);
    }

    public function test_tenant_list_pagination_and_validation(): void
    {
        Tenant::query()->create(['name' => 'B', 'slug' => 'b']);
        $page = $this->getJson('/tenants?limit=1&offset=0', $this->auth())->assertOk()->json();
        $this->assertSame(1, count($page['items']));
        $this->assertSame(2, $page['total']);
        $this->assertSame(['limit' => 1, 'offset' => 0], ['limit' => $page['limit'], 'offset' => $page['offset']]);

        $this->getJson('/tenants?limit=500', $this->auth())->assertStatus(422)->assertJsonPath('detail.0.loc', ['query', 'limit']);
        $this->getJson('/tenants?offset=-1', $this->auth())->assertStatus(422);
        $this->getJson('/tenants/not-a-uuid', $this->auth())->assertStatus(422)->assertJsonPath('detail.0.loc', ['path', 'tenant_id']);
    }

    public function test_validation_errors_use_the_fastapi_shape(): void
    {
        $response = $this->postJson('/tenants', ['name' => '', 'slug' => 'Bad Slug!', 'country' => 'USA'], $this->auth())->assertStatus(422);
        $detail = collect($response->json('detail'))->keyBy(fn ($e) => implode('.', $e['loc']));
        $this->assertSame('string_too_short', $detail['body.name']['type']);
        $this->assertSame('string_pattern_mismatch', $detail['body.slug']['type']);
        $this->assertSame('string_too_long', $detail['body.country']['type']);
        $this->assertSame(['loc', 'msg', 'type'], array_keys($detail['body.name']));

        $missing = $this->postJson('/tenants', [], $this->auth())->assertStatus(422)->json('detail');
        $this->assertSame('missing', $missing[0]['type']);
        $this->assertSame(['body', 'name'], $missing[0]['loc']);
    }

    public function test_current_tenant_follows_header_and_modules_need_super_admin(): void
    {
        $second = $this->postJson('/tenants', ['name' => 'Second', 'slug' => 'second'], $this->auth())->json('id');
        $this->getJson('/tenants/current', $this->auth())->assertOk()->assertJsonPath('slug', 'test-org');
        $this->getJson('/tenants/current', $this->auth() + ['X-Tenant-ID' => $second])->assertOk()->assertJsonPath('slug', 'second');

        $this->postJson('/tenants/current/modules/peopleops/activate', [], $this->auth())->assertOk()->assertJsonPath('is_active', true);
        $list = $this->getJson('/tenants/current/modules', $this->auth())->assertOk();
        $this->assertSame(['peopleops'], $list->json('active_ids'));
        $this->postJson('/tenants/current/plugins/tracura/activate', [], $this->auth())->assertOk();
        $this->postJson('/tenants/current/modules/peopleops/deactivate', [], $this->auth())->assertOk()->assertJsonPath('is_active', false);
        $this->assertSame(3, AuditLog::query()->where('action', 'RBAC_CHANGE')->count());

        $this->postJson('/users', ['first_name' => 'Plain', 'email' => 'plain@tests.example.com', 'password' => 'Plain-Passw0rd!'], $this->auth())->assertCreated();
        $plain = $this->login('plain@tests.example.com', 'Plain-Passw0rd!')['access_token'];
        $this->postJson('/tenants/current/modules/peopleops/activate', [], $this->bearer($plain, ['X-Tenant-ID' => Tenant::query()->value('id')]))
            ->assertStatus(403);
    }

    public function test_user_creation_encryption_and_uniqueness(): void
    {
        $created = $this->postJson('/users', [
            'first_name' => 'Grace', 'last_name' => 'Hopper', 'email' => 'Grace@Tests.example.com', 'password' => 'Grace-Passw0rd!',
            'mobile' => '+919876543210', 'is_super_admin' => true,
        ], $this->auth())->assertCreated();
        $created->assertJsonPath('is_super_admin', false)->assertJsonPath('status', 'active')->assertJsonPath('mobile', '+919876543210');

        $row = DB::table('users')->where('id', $created->json('id'))->first();
        $this->assertStringStartsWith('v1:', $row->email_encrypted);
        $this->assertStringStartsWith('v1:', $row->mobile_encrypted);
        $this->assertSame(1, DB::table('password_histories')->where('user_id', $row->id)->count());
        $this->assertSame(1, DB::table('user_profiles')->where('user_id', $row->id)->count());
        $this->assertSame(1, DB::table('user_security')->where('user_id', $row->id)->count());

        $this->postJson('/users', ['first_name' => 'Dup', 'email' => 'GRACE@tests.example.com', 'password' => 'Dup-Passw0rd!!'], $this->auth())
            ->assertStatus(409)->assertJsonPath('code', 'email_already_exists');
        $this->postJson('/users', ['first_name' => 'Dup', 'email' => 'other@tests.example.com', 'password' => 'Dup-Passw0rd!!', 'mobile' => '+919876543210'], $this->auth())
            ->assertStatus(409);

        $this->getJson('/users/'.$created->json('id'), $this->auth())->assertOk()->assertJsonPath('email', 'Grace@tests.example.com');
        $this->getJson('/users/00000000-0000-4000-8000-000000000000', $this->auth())->assertStatus(404)->assertJsonPath('code', 'user_not_found');
        $this->getJson('/users/'.$created->json('id'))->assertStatus(401);
        $this->postJson('/users', [], [])->assertStatus(401);
        $this->postJson('/users', ['first_name' => '', 'email' => 'x', 'password' => 'short'], $this->auth())->assertStatus(422);
        $this->assertSame(1, AuditLog::query()->where('entity_type', 'user')->where('action', 'CREATE')->count());
    }

    public function test_audit_failures_never_fail_the_request(): void
    {
        // An audit row referencing a non-existent tenant violates the FK; the request still succeeds.
        $service = app(AuditService::class);
        $service->record('CREATE', 'tenant', 'x', ['tenant_id' => '00000000-0000-4000-8000-000000000000']);
        $this->assertSame(0, AuditLog::query()->where('entity_id', 'x')->count());

        $this->app->bind(AuditService::class, fn () => new class extends AuditService
        {
            public function record(string $action, string $entityType, string $entityId, array $context = []): void
            {
                parent::record($action, $entityType, $entityId, ['tenant_id' => '00000000-0000-4000-8000-000000000000']);
            }
        });
        $this->postJson('/tenants', ['name' => 'Still Works', 'slug' => 'still-works'], $this->auth())->assertCreated();
    }
}
