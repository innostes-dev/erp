<?php

namespace App\Models;

use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $user_id
 * @property string $preferred_language
 * @property string $timezone
 * @property string $date_format
 * @property string $time_format
 * @property string|null $avatar_url
 * @property string|null $bio
 * @property array<mixed> $ui_preferences
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 */
class UserProfile extends KernelModel
{
    protected $table = 'user_profiles';

    protected function casts(): array
    {
        return ['ui_preferences' => 'array'];
    }
}
