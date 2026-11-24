<?php

namespace App\Kernel\Services;

use App\Kernel\Support\Iso;
use App\Models\ApiKey;
use App\Models\Tenant;
use App\Models\User;

/** Builds API response arrays (field-for-field the FastAPI *Read schemas). */
final class Presenter
{
    public function __construct(private readonly UserService $users) {}

    /**
     * @return array<string, mixed>
     */
    public function user(User $user): array
    {
        return [
            'id' => $user->id,
            'created_at' => Iso::format($user->created_at),
            'created_by' => $user->created_by,
            'updated_at' => Iso::format($user->updated_at),
            'updated_by' => $user->updated_by,
            'deleted_at' => Iso::format($user->deleted_at),
            'deleted_by' => $user->deleted_by,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $this->users->decryptEmail($user),
            'mobile' => $this->users->decryptMobile($user),
            'status' => $user->status ?: 'active',
            'is_super_admin' => (bool) $user->is_super_admin,
            'token_version' => (int) ($user->token_version ?? 1),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function tenant(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'created_at' => Iso::format($tenant->created_at),
            'created_by' => $tenant->created_by,
            'updated_at' => Iso::format($tenant->updated_at),
            'updated_by' => $tenant->updated_by,
            'deleted_at' => Iso::format($tenant->deleted_at),
            'deleted_by' => $tenant->deleted_by,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'country' => $tenant->country,
            'timezone' => $tenant->timezone,
            'language' => $tenant->language,
            'date_format' => $tenant->date_format,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function apiKey(ApiKey $key): array
    {
        return [
            'id' => $key->id,
            'name' => $key->name,
            'key_prefix' => $key->key_prefix,
            'scopes' => array_values($key->scopes ?? []),
            'expires_at' => Iso::format($key->expires_at),
            'last_used_at' => Iso::format($key->last_used_at),
            'is_revoked' => (bool) $key->is_revoked,
            'created_at' => Iso::format($key->created_at),
        ];
    }
}
