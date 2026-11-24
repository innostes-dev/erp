<?php

namespace App\Kernel\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use DateTimeInterface;

/** ISO-8601 UTC formatting identical to pydantic's datetime serialisation ("...Z", micros only when non-zero). */
final class Iso
{
    public static function format(DateTimeInterface|string|null $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $dt = $value instanceof CarbonInterface
            ? CarbonImmutable::instance($value)
            : CarbonImmutable::parse($value instanceof DateTimeInterface ? $value->format('c') : $value);
        $dt = $dt->utc();

        return $dt->micro === 0 ? $dt->format('Y-m-d\TH:i:s\Z') : $dt->format('Y-m-d\TH:i:s.u\Z');
    }
}
