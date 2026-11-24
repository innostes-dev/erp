<?php

namespace App\Http\Requests;

use App\Kernel\Exceptions\RequestValidationException;
use App\Kernel\Support\PydanticErrors;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/** Base request: always authorised (auth is handled by middleware); failures are rendered FastAPI-style (422). */
abstract class KernelFormRequest extends FormRequest
{
    /** @return array<string, mixed> */
    abstract public function rules(): array;

    public function authorize(): bool
    {
        return true;
    }

    /** Where the validated data lives in the request, for the error `loc`. */
    protected function location(): string
    {
        return 'body';
    }

    /**
     * JSON bodies only: form-encoded/query fallbacks would let clients smuggle fields past strict typing.
     *
     * @return array<string, mixed>
     */
    public function validationData(): array
    {
        if ($this->location() === 'query') {
            return $this->query();
        }
        $json = $this->json();

        return $json->all();
    }

    protected function failedValidation(Validator $validator): void
    {
        if (! $validator instanceof \Illuminate\Validation\Validator) {
            throw RequestValidationException::single([$this->location()], 'Invalid request', 'value_error');
        }
        throw new RequestValidationException(PydanticErrors::fromValidator($validator, $this->location()));
    }
}
