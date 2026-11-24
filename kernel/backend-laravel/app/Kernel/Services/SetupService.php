<?php

namespace App\Kernel\Services;

use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Support\Iso;
use App\Models\Installation;
use App\Models\TenantMember;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SetupService
{
    public function __construct(
        private readonly SetupState $state,
        private readonly TenantService $tenants,
        private readonly UserService $users,
        private readonly RbacService $rbac,
        private readonly SeedingService $seeding,
        private readonly Presenter $presenter,
    ) {}

    public function databaseConnected(): bool
    {
        try {
            DB::select('select 1');

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * @return array{database_connected: bool, migrations_pending: int}
     */
    public function checks(): array
    {
        if (! $this->databaseConnected()) {
            throw SetupState::databaseUnavailable();
        }

        return ['database_connected' => true, 'migrations_pending' => $this->pendingMigrations()];
    }

    public function pendingMigrations(): int
    {
        /** @var Migrator $migrator */
        $migrator = app('migrator');
        $repository = $migrator->getRepository();
        $files = $migrator->getMigrationFiles([database_path('migrations')]);
        $ran = $repository->repositoryExists() ? $repository->getRan() : [];

        return count(array_diff(array_keys($files), $ran));
    }

    /**
     * @param  array{organization: array<string, mixed>, admin: array<string, mixed>, branding?: ?array<string, mixed>}  $data
     * @return array<string, mixed> SetupResult
     */
    public function install(array $data, ?string $actorId = null): array
    {
        if (! $this->databaseConnected()) {
            throw SetupState::databaseUnavailable();
        }
        if ($this->state->isInstalled()) {
            throw $this->alreadyInstalled();
        }

        if ($this->pendingMigrations() > 0) {
            Log::info('Running first-run setup: applying migrations');
            Artisan::call('migrate', ['--force' => true]);
        }

        try {
            [$tenant, $admin, $installation] = DB::transaction(function () use ($data, $actorId): array {
                $tenant = $this->tenants->create($data['organization'], $actorId);
                $admin = $this->users->create($data['admin'], true);

                TenantMember::query()->create([
                    'tenant_id' => $tenant->id, 'user_id' => $admin->id, 'status' => 'active', 'joined_at' => Carbon::now(),
                ]);

                $roles = $this->seeding->seedPermissionsAndRoles();
                if (isset($roles['super_admin'])) {
                    $this->rbac->assignRoleToUser($admin->id, $roles['super_admin']->id, null, $admin->id);
                }
                if (isset($roles['owner'])) {
                    $this->rbac->assignRoleToUser($admin->id, $roles['owner']->id, $tenant->id, $admin->id);
                }

                $this->seeding->seedTenantSettings(
                    $tenant->id,
                    $tenant->name,
                    $data['branding'] ?? null,
                    $tenant->timezone ?: 'UTC',
                    $tenant->language ?: 'en-US',
                    $tenant->date_format ?: 'YYYY-MM-DD',
                    $actorId ?? $admin->id
                );

                $effectiveActor = $actorId ?? $admin->id;
                $installation = Installation::query()->create([
                    'singleton' => true,
                    'app_version' => (string) config('kernel.version'),
                    'default_tenant_id' => $tenant->id,
                    'created_by' => $effectiveActor,
                    'updated_by' => $effectiveActor,
                ]);

                return [$tenant->refresh(), $admin->refresh(), $installation->refresh()];
            });
        } catch (QueryException $e) {
            // Another setup request won the race (same slug or the installation singleton).
            if (($e->errorInfo[0] ?? null) === '23505') {
                throw $this->alreadyInstalled();
            }
            throw $e;
        }

        $this->state->markInstalled();
        Log::info('First-run setup completed', ['tenant' => $tenant->slug]);

        return [
            'tenant' => Presenter::tenant($tenant),
            'admin' => $this->presenter->user($admin),
            'installed_at' => Iso::format($installation->created_at),
        ];
    }

    private function alreadyInstalled(): ServiceException
    {
        return ServiceException::conflict('Setup has already been completed', ErrorCode::ALREADY_INSTALLED);
    }
}
