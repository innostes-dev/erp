<?php

namespace App\Http\Requests;

class ChangePasswordRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'current_password' => ['bail', 'present', 'string', 'max:128'],
            'new_password' => Rules::newPassword(),
        ];
    }
}
