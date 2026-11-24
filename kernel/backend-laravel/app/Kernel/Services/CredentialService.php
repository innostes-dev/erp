<?php

namespace App\Kernel\Services;

use App\Kernel\Crypto\BlindIndex;
use App\Kernel\Crypto\FieldCipher;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Login identities (who is logging in) and credentials (how they prove it).
 *
 * Expand-step rules, identical in the FastAPI and NestJS kernels (they share one database):
 *  - reads use the `identities` / `credentials` tables first, then the legacy `users` columns, but only when
 *    the new table has no row at all (a soft-deleted identity or credential is never brought back);
 *  - writes go to the new tables AND the legacy columns, until the legacy columns are removed.
 */
class CredentialService
{
    public const EMAIL = 'email';

    public const PHONE = 'phone';

    /** Legacy lookup column for identifier types that existed before migration 0010. */
    private const LEGACY_COLUMN = [self::EMAIL => 'email_hash', self::PHONE => 'mobile_hash'];

    public function __construct(
        private readonly FieldCipher $cipher,
        private readonly BlindIndex $blindIndex,
    ) {}

    /** Active (not soft-deleted) owner of an email / phone / username, or null. */
    public function findUserByIdentifier(string $type, string $value): ?User
    {
        // The blind index would hash "   " like ""; blank identifiers never match.
        $hash = trim($value) === '' ? null : $this->blindIndex->compute($value);
        if ($hash === null) {
            return null;
        }

        $user = User::query()
            ->whereExists(function (Builder $q) use ($type, $hash): void {
                $q->selectRaw('1')->from('identities')
                    ->whereColumn('identities.user_id', 'users.id')
                    ->where('identities.type', $type)
                    ->where('identities.value_hash', $hash)
                    ->whereNull('identities.deleted_at');
            })
            ->first();
        if ($user !== null) {
            return $user;
        }

        // Known identifier whose identity (or user) is soft-deleted: do not resurrect it via the legacy column.
        if (DB::table('identities')->where('type', $type)->where('value_hash', $hash)->exists()) {
            return null;
        }

        $legacy = self::LEGACY_COLUMN[$type] ?? null;

        return $legacy === null ? null : User::query()->where($legacy, $hash)->first();
    }

    /** Store an email / phone / username identity with blind index + encrypted value. */
    public function addIdentity(string $userId, string $type, string $value, bool $primary = false, ?string $actorId = null): void
    {
        $hash = trim($value) === '' ? null : $this->blindIndex->compute($value);
        if ($hash === null) {
            throw new \InvalidArgumentException("{$type} cannot be empty.");
        }

        DB::table('identities')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'type' => $type,
            'value_hash' => $hash,
            'value_encrypted' => $this->cipher->encrypt($value),
            'is_primary' => $primary,
            'created_by' => $actorId,
            'updated_by' => $actorId,
        ]);
    }

    /** Current password hash (credentials first, legacy column as fallback); null if none. */
    public function passwordHash(User $user): ?string
    {
        $hash = DB::table('credentials')
            ->where('user_id', $user->id)
            ->where('type', 'password')
            ->whereNull('deleted_at')
            ->value('secret_hash');
        if (is_string($hash) && $hash !== '') {
            return $hash;
        }
        // A password credential existed but was removed: the user has no password (no legacy fallback).
        if (DB::table('credentials')->where('user_id', $user->id)->where('type', 'password')->exists()) {
            return null;
        }

        return $user->password_hash !== '' ? $user->password_hash : null;
    }

    /**
     * Upsert the password credential and mirror it onto the legacy column (the caller saves $user).
     * The conflict target is the partial unique index uq_credentials_user_password.
     */
    public function setPasswordHash(User $user, string $hash, ?string $actorId = null): void
    {
        DB::statement(
            "INSERT INTO credentials (id, user_id, type, secret_hash, created_by, updated_by)
             VALUES (?, ?, 'password', ?, ?, ?)
             ON CONFLICT (user_id) WHERE type = 'password' AND deleted_at IS NULL
             DO UPDATE SET secret_hash = EXCLUDED.secret_hash, updated_at = now(), updated_by = EXCLUDED.updated_by",
            [(string) Str::uuid(), $user->id, $hash, $actorId, $actorId]
        );
        $user->password_hash = $hash;
    }
}
