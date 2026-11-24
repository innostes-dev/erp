<?php

namespace App\Kernel\Services;

use App\Models\Role;
use App\Models\TenantSetting;
use Illuminate\Support\Facades\DB;

/** Seed data identical to kernel/backend/kernel/user/services/seeding.py. */
class SeedingService
{
    /** @var list<array{0: string, 1: string, 2: string, 3: string, 4: string, 5: string}> code, module, description, resource, action, default scope */
    public const PERMISSIONS = [
        ['kernel.setup.read', 'kernel', 'View setup state and checks', 'setup', 'read', 'ORGANIZATION'],
        ['kernel.setup.install', 'kernel', 'Execute initial platform setup', 'setup', 'install', 'ORGANIZATION'],
        ['kernel.config.read', 'kernel', 'Read service runtime configuration', 'config', 'read', 'ORGANIZATION'],
        ['tenancy.tenant.read', 'tenancy', 'View organization details', 'tenant', 'read', 'ORGANIZATION'],
        ['tenancy.tenant.update', 'tenancy', 'Update organization details', 'tenant', 'update', 'ORGANIZATION'],
        ['tenancy.tenant.delete', 'tenancy', 'Delete organization', 'tenant', 'delete', 'ORGANIZATION'],
        ['tenancy.settings.read', 'tenancy', 'Read modular tenant settings', 'settings', 'read', 'ORGANIZATION'],
        ['tenancy.settings.update', 'tenancy', 'Modify modular tenant settings', 'settings', 'update', 'ORGANIZATION'],
        ['tenancy.members.manage', 'tenancy', 'Invite and manage company members', 'members', 'manage', 'ORGANIZATION'],
        ['user.users.create', 'user', 'Create user accounts', 'users', 'create', 'ORGANIZATION'],
        ['user.users.read', 'user', 'View user accounts and profiles', 'users', 'read', 'ORGANIZATION'],
        ['user.users.update', 'user', 'Update user accounts', 'users', 'update', 'ORGANIZATION'],
        ['user.users.delete', 'user', 'Suspend or delete user accounts', 'users', 'delete', 'ORGANIZATION'],
        ['user.roles.manage', 'user', 'Assign and customize security roles', 'roles', 'manage', 'ORGANIZATION'],
        ['user.devices.manage', 'user', 'View and manage registered devices', 'devices', 'manage', 'ORGANIZATION'],
        ['user.devices.wipe', 'user', 'Trigger remote wipe on devices', 'devices', 'wipe', 'ORGANIZATION'],
        ['salesflow.leads.read', 'salesflow', 'View CRM leads', 'leads', 'read', 'OWN'],
        ['salesflow.leads.create', 'salesflow', 'Create new CRM leads', 'leads', 'create', 'OWN'],
        ['salesflow.leads.update', 'salesflow', 'Modify CRM leads', 'leads', 'update', 'OWN'],
        ['salesflow.deals.read', 'salesflow', 'View revenue deals & pipeline', 'deals', 'read', 'OWN'],
        ['salesflow.deals.manage', 'salesflow', 'Create, close and manage deals', 'deals', 'manage', 'DEPARTMENT'],
        ['salesflow.pipeline.manage', 'salesflow', 'Configure pipeline stages and quotas', 'pipeline', 'manage', 'ORGANIZATION'],
        ['peopleops.directory.read', 'peopleops', 'View employee directory', 'directory', 'read', 'ORGANIZATION'],
        ['peopleops.leave.apply', 'peopleops', 'Submit leave requests', 'leave', 'apply', 'OWN'],
        ['peopleops.leave.approve', 'peopleops', 'Approve team leave requests', 'leave', 'approve', 'DEPARTMENT'],
        ['peopleops.payroll.view', 'peopleops', 'View compensation and paystubs', 'payroll', 'read', 'OWN'],
        ['peopleops.payroll.manage', 'peopleops', 'Run payroll and manage compensation', 'payroll', 'manage', 'ORGANIZATION'],
        ['tracura.logs.read', 'tracura', 'Query telemetry and logs', 'logs', 'read', 'ORGANIZATION'],
        ['tracura.projects.manage', 'tracura', 'Create and configure telemetry projects', 'projects', 'manage', 'ORGANIZATION'],
        ['tracura.keys.manage', 'tracura', 'Issue and revoke ingestion API keys', 'keys', 'manage', 'ORGANIZATION'],
    ];

