<?php

namespace Tests\Feature;

use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use RuntimeException;
use Tests\TestCase;

class HardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_security_headers_and_correlation_id(): void
    {
        $response = $this->getJson('/health', ['X-Correlation-ID' => 'abc-123']);
        $response->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('X-Correlation-ID', 'abc-123');
        $this->assertStringContainsString("default-src 'none'", (string) $response->headers->get('Content-Security-Policy'));
        $this->assertNotSame('abc-123', $this->getJson('/health', ['X-Correlation-ID' => "bad id\n"])->headers->get('X-Correlation-ID'));
    }

    public function test_login_is_rate_limited_per_account_with_retry_after(): void
    {
        $this->install()->assertCreated();
        RateLimiter::clear('x');
        $this->app->make(AppServiceProvider::class, ['app' => $this->app]);
        config(['kernel.rate_limit.login_per_account_per_minute' => 3]);
        (new AppServiceProvider($this->app))->boot();

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/auth/login', ['email' => 'victim@tests.example.com', 'password' => 'wrong-wrong'])->assertStatus(401);
        }
        $blocked = $this->postJson('/auth/login', ['email' => 'victim@tests.example.com', 'password' => 'wrong-wrong']);
        $blocked->assertStatus(429)->assertJsonPath('detail', 'Too many requests');
        $this->assertGreaterThan(0, (int) $blocked->headers->get('Retry-After'));
        // A different account from the same IP is not affected.
        $this->postJson('/auth/login', ['email' => 'other@tests.example.com', 'password' => 'wrong-wrong'])->assertStatus(401);
    }

    public function test_unknown_routes_and_methods_render_json_errors(): void
    {
        $this->getJson('/nope')->assertStatus(404)->assertExactJson(['detail' => 'Not Found']);
        $this->putJson('/health')->assertStatus(405)->assertJsonStructure(['detail']);
    }

    public function test_production_refuses_to_boot_with_insecure_defaults(): void
    {
        config([
            'kernel.environment' => 'production',
            'kernel.jwt.secret' => config('kernel.insecure_defaults.jwt_secret'),
        ]);
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('JWT_SECRET_KEY');
        (new AppServiceProvider($this->app))->boot();
    }

    public function test_production_boots_with_strong_secrets(): void
    {
        config([
            'kernel.environment' => 'production',
            'app.debug' => false,
            'kernel.jwt.secret' => str_repeat('j', 40),
            'kernel.crypto.keys' => [1 => str_repeat('a', 64)],
            'kernel.crypto.blind_index_pepper' => str_repeat('p', 40),
        ]);
        (new AppServiceProvider($this->app))->boot();
        $this->addToAssertionCount(1);
    }

    public function test_openapi_document_lists_the_31_kernel_operations(): void
    {
        $spec = $this->getJson('/openapi.json')->assertOk()->json();
        $ops = collect($spec['paths'])->flatMap(fn ($methods, $path) => collect($methods)->map(fn ($op, $m) => strtoupper($m).' '.$path)->values())->values();
        $this->assertCount(31, $ops);
        $this->assertContains('POST /auth/login', $ops->all());
        $this->assertSame(['Authentication'], $spec['paths']['/auth/login']['post']['tags']);
        $this->assertSame([['BearerAuth' => []]], $spec['paths']['/auth/me']['get']['security']);
    }
}
