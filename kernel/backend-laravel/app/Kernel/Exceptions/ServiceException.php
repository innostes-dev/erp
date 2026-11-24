<?php

namespace App\Kernel\Exceptions;

use RuntimeException;

/**
 * Domain error rendered as {"detail": "<message>", "code": "<machine_code>"}.
 * Mirrors kernel.core.services.errors.ServiceError of the FastAPI kernel.
 */
class ServiceException extends RuntimeException
{
    /**
     * @param  array<string, string>  $headers
     */
    public function __construct(
        public readonly int $status,
        string $message,
        public readonly ?string $errorCode = null,
        public readonly array $headers = [],
    ) {
        parent::__construct($message);
    }

    /**
     * @return array{detail: string, code?: string}
     */
    public function body(): array
    {
        $body = ['detail' => $this->getMessage()];
        if ($this->errorCode !== null) {
            $body['code'] = $this->errorCode;
        }

        return $body;
    }

    /**
     * @param  array<string, string>  $headers
     */
    public static function unauthorized(string $message = 'Not authenticated', ?string $code = null, array $headers = []): self
    {
        return new self(401, $message, $code, ['WWW-Authenticate' => 'Bearer'] + $headers);
    }

    public static function invalidToken(string $message = 'Invalid or expired token'): self
    {
        return self::unauthorized($message, ErrorCode::INVALID_TOKEN);
    }

    public static function invalidCredentials(string $message = 'Invalid email or password'): self
    {
        return self::unauthorized($message, ErrorCode::INVALID_CREDENTIALS);
    }

    public static function forbidden(string $message = 'Not allowed', ?string $code = null): self
    {
        return new self(403, $message, $code);
    }

    public static function notFound(string $message = 'Resource not found', ?string $code = null): self
    {
        return new self(404, $message, $code);
    }

    public static function conflict(string $message, ?string $code = null): self
    {
        return new self(409, $message, $code);
    }

    public static function unavailable(string $message, ?string $code = null): self
    {
        return new self(503, $message, $code);
    }

    public static function tooManyRequests(string $message, int $retryAfter): self
    {
        return new self(429, $message, null, ['Retry-After' => (string) max(1, $retryAfter)]);
    }
}
