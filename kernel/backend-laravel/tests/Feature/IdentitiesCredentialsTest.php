<?php

namespace Tests\Feature;

use App\Kernel\Services\CredentialService;
use App\Kernel\Services\UserService;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Identities + credentials (migration 000003, shared SQL 0010): dual writes, lookup order, legacy fallback and
 * the "never resurrect" rule, on a real PostgreSQL database. Mostly negative / breaking scenarios.
 */
class IdentitiesCredentialsTest extends TestCase
{
    use RefreshDatabase;

    private CredentialService $credentials;

    protected function setUp(): void
    {
        parent::setUp();
        $this->install()->assertCreated();
        $this->credentials = app(CredentialService::class);
    }

    private function admin(): User
    {
        return User::query()->firstOrFail();
    }

    /** @return array{0: User, 1: string, 2: string} [user, email, password] */
    private function makeUser(?string $mobile = null): array
    {
        $email = 'u'.Str::random(8).'@tests.example.com';
        $password = 'U-Passw0rd!'.Str::random(6);
        $user = DB::transaction(fn () => app(UserService::class)->create(
            ['first_name' => 'U', 'email' => $email, 'password' => $password, 'mobile' => $mobile]
        ));

        return [$user, $email, $password];
    }

    private function loginStatus(string $email, string $password): int
    {
        return $this->postJson('/auth/login', ['email' => $email, 'password' => $password])->status();
    }

    // ------------------------------------------------------------------ writes

    public function test_setup_admin_has_primary_email_and_phone_identities_and_one_password(): void
    {
        $admin = $this->admin();
        $rows = DB::table('identities')->where('user_id', $admin->id)->orderBy('type')->get();
        $this->assertSame(['email', 'phone'], $rows->pluck('type')->all());
        $this->assertTrue($rows->every(fn ($r) => (bool) $r->is_primary));
        $this->assertSame($admin->email_hash, $rows->firstWhere('type', 'email')->value_hash);
        $this->assertSame($admin->mobile_hash, $rows->firstWhere('type', 'phone')->value_hash);
        $this->assertStringNotContainsString('admin', (string) $rows->firstWhere('type', 'email')->value_encrypted);

        $pw = DB::table('credentials')->where('user_id', $admin->id)->where('type', 'password')->get();
        $this->assertCount(1, $pw);
        $this->assertSame($admin->password_hash, $pw[0]->secret_hash);
    }

    public function test_user_without_mobile_gets_no_phone_identity(): void
    {
        [$user] = $this->makeUser();
        $this->assertSame(['email'], DB::table('identities')->where('user_id', $user->id)->pluck('type')->all());
    }

    public function test_duplicate_email_in_other_case_is_rejected_without_orphan_rows(): void
    {
        $token = $this->login()['access_token'];
        $before = [DB::table('users')->count(), DB::table('identities')->count(), DB::table('credentials')->count()];
        $this->postJson('/users', ['first_name' => 'D', 'email' => strtoupper(self::ADMIN_EMAIL), 'password' => 'Dup-Passw0rd!1'], $this->bearer($token))
            ->assertStatus(409);
        $this->assertSame($before, [DB::table('users')->count(), DB::table('identities')->count(), DB::table('credentials')->count()]);
    }

    public function test_duplicate_mobile_is_rejected_without_orphan_rows(): void
    {
        $token = $this->login()['access_token'];
        $before = [DB::table('users')->count(), DB::table('identities')->count(), DB::table('credentials')->count()];
        $this->postJson('/users', ['first_name' => 'D', 'email' => 'dupm@tests.example.com', 'password' => 'Dup-Passw0rd!1', 'mobile' => '+911234567890'], $this->bearer($token))
            ->assertStatus(409)->assertJsonPath('code', 'mobile_already_exists');
        $this->assertSame($before, [DB::table('users')->count(), DB::table('identities')->count(), DB::table('credentials')->count()]);
    }

    public function test_change_password_updates_the_single_credential_and_the_legacy_column(): void
    {
        $token = $this->login()['access_token'];
        $this->postJson('/auth/change-password', ['current_password' => self::ADMIN_PASSWORD, 'new_password' => 'Changed-Passw0rd!2'], $this->bearer($token))->assertOk();
        $admin = $this->admin()->refresh();
        $pw = DB::table('credentials')->where('user_id', $admin->id)->where('type', 'password')->whereNull('deleted_at')->get();
        $this->assertCount(1, $pw);
        $this->assertSame($admin->password_hash, $pw[0]->secret_hash);
        $this->assertSame(401, $this->loginStatus(self::ADMIN_EMAIL, self::ADMIN_PASSWORD));
        $this->assertSame(200, $this->loginStatus(self::ADMIN_EMAIL, 'Changed-Passw0rd!2'));
    }

    public function test_forgot_password_moves_the_temp_password_into_the_credential(): void
    {
        $before = DB::table('credentials')->where('user_id', $this->admin()->id)->value('secret_hash');
        $this->postJson('/auth/forgot-password', ['email' => self::ADMIN_EMAIL])->assertOk();
        $admin = $this->admin()->refresh();
        $after = DB::table('credentials')->where('user_id', $admin->id)->where('type', 'password')->whereNull('deleted_at')->value('secret_hash');
        $this->assertNotSame($before, $after);
        $this->assertSame($admin->password_hash, $after);
        $this->assertSame(401, $this->loginStatus(self::ADMIN_EMAIL, self::ADMIN_PASSWORD));
    }

