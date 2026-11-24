<?php

namespace App\Http\Requests;

class SetupRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'organization' => ['bail', 'required', 'array'],
            'organization.name' => Rules::text(1, 255),
            'organization.slug' => [...Rules::text(1, 63), 'regex:'.Rules::SLUG_REGEX],
            'organization.country' => Rules::optionalText(2, 2),
            'organization.timezone' => Rules::optionalText(0, 64),
            'organization.language' => Rules::optionalText(0, 16),
            'organization.date_format' => Rules::optionalText(0, 20),
            // Unlike the reference, the admin block is mandatory: the reference silently falls back to a
            // well-known default admin password when it is omitted.
            'admin' => ['bail', 'required', 'array'],
            'admin.first_name' => Rules::text(1, 100),
            'admin.last_name' => Rules::optionalText(0, 100),
            'admin.email' => Rules::EMAIL,
            'admin.password' => Rules::newPassword(),
            'admin.mobile' => Rules::optionalText(0, 32),
            'branding' => ['bail', 'sometimes', 'nullable', 'array'],
            'branding.theme' => ['bail', 'sometimes', 'string', 'max:32'],
            'branding.primary_color' => ['bail', 'sometimes', 'string', 'max:16'],
            'branding.logo_url' => ['bail', 'sometimes', 'nullable', 'string', 'max:512'],
        ];
    }
}
