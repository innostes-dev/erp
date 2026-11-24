<?php

namespace App\Http\Requests;

class ResetPasswordRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'token' => ['bail', 'present', 'string', 'max:2048'],
            'new_password' => Rules::newPassword(),
        ];
    }
}
