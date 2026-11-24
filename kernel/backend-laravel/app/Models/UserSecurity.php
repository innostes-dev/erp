<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $user_id
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $mobile_verified_at
 * @property Carbon|null $password_changed_at
 * @property bool $mfa_enabled
 * @property string|null $mfa_secret_encrypted
 * @property array<mixed>|null $mfa_backup_codes_hash
 * @property Carbon|null $last_login_at
 * @property string|null $last_login_ip
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class UserSecurity extends KernelModel
{
    protected $table = 'user_security';

    protected function casts(): array
    {
        return ['mfa_enabled' => 'boolean', 'last_login_at' => 'datetime', 'password_changed_at' => 'datetime'];
    }
}
