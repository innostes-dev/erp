<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property bool $singleton
 * @property string $app_version
 * @property string $default_tenant_id
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class Installation extends KernelModel
{
    protected $table = 'installation';

    protected function casts(): array
    {
        return ['singleton' => 'boolean'];
    }
}
