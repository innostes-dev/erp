<?php

namespace App\Http\Requests;

class UpdateTenantRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => Rules::optionalText(1, 255, false),
            'slug' => [...Rules::optionalText(1, 63, false), 'regex:'.Rules::SLUG_REGEX],
            'country' => Rules::optionalText(2, 2),
            'timezone' => Rules::optionalText(0, 64),
            'language' => Rules::optionalText(0, 16),
            'date_format' => Rules::optionalText(0, 20),
        ];
    }
}
