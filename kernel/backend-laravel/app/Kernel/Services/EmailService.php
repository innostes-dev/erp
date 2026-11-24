<?php

namespace App\Kernel\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/** Sends the password-reset email over SMTP; without SMTP_HOST it logs a redacted notice (development). */
class EmailService
{
    public function sendPasswordReset(string $recipient, string $name, string $tempPassword, string $resetLink, int $tempHours, int $linkMinutes): void
    {
        $host = config('kernel.smtp.host');
        if (! $host) {
            // Credentials are only ever logged in explicit development environments (allow-list, not 'not production').
            $payload = ['recipient' => $recipient];
            if (in_array(config('kernel.environment'), ['local', 'development', 'dev', 'testing'], true)) {
                $payload += ['temp_password' => $tempPassword, 'reset_link' => $resetLink];
            }
            Log::info('password reset email (SMTP not configured)', $payload);

            return;
        }

        try {
            Config::set('mail.mailers.kernel_smtp', [
                'transport' => 'smtp',
                'host' => $host,
                'port' => config('kernel.smtp.port'),
                'username' => config('kernel.smtp.username'),
                'password' => config('kernel.smtp.password'),
                'encryption' => config('kernel.smtp.use_tls') ? 'tls' : null,
            ]);
            $body = "Hello {$name},\n\nA password reset was requested for your account.\n\n"
                ."Temporary password (valid {$tempHours} hours): {$tempPassword}\n\n"
                ."Reset link (valid {$linkMinutes} minutes):\n{$resetLink}\n\n"
                ."If you did not request this, contact your administrator.\n";
            Mail::mailer('kernel_smtp')->raw($body, function ($message) use ($recipient): void {
                $message->to($recipient)->from((string) config('kernel.smtp.from'))->subject('Password reset request');
            });
        } catch (Throwable $e) {
            Log::error('password reset email failed', ['recipient' => $recipient, 'error' => $e->getMessage()]);
        }
    }
}
