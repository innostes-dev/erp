<?php

namespace App\Http\Requests;

class LoginRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => Rules::EMAIL,
            'password' => Rules::text(1, 128),
            'device_fingerprint' => ['bail', 'sometimes', 'string', 'max:128'],
            'device_name' => ['bail', 'sometimes', 'nullable', 'string', 'max:255'],
            'device_type' => ['bail', 'sometimes', 'string', 'in:desktop,mobile,tablet,scanner,kiosk'],
        ];
    }
}
