<?php

namespace App\Http\Requests;

class ListTenantsRequest extends KernelFormRequest
{
    protected function location(): string
    {
        return 'query';
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'offset' => ['bail', 'sometimes', 'integer', 'min:0'],
            'limit' => ['bail', 'sometimes', 'integer', 'min:1', 'max:200'],
            'include_deleted' => ['bail', 'sometimes', 'in:true,false,1,0'],
        ];
    }

    public function offsetValue(): int
    {
        return (int) ($this->query('offset', 0));
    }

    public function limitValue(): int
    {
        return (int) ($this->query('limit', 50));
    }

    public function includeDeleted(): bool
    {
        return in_array($this->query('include_deleted'), ['true', '1'], true);
    }
}
