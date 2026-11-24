<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $plugin_id
 * @property bool $is_active
 * @property Carbon|null $activated_at
 * @property string|null $activated_by
 * @property array<mixed> $config
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class TenantPlugin extends KernelModel
{
    protected $table = 'tenant_plugins';

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'config' => 'array', 'activated_at' => 'datetime'];
    }
}
