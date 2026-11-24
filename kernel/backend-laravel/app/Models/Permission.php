<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $code
 * @property string $module
 * @property string $name
 * @property string|null $description
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 * @property string|null $resource
 * @property string|null $action
 * @property string $default_scope
 */
class Permission extends KernelModel
{
    protected $table = 'permissions';

    protected function casts(): array
    {
        return [];
    }
}
