<?php

namespace App\Kernel\Services;

use App\Models\UserDevice;
use Illuminate\Support\Carbon;

class DeviceService
{
    /** Register a new device or refresh the existing one for (user, fingerprint). */
    public function registerOrTouch(string $userId, string $fingerprint, string $name, string $type, ?string $ip): UserDevice
    {
        $now = Carbon::now();
        $device = UserDevice::query()
            ->where('user_id', $userId)
            ->where('device_fingerprint', $fingerprint)
            ->whereNull('deleted_at')
            ->first();

        if ($device !== null) {
            $device->fill(['device_name' => $name, 'device_type' => $type, 'last_seen_at' => $now, 'last_ip' => $ip])->save();

            return $device;
        }

        return UserDevice::query()->create([
            'user_id' => $userId,
            'device_fingerprint' => $fingerprint,
            'device_name' => $name,
            'device_type' => $type,
            'status' => 'active',
            'first_seen_at' => $now,
            'last_seen_at' => $now,
            'last_ip' => $ip,
        ])->refresh();
    }
}
