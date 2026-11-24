<?php

namespace App\Kernel\Services;

use App\Kernel\Crypto\BlindIndex;
use App\Kernel\Crypto\FieldCipher;
use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Security\Passwords;
use App\Models\PasswordHistory;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\UserSecurity;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;

class UserService
{
    public function __construct(
        private readonly FieldCipher $cipher,
        private readonly BlindIndex $blindIndex,
        private readonly Passwords $passwords,
        private readonly CredentialService $credentials,
    ) {}

    public function findById(string $id): ?User
    {
        return User::query()->whereKey($id)->first();
    }

    /** Lookup through the `identities` table (blind index, case/whitespace-insensitive), legacy column as fallback. */
    public function findByEmail(string $email): ?User
    {
        return $this->credentials->findUserByIdentifier(CredentialService::EMAIL, $email);
    }

    /**
     * Create a user with envelope-encrypted PII and bcrypt password (profile, security row and
     * password history are created too). Callers decide the surrounding transaction.
     *
     * @param  array{first_name: string, last_name?: ?string, email: string, password: string, mobile?: ?string}  $data
     */
    public function create(array $data, bool $isSuperAdmin = false, ?string $actorId = null): User
    {
        $email = self::normalizeEmail($data['email']);
        $emailHash = $this->blindIndex->compute($email);
        if ($emailHash === null) {
            throw new \InvalidArgumentException('Email cannot be empty.');
        }
        if ($this->findByEmail($email) !== null) {
            throw ServiceException::conflict("User with email '{$email}' already exists.", ErrorCode::EMAIL_ALREADY_EXISTS);
        }

        $mobile = $data['mobile'] ?? null;
        $mobileHash = $mobile ? $this->blindIndex->compute($mobile) : null;
        if ($mobileHash !== null && User::withTrashed()->where('mobile_hash', $mobileHash)->exists()) {
            throw ServiceException::conflict('User with this mobile number already exists.', ErrorCode::MOBILE_ALREADY_EXISTS);
        }

        $hash = $this->passwords->hash($data['password']);
        $now = Carbon::now();

        try {
            $user = new User([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'] ?? null,
                'email_hash' => $emailHash,
                'email_encrypted' => $this->cipher->encrypt($email),
                'mobile_hash' => $mobileHash,
                'mobile_encrypted' => $mobile ? $this->cipher->encrypt($mobile) : null,
                'password_hash' => $hash,
                'status' => 'active',
                'is_super_admin' => $isSuperAdmin,
                'must_change_password' => false,
                'failed_login_attempts' => 0,
                'token_version' => 1,
                'key_version' => 1,
                'created_by' => $actorId,
                'updated_by' => $actorId,
            ]);
            $user->save();
        } catch (QueryException $e) {
            // Unique-index race on email_hash / mobile_hash.
            if (($e->errorInfo[0] ?? null) === '23505') {
                throw ServiceException::conflict("User with email '{$email}' already exists.", ErrorCode::EMAIL_ALREADY_EXISTS);
            }
            throw $e;
        }

        // Login identifiers and password in the dedicated tables (the legacy columns above stay in sync).
        $this->credentials->addIdentity($user->id, CredentialService::EMAIL, $email, true, $actorId);
        if ($mobile) {
            $this->credentials->addIdentity($user->id, CredentialService::PHONE, $mobile, true, $actorId);
        }
        $this->credentials->setPasswordHash($user, $hash, $actorId);

        UserProfile::query()->create(['user_id' => $user->id]);
        UserSecurity::query()->create(['user_id' => $user->id, 'password_changed_at' => $now]);
        PasswordHistory::query()->create(['user_id' => $user->id, 'password_hash' => $hash]);

        return $user;
    }

    /** pydantic EmailStr normalisation: the domain part is lower-cased, the local part is preserved. */
    public static function normalizeEmail(string $email): string
    {
        $at = strrpos($email, '@');

        return $at === false ? $email : substr($email, 0, $at).'@'.mb_strtolower(substr($email, $at + 1));
    }

    public function decryptEmail(User $user): string
    {
        return $this->cipher->decrypt($user->email_encrypted) ?? '';
    }

    public function decryptMobile(User $user): ?string
    {
        return $user->mobile_encrypted ? $this->cipher->decrypt($user->mobile_encrypted) : null;
    }
}
