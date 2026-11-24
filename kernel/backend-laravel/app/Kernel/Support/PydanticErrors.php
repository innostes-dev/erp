<?php

namespace App\Kernel\Support;

use Illuminate\Support\Arr;
use Illuminate\Validation\Validator;

/** Translates Laravel validation failures into FastAPI/pydantic v2 error items {loc, msg, type}. */
final class PydanticErrors
{
    /**
     * @return list<array{loc: list<int|string>, msg: string, type: string}>
     */
    public static function fromValidator(Validator $validator, string $where = 'body'): array
    {
        $data = $validator->getData();
        $out = [];
        foreach ($validator->failed() as $field => $rules) {
            $rule = (string) array_key_first($rules);
            $params = $rules[$rule] ?? [];
            $loc = [$where];
            foreach (explode('.', $field) as $segment) {
                $loc[] = ctype_digit($segment) ? (int) $segment : $segment;
            }
            $value = data_get($data, $field);
            $declared = array_map(fn ($r) => is_string($r) ? strtolower(explode(':', $r)[0]) : '', (array) ($validator->getRules()[$field] ?? []));
            $numeric = in_array('integer', $declared, true) || in_array('numeric', $declared, true);
            if (in_array(strtolower($rule), ['required', 'present', 'filled'], true) && Arr::has($data, $field)) {
                // Key exists but is null/empty: pydantic reports a type/length error, not "missing".
                [$type, $msg] = $value === null
                    ? ['string_type', 'Input should be a valid string']
                    : ['string_too_short', 'String should have at least 1 character'];
            } else {
                [$type, $msg] = self::map($rule, $params, $value, $numeric);
            }
            $out[] = ['loc' => $loc, 'msg' => $msg, 'type' => $type];
        }

        return $out;
    }

    /**
     * @param  list<mixed>  $params
     * @return array{0: string, 1: string}
     */
    private static function map(string $rule, array $params, mixed $value, bool $numeric): array
    {
        return match (strtolower($rule)) {
            'present', 'required' => ['missing', 'Field required'],
            'string' => ['string_type', 'Input should be a valid string'],
            'min' => ! $numeric
                ? ['string_too_short', 'String should have at least '.$params[0].' character'.($params[0] == 1 ? '' : 's')]
                : ['greater_than_equal', 'Input should be greater than or equal to '.$params[0]],
            'max' => ! $numeric
                ? ['string_too_long', 'String should have at most '.$params[0].' character'.($params[0] == 1 ? '' : 's')]
                : ['less_than_equal', 'Input should be less than or equal to '.$params[0]],
            'maxbytes' => ['string_too_long', 'String should have at most '.$params[0].' bytes (UTF-8)'],
            'size' => ['string_too_short', 'String should have exactly '.$params[0].' characters'],
            'email' => ['value_error', 'value is not a valid email address: The email address is not valid.'],
            'regex' => ['string_pattern_mismatch', "String should match pattern '".($params[0] ?? '')."'"],
            'boolean' => ['bool_parsing', 'Input should be a valid boolean, unable to interpret input'],
            'integer' => ['int_parsing', 'Input should be a valid integer, unable to parse string as an integer'],
            'array' => ['list_type', 'Input should be a valid list'],
            'in' => ['enum', 'Input should be '.implode(', ', array_map(fn ($p) => "'".$p."'", $params))],
            'uuid' => ['uuid_parsing', 'Input should be a valid UUID'],
            default => ['value_error', 'Value error, invalid value'],
        };
    }
}
