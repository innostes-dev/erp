<?php

namespace App\Kernel\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class RbacService
{
    public function getOrCreatePermission(string $code, string $module, string $name, ?string $description, ?string $resource, ?string $action, string $defaultScope): Permission
    {
        $perm = Permission::query()->where('code', $code)->first();
        if ($perm !== null) {
            return $perm;
        }
        $parts = explode('.', $code);
        $resource ??= $parts[1] ?? null;
        $action ??= $parts[2] ?? null;

        return Permission::query()->create([
            'code' => $code, 'module' => $module, 'name' => $name, 'description' => $description,
            'resource' => $resource, 'action' => $action, 'default_scope' => $defaultScope,
        ]);
    }

    public function getOrCreateRole(string $code, string $name, ?string $tenantId, bool $isSystem, int $level, ?string $description, ?string $moduleCode, bool $canDelegate, int $maxDelegatable): Role
    {
        $q = Role::query()->where('code', $code);
        $tenantId === null ? $q->whereNull('tenant_id') : $q->where('tenant_id', $tenantId);
        $role = $q->first();
        if ($role !== null) {
            return $role;
        }

        return Role::query()->create([
            'code' => $code, 'name' => $name, 'tenant_id' => $tenantId, 'is_system' => $isSystem,
            'hierarchy_level' => $level, 'description' => $description, 'module_code' => $moduleCode,
            'can_delegate' => $canDelegate, 'max_delegatable_level' => $maxDelegatable,
        ]);
    }

    public function assignPermissionToRole(string $roleId, string $permissionId, string $scope = 'OWN'): RolePermission
    {
        return RolePermission::query()->firstOrCreate(
            ['role_id' => $roleId, 'permission_id' => $permissionId],
            ['scope' => $scope]
        );
    }

    public function assignRoleToUser(string $userId, string $roleId, ?string $tenantId, ?string $assignedBy): UserRole
    {
        $q = UserRole::query()->where('user_id', $userId)->where('role_id', $roleId);
        $tenantId === null ? $q->whereNull('tenant_id') : $q->where('tenant_id', $tenantId);
        $existing = $q->first();
        if ($existing !== null) {
            return $existing;
        }

        return UserRole::query()->create([
            'user_id' => $userId, 'role_id' => $roleId, 'tenant_id' => $tenantId,
            'assigned_by' => $assignedBy, 'assigned_at' => Carbon::now(),
        ]);
    }

    /**
     * @return list<string>
     */
    public function getUserModuleGrants(string $userId, string $tenantId): array
    {
        return DB::table('user_module_grants')
            ->where('tenant_id', $tenantId)->where('user_id', $userId)->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', Carbon::now()))
            ->pluck('module_code')->all();
    }

    /**
     * @return list<object{code: string, name: string, hierarchy_level: int, module_code: ?string}>
     */
    public function getUserRoles(string $userId, ?string $tenantId): array
    {
        return DB::table('roles')
            ->join('user_roles', 'user_roles.role_id', '=', 'roles.id')
            ->where('user_roles.user_id', $userId)
            ->where(fn ($q) => $this->scope($q, $tenantId))
            ->where(fn ($q) => $q->whereNull('user_roles.expires_at')->orWhere('user_roles.expires_at', '>', Carbon::now()))
            ->select('roles.*')
            ->get()->all();
    }

    /**
     * @return list<array{code: string, module: string, scope: string}>
     */
    public function getUserPermissions(string $userId, ?string $tenantId): array
    {
        return DB::table('permissions')
            ->join('role_permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->join('roles', 'roles.id', '=', 'role_permissions.role_id')
            ->join('user_roles', 'user_roles.role_id', '=', 'roles.id')
            ->where('user_roles.user_id', $userId)
            ->where(fn ($q) => $this->scope($q, $tenantId))
            ->where(fn ($q) => $q->whereNull('user_roles.expires_at')->orWhere('user_roles.expires_at', '>', Carbon::now()))
            ->select('permissions.code', 'permissions.module', 'role_permissions.scope')
            ->get()
            ->map(fn ($r) => ['code' => $r->code, 'module' => $r->module, 'scope' => $r->scope ?: 'OWN'])
            ->all();
    }

    public function hasPermission(string $userId, string $permissionCode, ?string $tenantId): bool
    {
        $user = User::query()->whereKey($userId)->first();
        if ($user === null || $user->isBlocked()) {
            return false;
        }
        if ($user->is_super_admin) {
            return true;
        }

        return DB::table('permissions')
            ->join('role_permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->join('user_roles', 'user_roles.role_id', '=', 'role_permissions.role_id')
            ->where('user_roles.user_id', $userId)
            ->where('permissions.code', $permissionCode)
            ->where(fn ($q) => $this->scope($q, $tenantId))
            ->where(fn ($q) => $q->whereNull('user_roles.expires_at')->orWhere('user_roles.expires_at', '>', Carbon::now()))
            ->exists();
    }

    /**
     * @param  Builder<*>|\Illuminate\Database\Query\Builder  $q
     */
    private function scope($q, ?string $tenantId): void
    {
        if ($tenantId === null) {
            $q->whereNull('user_roles.tenant_id');

            return;
        }
        $q->where('user_roles.tenant_id', $tenantId)->orWhereNull('user_roles.tenant_id');
    }
}
