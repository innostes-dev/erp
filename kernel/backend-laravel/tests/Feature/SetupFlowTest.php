<?php

namespace Tests\Feature;

use App\Models\Installation;
use App\Models\Permission;
use App\Models\Role;
use App\Models\TenantSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetupFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_everything_but_setup_and_health_is_503_before_install(): void
    {
        $this->getJson('/tenants')->assertStatus(503)->assertExactJson(['detail' => 'Setup has not been completed', 'code' => 'setup_required']);
        $this->getJson('/config')->assertStatus(503)->assertJsonPath('code', 'setup_required');
        $this->getJson('/')->assertOk()->assertJsonPath('status', 'online');
        $this->getJson('/health')->assertOk()->assertJsonPath('status', 'pass')->assertJsonPath('database.status', 'HEALTHY');
        $this->getJson('/setup/status')->assertOk()->assertExactJson(['installed' => false]);
        $this->getJson('/openapi.json')->assertOk()->assertJsonStructure(['paths']);
    }

    public function test_setup_token_is_required_and_throttled(): void
    {
        $this->getJson('/setup/checks')->assertStatus(401)
            ->assertJsonPath('code', 'invalid_setup_token')
            ->assertHeader('WWW-Authenticate', 'SetupToken header="X-Setup-Token"');

        config(['kernel.setup.max_attempts' => 4]); // the token-less request above already counted as one failure
        for ($i = 0; $i < 3; $i++) {
            $this->getJson('/setup/checks', ['X-Setup-Token' => 'wrong'])->assertStatus(401);
        }
        $this->getJson('/setup/checks', ['X-Setup-Token' => 'test-setup-token'])->assertStatus(429)->assertHeader('Retry-After');
    }

    public function test_checks_report_database_and_migrations(): void
    {
        $this->getJson('/setup/checks', ['X-Setup-Token' => 'test-setup-token'])
            ->assertOk()->assertJson(['database_connected' => true, 'migrations_pending' => 0]);
    }

    public function test_install_seeds_rbac_tenant_settings_and_locks_setup(): void
    {
        $response = $this->install();
        $response->assertCreated()
            ->assertJsonPath('tenant.slug', 'test-org')
            ->assertJsonPath('admin.email', self::ADMIN_EMAIL)
            ->assertJsonPath('admin.is_super_admin', true)
            ->assertJsonMissingPath('admin.password_hash');

        $this->assertSame(30, Permission::query()->count());
        $this->assertSame(9, Role::query()->count());
        $this->assertSame(['auth', 'branding', 'localization'], TenantSetting::query()->orderBy('namespace')->pluck('namespace')->all());
        $this->assertSame(1, Installation::query()->count());

        $this->getJson('/setup/status')->assertExactJson(['installed' => true]);
        $this->install()->assertStatus(404)->assertJsonPath('code', 'setup_not_available');
    }

    public function test_install_validates_payload_and_requires_admin_block(): void
    {
        $this->postJson('/setup', ['organization' => ['name' => '', 'slug' => 'Bad Slug'], 'admin' => ['first_name' => 'a', 'email' => 'nope', 'password' => 'x']], ['X-Setup-Token' => 'test-setup-token'])
            ->assertStatus(422)
            ->assertJsonPath('detail.0.loc', ['body', 'organization', 'name']);

        // The reference silently creates a default admin with a published password; we refuse instead.
        $this->postJson('/setup', ['organization' => ['name' => 'X', 'slug' => 'x']], ['X-Setup-Token' => 'test-setup-token'])
            ->assertStatus(422)
            ->assertJsonPath('detail.0.type', 'missing');
        $this->assertSame(0, Installation::query()->count());
    }

    public function test_setup_disabled_returns_404(): void
    {
        config(['kernel.setup.enabled' => false]);
        $this->getJson('/setup/checks', ['X-Setup-Token' => 'test-setup-token'])->assertStatus(404)->assertJsonPath('code', 'setup_not_available');
    }
}