    public function test_set_password_upsert_never_creates_a_second_active_password(): void
    {
        [$user] = $this->makeUser();
        for ($i = 0; $i < 3; $i++) {
            $this->credentials->setPasswordHash($user, '$2y$04$'.str_repeat((string) $i, 53));
        }
        $this->assertSame(1, DB::table('credentials')->where('user_id', $user->id)->where('type', 'password')->whereNull('deleted_at')->count());
        $this->assertSame('$2y$04$'.str_repeat('2', 53), $this->credentials->passwordHash($user));
    }

    // ------------------------------------------------------------------ reads

    public function test_credential_is_the_source_of_truth_over_the_legacy_column(): void
    {
        [$a, $aEmail, $aPass] = $this->makeUser();
        [$b, , $bPass] = $this->makeUser();
        DB::table('credentials')->where('user_id', $a->id)->update([
            'secret_hash' => DB::table('credentials')->where('user_id', $b->id)->value('secret_hash'),
        ]);
        $this->assertSame(200, $this->loginStatus($aEmail, $bPass));
        $this->assertSame(401, $this->loginStatus($aEmail, $aPass));
    }

    public function test_legacy_fallback_for_a_user_without_new_rows(): void
    {
        [$user, $email, $password] = $this->makeUser('+919800000001');
        DB::table('identities')->where('user_id', $user->id)->delete();
        DB::table('credentials')->where('user_id', $user->id)->delete();
        $this->assertSame(200, $this->loginStatus($email, $password));
        $this->assertSame($user->id, $this->credentials->findUserByIdentifier(CredentialService::PHONE, '+919800000001')?->id);
    }

    public function test_soft_deleted_email_identity_is_not_resurrected(): void
    {
        [$user, $email, $password] = $this->makeUser();
        DB::table('identities')->where('user_id', $user->id)->where('type', 'email')->update(['deleted_at' => now()]);
        $this->postJson('/auth/login', ['email' => $email, 'password' => $password])
            ->assertStatus(401)->assertJsonPath('code', 'invalid_credentials');
        $this->assertNull($this->credentials->findUserByIdentifier(CredentialService::EMAIL, $email));
    }

    public function test_soft_deleted_password_is_not_resurrected(): void
    {
        [$user, $email, $password] = $this->makeUser();
        DB::table('credentials')->where('user_id', $user->id)->update(['deleted_at' => now()]);
        $this->assertNull($this->credentials->passwordHash($user));
        $this->assertSame(401, $this->loginStatus($email, $password));
        $this->assertSame(1, (int) User::query()->whereKey($user->id)->value('failed_login_attempts'), 'counted as a failed login');
    }

    public function test_soft_deleted_user_cannot_log_in(): void
    {
        [$user, $email, $password] = $this->makeUser();
        User::query()->whereKey($user->id)->update(['deleted_at' => now()]);
        $this->assertSame(401, $this->loginStatus($email, $password));
    }

    public function test_blank_identifiers_never_match_or_get_stored(): void
    {
        foreach (['', '   '] as $blank) {
            $this->assertNull($this->credentials->findUserByIdentifier(CredentialService::EMAIL, $blank));
        }
        $this->expectException(\InvalidArgumentException::class);
        $this->credentials->addIdentity($this->admin()->id, 'username', '   ');
    }

    public function test_username_type_has_no_legacy_fallback(): void
    {
        $this->assertNull($this->credentials->findUserByIdentifier('username', self::ADMIN_EMAIL));
    }

    // ------------------------------------------------------------------ migration

    public function test_shared_sql_is_idempotent_and_skips_users_whose_identity_differs(): void
    {
        [$user] = $this->makeUser();
        DB::table('identities')->where('user_id', $user->id)->where('type', 'email')->update(['value_hash' => 'changed-'.Str::random(20)]);
        $before = [DB::table('identities')->count(), DB::table('credentials')->count()];
        $sql = (string) file_get_contents(database_path('schema/0010_identities_credentials.sql'));
        DB::unprepared($sql);
        DB::unprepared($sql);
        $this->assertSame($before, [DB::table('identities')->count(), DB::table('credentials')->count()]);
    }

    public function test_shared_sql_backfills_legacy_users_but_never_restores_removed_rows(): void
    {
        [$legacy] = $this->makeUser();
        [$removed] = $this->makeUser();
        DB::table('identities')->where('user_id', $legacy->id)->delete();
        DB::table('credentials')->where('user_id', $legacy->id)->delete();
        DB::table('identities')->where('user_id', $removed->id)->update(['deleted_at' => now()]);
        DB::table('credentials')->where('user_id', $removed->id)->update(['deleted_at' => now()]);

        DB::unprepared((string) file_get_contents(database_path('schema/0010_identities_credentials.sql')));

        $this->assertSame(1, DB::table('identities')->where('user_id', $legacy->id)->whereNull('deleted_at')->count());
        $this->assertSame(1, DB::table('credentials')->where('user_id', $legacy->id)->whereNull('deleted_at')->count());
        $this->assertSame(0, DB::table('identities')->where('user_id', $removed->id)->whereNull('deleted_at')->count());
        $this->assertSame(0, DB::table('credentials')->where('user_id', $removed->id)->whereNull('deleted_at')->count());
    }

    public function test_database_rejects_a_second_active_password(): void
    {
        [$user] = $this->makeUser();
        $this->expectException(QueryException::class);
        DB::table('credentials')->insert(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'type' => 'password', 'secret_hash' => 'x']);
    }

    public function test_shared_sql_copy_is_identical_to_the_fastapi_reference(): void
    {
        $reference = base_path('../backend/migrations/sql/0010_identities_credentials.sql');
        if (! is_file($reference)) {
            $this->markTestSkipped('FastAPI reference not available (standalone Laravel checkout)');
        }
        $this->assertSame(file_get_contents($reference), file_get_contents(database_path('schema/0010_identities_credentials.sql')));
    }
}
