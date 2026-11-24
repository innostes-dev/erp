<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $user_id
 * @property string $device_fingerprint
 * @property string $device_name
 * @property string $device_type
 * @property string|null $os_name
 * @property string|null $os_version
 * @property string|null $client_name
 * @property string|null $client_version
 * @property string|null $push_token
 * @property bool $is_trusted
 * @property bool $is_corporate_managed
 * @property string $status
 * @property Carbon|null $wipe_requested_at
 * @property Carbon $first_seen_at
 * @property Carbon $last_seen_at
 * @property string|null $last_ip
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class UserDevice extends KernelModel
{
    protected $table = 'user_devices';

    protected function casts(): array
    {
        return ['is_trusted' => 'boolean', 'is_corporate_managed' => 'boolean', 'first_seen_at' => 'datetime', 'last_seen_at' => 'datetime', 'wipe_requested_at' => 'datetime'];
    }
}
