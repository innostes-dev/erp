<?php

namespace App\Kernel\Crypto;

/**
 * AES-256-GCM envelope encryption compatible with kernel.core.crypto.cipher.FieldCipher.
 *
 * Envelope: "v<keyVersion>:<base64 12-byte nonce>:<base64 ciphertext||16-byte tag>", no AAD.
 */
final class FieldCipher
{
    private const ENVELOPE = '/^v(\d+):([A-Za-z0-9+\/=]+):([A-Za-z0-9+\/=]+)$/';

    private const TAG_LENGTH = 16;

    /** @var array<int, string> raw 32-byte keys by version */
    private array $keyring = [];

    /**
     * @param  array<int, string>  $configuredKeys  version => 64 hex chars or arbitrary string
     */
    public function __construct(array $configuredKeys, private readonly int $currentVersion)
    {
        foreach ($configuredKeys as $version => $secret) {
            $this->keyring[(int) $version] = self::deriveKey($secret);
        }
        if (! isset($this->keyring[$this->currentVersion])) {
            throw new CryptoException("Active encryption key version {$this->currentVersion} not found in keyring.");
        }
    }

    public static function deriveKey(string $secret): string
    {
        if (strlen($secret) === 64 && ctype_xdigit($secret)) {
            $raw = hex2bin($secret);

            return $raw === false ? throw new CryptoException('Invalid hex key.') : $raw;
        }

        return str_pad(substr($secret, 0, 32), 32, "\0");
    }

    public function encrypt(?string $plaintext, ?int $version = null): ?string
    {
        if ($plaintext === null) {
            return null;
        }
        $version ??= $this->currentVersion;
        $key = $this->keyring[$version] ?? throw new CryptoException("Encryption key version {$version} not found in keyring.");

        $nonce = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag, '', self::TAG_LENGTH);
        if ($ciphertext === false) {
            throw new CryptoException('Encryption failed.');
        }

        return 'v'.$version.':'.base64_encode($nonce).':'.base64_encode($ciphertext.$tag);
    }

    public function decrypt(?string $envelope): ?string
    {
        if ($envelope === null) {
            return null;
        }
        if (preg_match(self::ENVELOPE, trim($envelope), $m) !== 1) {
            throw new CryptoException('Invalid ciphertext envelope format.');
        }
        $version = (int) $m[1];
        $key = $this->keyring[$version] ?? throw new CryptoException("Cannot decrypt: Key version {$version} not in active keyring.");
        $nonce = base64_decode($m[2], true);
        $blob = base64_decode($m[3], true);
        if ($nonce === false || $blob === false || strlen($blob) < self::TAG_LENGTH) {
            throw new CryptoException('Invalid ciphertext envelope format.');
        }
        $ciphertext = substr($blob, 0, -self::TAG_LENGTH);
        $tag = substr($blob, -self::TAG_LENGTH);

        $plain = openssl_decrypt($ciphertext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag);
        if ($plain === false) {
            throw new CryptoException('Ciphertext integrity verification failed or data corrupted.');
        }

        return $plain;
    }

    public function envelopeVersion(string $envelope): int
    {
        if (preg_match(self::ENVELOPE, trim($envelope), $m) !== 1) {
            throw new CryptoException('Invalid ciphertext envelope format.');
        }

        return (int) $m[1];
    }
}
