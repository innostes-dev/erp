<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $user_id
 * @property string $role_id
 * @property string|null $tenant_id
 * @property string|null $assigned_by
 * @property Carbon $assigned_at
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 * @property string|null $department_id
 * @property Carbon|null $expires_at
 */
class UserRole extends KernelModel
{
    protected $table = 'user_roles';

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'assigned_at' => 'datetime'];
    }
}
