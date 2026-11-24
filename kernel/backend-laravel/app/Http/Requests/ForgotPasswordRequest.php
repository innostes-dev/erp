<?php

namespace App\Http\Requests;

class ForgotPasswordRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['email' => Rules::EMAIL];
    }
}
