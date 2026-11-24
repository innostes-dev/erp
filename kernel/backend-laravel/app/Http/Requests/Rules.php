<?php

namespace App\Http\Requests;

/** Shared rule fragments mirroring the pydantic constraints of the reference schemas. */
final class Rules
{
    /** pydantic EmailStr. */
    public const EMAIL = ['bail', 'required', 'string', 'max:254', 'email:rfc', 'regex:/@[^@\s]+\.[^@\s]+$/'];

    /**
     * @return list<string>
     */
    public static function text(int $min, int $max, bool $nullable = false): array
    {
        // Laravel skips non-implicit rules for '', so min>=1 needs the implicit `required` rule.
        return ['bail', $min >= 1 ? 'required' : 'present', ...($nullable ? ['nullable'] : []), 'string', "min:$min", "max:$max"];
    }

    /**
     * Optional (key may be absent) bounded string, e.g. PATCH fields.
     *
     * @return list<string>
     */
    public static function optionalText(int $min, int $max, bool $nullable = true): array
    {
        return ['bail', 'sometimes', ...($nullable ? ['nullable'] : []), ...($min >= 1 && ! $nullable ? ['filled'] : []), 'string', "min:$min", "max:$max"];
    }

    /**
     * A NEW password: 8-128 characters and at most 72 UTF-8 bytes (bcrypt silently ignores the rest).
     * Login keeps accepting up to 128 characters so existing accounts still work.
     *
     * @return list<string>
     */
    public static function newPassword(): array
    {
        return [...self::text(8, 128), 'max_bytes:72'];
    }

    public const SLUG_REGEX = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';
}
