<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $tenant_id
 * @property string|null $actor_id
 * @property string|null $actor_email
 * @property string|null $actor_name
 * @property string $action
 * @property string $entity_type
 * @property string $entity_id
 * @property string|null $entity_name
 * @property array<mixed> $changes
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property string|null $correlation_id
 * @property string|null $reason
 * @property string $status
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class AuditLog extends KernelModel
{
    protected $table = 'audit_logs';

    protected function casts(): array
    {
        return ['changes' => 'array'];
    }
}