    /** @var list<array{0: string, 1: string, 2: int, 3: string, 4: string|list<string>, 5: ?string, 6: bool, 7: int}> code, name, level, description, grants, module, can_delegate, max_delegatable */
    public const ROLES = [
        ['super_admin', 'Super Administrator', 100, 'Global platform super administrator with unrestricted access.', 'ALL', null, true, 100],
        ['owner', 'Organization Owner', 80, 'Full administrative control over tenant resources and members.', 'ALL', null, true, 79],
        ['admin', 'Administrator', 50, 'Operational administrator for company settings and users.', ['kernel.config.read', 'tenancy.tenant.read', 'tenancy.tenant.update', 'tenancy.settings.read', 'tenancy.settings.update', 'tenancy.members.manage', 'user.users.create', 'user.users.read', 'user.users.update', 'user.devices.manage', 'user.devices.wipe', 'salesflow.leads.read', 'salesflow.deals.read', 'peopleops.directory.read', 'tracura.logs.read'], null, true, 49],
        ['member', 'Member', 10, 'Standard organization member with read access.', ['kernel.config.read', 'tenancy.tenant.read', 'tenancy.settings.read', 'user.users.read', 'peopleops.directory.read'], null, false, 0],
        ['sales_manager', 'Sales Manager', 40, 'Departmental manager with team-wide lead & deal authority.', ['salesflow.leads.read', 'salesflow.leads.create', 'salesflow.leads.update', 'salesflow.deals.read', 'salesflow.deals.manage', 'salesflow.pipeline.manage'], 'salesflow', true, 30],
        ['sales_rep', 'Sales Representative', 20, 'Individual contributor managing assigned sales pipeline.', ['salesflow.leads.read', 'salesflow.leads.create', 'salesflow.leads.update', 'salesflow.deals.read'], 'salesflow', false, 0],
        ['hr_manager', 'HR Manager', 45, 'Departmental HR manager overseeing workforce and leave.', ['peopleops.directory.read', 'peopleops.leave.apply', 'peopleops.leave.approve', 'peopleops.payroll.view', 'peopleops.payroll.manage'], 'peopleops', true, 30],
        ['employee', 'Employee', 15, 'Standard employee self-service access.', ['peopleops.directory.read', 'peopleops.leave.apply', 'peopleops.payroll.view'], 'peopleops', false, 0],
        ['telemetry_engineer', 'Telemetry Engineer', 35, 'Observability specialist managing logs, keys and tracing.', ['tracura.logs.read', 'tracura.projects.manage', 'tracura.keys.manage'], 'tracura', false, 0],
    ];

    public function __construct(private readonly RbacService $rbac) {}

    /**
     * Seed baseline permissions and system roles (idempotent).
     *
     * @return array<string, Role>
     */
    public function seedPermissionsAndRoles(): array
    {
        $perms = [];
        foreach (self::PERMISSIONS as [$code, $module, $description, $resource, $action, $scope]) {
            $name = ucfirst(strtolower(substr($code, (int) strrpos($code, '.') + 1)));
            $perms[$code] = $this->rbac->getOrCreatePermission($code, $module, $name, $description, $resource, $action, $scope);
        }

        $roles = [];
        foreach (self::ROLES as [$code, $name, $level, $description, $granted, $moduleCode, $canDelegate, $maxDelegatable]) {
            $role = $this->rbac->getOrCreateRole($code, $name, null, true, $level, $description, $moduleCode, $canDelegate, $maxDelegatable);
            $roles[$code] = $role;
            $codes = $granted === 'ALL' ? array_keys($perms) : $granted;
            foreach ($codes as $permCode) {
                if (isset($perms[$permCode])) {
                    $this->rbac->assignPermissionToRole($role->id, $perms[$permCode]->id);
                }
            }
        }

        return $roles;
    }

    /**
     * Initialise the branding, auth and localization settings namespaces for a tenant.
     *
     * @param  array{theme?: string, primary_color?: string, logo_url?: ?string}|null  $branding
     */
    public function seedTenantSettings(string $tenantId, string $organizationName, ?array $branding, string $timezone, string $language, string $dateFormat, ?string $actorId = null): void
    {
        $namespaces = [
            'branding' => [
                'theme' => $branding['theme'] ?? 'system',
                'primary_color' => $branding['primary_color'] ?? '#2563EB',
                'accent_color' => '#4F46E5',
                'company_display_name' => $organizationName,
                'logo_url' => $branding['logo_url'] ?? null,
                'favicon_url' => null,
            ],
            'auth' => ['mfa_enforced' => false, 'session_idle_timeout_minutes' => 60, 'max_login_attempts' => 5],
            'localization' => [
                'timezone' => $timezone, 'language' => $language, 'date_format' => $dateFormat,
                'time_format' => '24h', 'currency' => 'USD',
            ],
        ];

        DB::transaction(function () use ($namespaces, $tenantId, $actorId): void {
            foreach ($namespaces as $namespace => $config) {
                $setting = TenantSetting::query()->where('tenant_id', $tenantId)->where('namespace', $namespace)->first();
                if ($setting !== null) {
                    $setting->config = $config;
                    $setting->save();
                } else {
                    TenantSetting::query()->create([
                        'tenant_id' => $tenantId, 'namespace' => $namespace, 'config' => $config,
                        'version' => 1, 'created_by' => $actorId, 'updated_by' => $actorId,
                    ]);
                }
            }
        });
    }
}
