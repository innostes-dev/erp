<?php

namespace App\Http\Requests;

class CreateUserRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'first_name' => Rules::text(1, 100),
            'last_name' => Rules::optionalText(0, 100),
            'email' => Rules::EMAIL,
            'password' => Rules::newPassword(),
            'mobile' => Rules::optionalText(0, 32),
            // Accepted for schema compatibility but never honoured: privilege escalation via this endpoint is not possible.
            'is_super_admin' => ['bail', 'sometimes', 'boolean'],
        ];
    }
}
