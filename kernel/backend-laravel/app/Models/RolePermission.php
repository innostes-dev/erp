<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $role_id
 * @property string $permission_id
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 * @property string $scope
 * @property array<mixed>|null $conditions
 */
class RolePermission extends KernelModel
{
    protected $table = 'role_permissions';

    protected function casts(): array
    {
        return ['conditions' => 'array'];
    }
}
