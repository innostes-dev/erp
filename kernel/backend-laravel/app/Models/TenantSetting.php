<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $namespace
 * @property array<mixed> $config
 * @property int $version
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class TenantSetting extends KernelModel
{
    protected $table = 'tenant_settings';

    protected function casts(): array
    {
        return ['config' => 'array', 'version' => 'integer'];
    }
}
