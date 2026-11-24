<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $user_id
 * @property string $module_code
 * @property bool $is_active
 * @property string|null $granted_by
 * @property Carbon $granted_at
 * @property Carbon|null $expires_at
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class UserModuleGrant extends KernelModel
{
    protected $table = 'user_module_grants';

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'expires_at' => 'datetime', 'granted_at' => 'datetime'];
    }
}
