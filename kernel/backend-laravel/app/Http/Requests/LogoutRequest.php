<?php

namespace App\Http\Requests;

class LogoutRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'refresh_token' => ['bail', 'sometimes', 'nullable', 'string', 'max:512'],
            'logout_all' => ['bail', 'sometimes', 'boolean'],
        ];
    }
}
