<?php

namespace App\Kernel\Exceptions;

use RuntimeException;

/** 422 with FastAPI's {"detail": [{"loc": [...], "msg": "...", "type": "..."}]} shape. */
class RequestValidationException extends RuntimeException
{
    /**
     * @param  list<array{loc: list<int|string>, msg: string, type: string}>  $errors
     */
    public function __construct(public readonly array $errors)
    {
        parent::__construct('Request validation failed');
    }

    /**
     * @param  list<int|string>  $loc
     */
    public static function single(array $loc, string $msg, string $type): self
    {
        return new self([['loc' => $loc, 'msg' => $msg, 'type' => $type]]);
    }
}
