<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $tenant_id
 * @property string $code
 * @property string $name
 * @property string|null $description
 * @property bool $is_system
 * @property int $hierarchy_level
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 * @property string|null $module_code
 * @property bool $can_delegate
 * @property int $max_delegatable_level
 */
class Role extends KernelModel
{
    protected $table = 'roles';

    protected function casts(): array
    {
        return ['is_system' => 'boolean', 'can_delegate' => 'boolean', 'hierarchy_level' => 'integer', 'max_delegatable_level' => 'integer'];
    }
}
