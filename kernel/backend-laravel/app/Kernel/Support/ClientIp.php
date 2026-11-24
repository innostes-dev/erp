<?php

namespace App\Kernel\Support;

use Illuminate\Http\Request;

final class ClientIp
{
    /**
     * The client address as resolved by Laravel: X-Forwarded-For is honoured only when the direct peer is in
     * TRUSTED_PROXIES. Reading the header unconditionally (as the reference kernel does) lets any client forge
     * the IP stored in audit rows, sessions and devices.
     */
    public static function resolve(Request $request): ?string
    {
        $ip = $request->ip();

        return $ip === null ? null : mb_substr($ip, 0, 45);
    }

    public static function correlationId(Request $request): ?string
    {
        $id = $request->headers->get('X-Correlation-ID');

        return $id !== null ? mb_substr($id, 0, 128) : null;
    }
}
