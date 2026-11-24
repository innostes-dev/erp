<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $user_id
 * @property string $status
 * @property Carbon|null $joined_at
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class TenantMember extends KernelModel
{
    protected $table = 'tenant_members';

    protected function casts(): array
    {
        return ['joined_at' => 'datetime'];
    }
}
