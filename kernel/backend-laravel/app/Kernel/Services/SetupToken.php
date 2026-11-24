<?php

namespace App\Kernel\Services;

use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use Illuminate\Support\Facades\Cache;

/**
 * The one-time token protecting the web setup wizard: SETUP_TOKEN, or a random token generated once into
 * SETUP_TOKEN_FILE (print it with `php artisan kernel:setup-token`). Wrong guesses are rate limited per client.
 */
class SetupToken
{
    public function value(): string
    {
        $configured = config('kernel.setup.token');
        if (is_string($configured) && $configured !== '') {
            return $configured;
        }
        $path = (string) config('kernel.setup.token_file');
        if (is_file($path)) {
            $value = trim((string) file_get_contents($path));
            if ($value !== '') {
                return $value;
            }
        }
        $dir = dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        $value = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        // Create it owner-only from the start (no window where the secret is group/world readable).
        $previous = umask(0177);
        try {
            $handle = @fopen($path, 'x');
        } finally {
            umask($previous);
        }
        if ($handle === false) { // another worker created it first
            return trim((string) file_get_contents($path));
        }
        fwrite($handle, $value);
        fclose($handle);

        return $value;
    }

    public function verify(?string $candidate): bool
    {
        if ($candidate === null || $candidate === '') {
            return false;
        }

        return hash_equals($this->value(), $candidate);
    }

    public function discard(): void
    {
        $path = (string) config('kernel.setup.token_file');
        if (is_file($path)) {
            @unlink($path);
        }
    }

    /** @throws ServiceException 429 when the client made too many wrong guesses. */
    public function assertNotThrottled(string $client): void
    {
        $failures = $this->recentFailures($client);
        if (count($failures) >= (int) config('kernel.setup.max_attempts')) {
            $window = (int) config('kernel.setup.window_seconds');
            throw ServiceException::tooManyRequests('Too many invalid setup tokens. Try again later.', $window - (time() - $failures[0]) + 1);
        }
    }

    public function recordFailure(string $client): void
    {
        $failures = $this->recentFailures($client);
        $failures[] = time();
        Cache::put($this->key($client), $failures, (int) config('kernel.setup.window_seconds'));
    }

    public function reset(string $client): void
    {
        Cache::forget($this->key($client));
    }

    /**
     * @return list<int>
     */
    private function recentFailures(string $client): array
    {
        $window = (int) config('kernel.setup.window_seconds');
        $all = Cache::get($this->key($client), []);

        return array_values(array_filter(is_array($all) ? $all : [], fn ($t) => time() - (int) $t < $window));
    }

    private function key(string $client): string
    {
        return 'setup-token-failures:'.sha1($client);
    }

    public static function invalid(): ServiceException
    {
        return new ServiceException(401, 'Missing or invalid setup token', ErrorCode::INVALID_SETUP_TOKEN, [
            'WWW-Authenticate' => 'SetupToken header="X-Setup-Token"',
        ]);
    }
}
