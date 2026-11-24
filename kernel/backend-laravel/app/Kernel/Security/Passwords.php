<?php

namespace App\Kernel\Security;

/**
 * bcrypt password hashing. Hashes written by any backend ($2b$, $2y$, $2a$) verify here;
 * Python's bcrypt verifies the $2y$ prefix PHP writes.
 */
final class Passwords
{
    /** Pre-computed bcrypt hash used to neutralise user-enumeration timing differences. */
    public const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lew.6K2f2D3z8S6mK';

    public function __construct(private readonly int $cost = 12) {}

    public function hash(string $plain): string
    {
        return password_hash($plain, PASSWORD_BCRYPT, ['cost' => $this->cost]);
    }

    public function verify(string $plain, string $hash): bool
    {
        // bcrypt only uses the first 72 bytes; password_verify handles that. Never throws.
        return $hash !== '' && password_verify($plain, $hash);
    }

    /** Spend the same time as a real verification (unknown account / suspended). */
    public function dummyVerify(string $plain): void
    {
        password_verify($plain, self::DUMMY_HASH);
    }
}
