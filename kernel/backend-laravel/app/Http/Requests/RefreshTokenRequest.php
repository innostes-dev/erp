<?php

namespace App\Http\Requests;

class RefreshTokenRequest extends KernelFormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        // Optional: the HttpOnly refresh_token cookie is used when the body omits it.
        return ['refresh_token' => ['bail', 'sometimes', 'nullable', 'string', 'max:512']];
    }
}
