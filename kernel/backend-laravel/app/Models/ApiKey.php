<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $user_id
 * @property string $name
 * @property string $key_prefix
 * @property string $key_hash
 * @property array<mixed> $scopes
 * @property Carbon|null $expires_at
 * @property Carbon|null $last_used_at
 * @property bool $is_revoked
 * @property Carbon|null $revoked_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property string|null $created_by
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class ApiKey extends KernelModel
{
    protected $table = 'api_keys';

    protected function casts(): array
    {
        return ['scopes' => 'array', 'is_revoked' => 'boolean', 'expires_at' => 'datetime', 'last_used_at' => 'datetime', 'revoked_at' => 'datetime'];
    }
}
