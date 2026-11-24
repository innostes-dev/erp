<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $name
 * @property Carbon $created_at
 * @property string|null $created_by
 * @property Carbon $updated_at
 * @property string|null $updated_by
 * @property Carbon|null $deleted_at
 * @property string|null $deleted_by
 * @property string $slug
 * @property string|null $country
 * @property string|null $timezone
 * @property string|null $language
 * @property string|null $date_format
 */
class Tenant extends KernelModel
{
    use SoftDeletes;

    protected $table = 'tenants';

    protected function casts(): array
    {
        return ['deleted_at' => 'datetime'];
    }
}
