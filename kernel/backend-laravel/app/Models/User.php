<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $first_name
 * @property string|null $last_name
 * @property string $email_hash
 * @property string $email_encrypted
 * @property string|null $mobile_hash
 * @property string|null $mobile_encrypted
 * @property string $password_hash
 * @property string $status
 * @property bool $is_super_admin
 * @property bool $must_change_password
 * @property Carbon|null $temp_password_expires_at
 * @property int $token_version
 * @property int $failed_login_attempts
 * @property Carbon|null $blocked_until
 * @property int $key_version
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class User extends KernelModel
{
    use SoftDeletes;

    protected $table = 'users';

    protected $hidden = ['password_hash', 'email_hash', 'email_encrypted', 'mobile_hash', 'mobile_encrypted'];

    protected function casts(): array
    {
        return [
            'is_super_admin' => 'boolean',
            'must_change_password' => 'boolean',
            'token_version' => 'integer',
            'failed_login_attempts' => 'integer',
            'temp_password_expires_at' => 'datetime',
            'blocked_until' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /** True if suspended or temporarily locked out. */
    public function isBlocked(): bool
    {
        if ($this->status === 'suspended') {
            return true;
        }

        return $this->blocked_until !== null && $this->blocked_until->isFuture();
    }

    public function fullName(): string
    {
        return $this->last_name ? trim($this->first_name.' '.$this->last_name) : $this->first_name;
    }
}
