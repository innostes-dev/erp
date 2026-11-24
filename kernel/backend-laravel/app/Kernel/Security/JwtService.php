<?php

namespace App\Kernel\Security;

use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use stdClass;

/** HS256 JWTs with the claim layout of kernel.core.security.jwt / AuthService. */
final class JwtService
{
    public function __construct(
        private readonly string $secret,
        private readonly string $algorithm = 'HS256',
        private readonly int $accessTtlMinutes = 30,
        private readonly int $resetTtlMinutes = 60,
    ) {}

    /**
     * @param  array<string, mixed>  $claims  sub, email, token_version, is_super_admin
     */
    public function createAccessToken(array $claims, ?int $now = null): string
    {
        $now ??= time();

        return JWT::encode(
            $claims + ['type' => 'access', 'iat' => $now, 'exp' => $now + $this->accessTtlMinutes * 60],
            $this->secret,
            $this->algorithm
        );
    }

    public function createResetToken(string $userId, int $tokenVersion, ?int $now = null): string
    {
        $now ??= time();

        return JWT::encode([
            'sub' => $userId,
            'type' => 'password_reset',
            'token_version' => $tokenVersion,
            'iat' => $now,
            'exp' => $now + $this->resetTtlMinutes * 60,
        ], $this->secret, $this->algorithm);
    }

    /**
     * @return array<string, mixed>
     *
     * @throws ExpiredException
     * @throws \Exception any other verification failure (signature, format, algorithm)
     */
    public function decode(string $token): array
    {
        $decoded = JWT::decode($token, new Key($this->secret, $this->algorithm));

        /** @var stdClass $decoded */
        return (array) json_decode((string) json_encode($decoded), true);
    }
}
