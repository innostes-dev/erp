<?php

namespace App\Http\Requests;

class CreateTenantRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => Rules::text(1, 255),
            'slug' => [...Rules::text(1, 63), 'regex:'.Rules::SLUG_REGEX],
            'country' => Rules::optionalText(2, 2),
            'timezone' => Rules::optionalText(0, 64),
            'language' => Rules::optionalText(0, 16),
            'date_format' => Rules::optionalText(0, 20),
        ];
    }
}
