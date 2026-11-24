<?php

namespace App\Kernel\Services;

use App\Kernel\Exceptions\ServiceException;
use App\Models\ApiKey;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class ApiKeyService
{
    public const PREFIX = 'inno_live_';

    public static function hashKey(string $raw): string
    {
        return hash('sha256', $raw);
    }

    /**
     * @param  list<string>|null  $scopes
     * @return array{0: ApiKey, 1: string} the record and the one-time raw key
     */
    public function create(string $tenantId, string $userId, string $name, ?array $scopes, ?int $expiresInDays): array
    {
        $raw = self::PREFIX.rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $key = ApiKey::query()->create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'name' => $name,
            'key_prefix' => substr($raw, 0, 14).'...',
            'key_hash' => self::hashKey($raw),
            'scopes' => $scopes === null || $scopes === [] ? ['*'] : $scopes,
            'expires_at' => $expiresInDays ? Carbon::now()->addDays($expiresInDays) : null,
            'is_revoked' => false,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        return [$key->refresh(), $raw];
    }

    /**
     * @return Collection<int, ApiKey>
     */
    public function list(string $tenantId, ?string $ownerId = null)
    {
        $q = ApiKey::query()->where('tenant_id', $tenantId);
        if ($ownerId !== null) {
            $q->where('user_id', $ownerId);
        }

        return $q->orderByDesc('created_at')->get();
    }

    /** @param  ?string  $ownerId  when set, only that user's keys are visible (others are reported as not found) */
    public function revoke(string $keyId, string $tenantId, ?string $actorId, ?string $ownerId = null): ApiKey
    {
        $q = ApiKey::query()->whereKey($keyId)->where('tenant_id', $tenantId);
        if ($ownerId !== null) {
            $q->where('user_id', $ownerId);
        }
        $key = $q->first();
        if ($key === null) {
            throw ServiceException::notFound('API key not found.');
        }
        $key->is_revoked = true;
        $key->revoked_at = Carbon::now();
        $key->updated_by = $actorId;
        $key->save();

        return $key;
    }

    /** The valid key record, or null if unknown/revoked/expired. */
    public function verify(string $raw): ?ApiKey
    {
        if (! str_starts_with($raw, self::PREFIX)) {
            return null;
        }
        $key = ApiKey::query()->where('key_hash', self::hashKey($raw))->first();
        if ($key === null || $key->is_revoked) {
            return null;
        }
        if ($key->expires_at !== null && $key->expires_at->isPast()) {
            return null;
        }
        $key->last_used_at = Carbon::now();
        $key->saveQuietly();

        return $key;
    }
}
