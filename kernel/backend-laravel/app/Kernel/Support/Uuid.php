<?php

namespace App\Kernel\Support;

use App\Kernel\Exceptions\RequestValidationException;

final class Uuid
{
    public static function isValid(mixed $value): bool
    {
        return is_string($value) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value) === 1;
    }

    /**
     * Validate a path/header UUID like FastAPI does (422, type uuid_parsing).
     *
     * @param  'path'|'header'|'query'  $where
     */
    public static function require(string $value, string $where, string $name): string
    {
        if (! self::isValid($value)) {
            throw RequestValidationException::single(
                [$where, $name],
                'Input should be a valid UUID, invalid character: expected an optional prefix of `urn:uuid:` followed by [0-9a-fA-F-], found `'.mb_substr($value, 0, 1).'` at 0',
                'uuid_parsing'
            );
        }

        return strtolower($value);
    }
}
