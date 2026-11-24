<?php

namespace App\Kernel\Crypto;

/** HMAC-SHA256(pepper, trim(lower(value))) hex digest, identical to kernel.core.crypto.cipher.BlindIndex. */
final class BlindIndex
{
    public function __construct(private readonly string $pepper) {}

    public function compute(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return hash_hmac('sha256', trim(mb_strtolower($value)), $this->pepper);
    }
}
