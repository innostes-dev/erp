<?php

namespace Tests;

use App\Kernel\Services\SetupState;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Testing\TestResponse;

abstract class TestCase extends BaseTestCase
{
    public const ADMIN_EMAIL = 'admin@tests.example.com';

    public const ADMIN_PASSWORD = 'Str0ng-Passw0rd!';

    /** The kernel schema defines PostgreSQL enum types; migrate:fresh must drop them too. */
    protected bool $dropTypes = true;

    protected function setUp(): void
    {
        parent::setUp();
        SetupState::reset();
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function install(array $overrides = []): TestResponse
    {
        $body = array_replace_recursive([
            'organization' => ['name' => 'Test Org', 'slug' => 'test-org', 'country' => 'IN', 'timezone' => 'Asia/Kolkata'],
            'admin' => ['first_name' => 'Ada', 'last_name' => 'Lovelace', 'email' => self::ADMIN_EMAIL, 'password' => self::ADMIN_PASSWORD, 'mobile' => '+911234567890'],
        ], $overrides);

        return $this->postJson('/setup', $body, ['X-Setup-Token' => 'test-setup-token']);
    }

    /** @return array{access_token: string, refresh_token: string, user: array<string, mixed>} */
    protected function login(string $email = self::ADMIN_EMAIL, string $password = self::ADMIN_PASSWORD): array
    {
        $response = $this->postJson('/auth/login', ['email' => $email, 'password' => $password]);
        $response->assertOk();

        return $response->json();
    }

    /**
     * @param  array<string, string>  $headers
     * @return array<string, string>
     */
    protected function bearer(string $token, array $headers = []): array
    {
        return ['Authorization' => 'Bearer '.$token] + $headers;
    }
}
