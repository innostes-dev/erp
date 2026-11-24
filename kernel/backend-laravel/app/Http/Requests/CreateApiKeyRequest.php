<?php

namespace App\Http\Requests;

class CreateApiKeyRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => Rules::text(1, 128),
            'expires_in_days' => ['bail', 'sometimes', 'nullable', 'integer', 'min:1', 'max:365'],
            'scopes' => ['bail', 'sometimes', 'array', 'max:50'],
            'scopes.*' => ['bail', 'required', 'string', 'max:128'],
        ];
    }
}
