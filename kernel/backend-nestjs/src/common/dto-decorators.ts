import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength, ValidationOptions, registerDecorator } from 'class-validator';

/** Email address; the domain part is lower-cased (mirrors pydantic's EmailStr normalisation). */
export function EmailField(): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) => {
      if (typeof value !== 'string') return value;
      const at = value.lastIndexOf('@');
      return at > 0 ? `${value.slice(0, at)}@${value.slice(at + 1).toLowerCase()}` : value;
    }),
    IsEmail({}, { message: 'value is not a valid email address' }),
    MaxLength(254),
  );
}

/** bcrypt only uses the first 72 bytes of a password; anything longer would be silently truncated, so reject it. */
export const BCRYPT_MAX_BYTES = 72;

export function MaxBytes(max: number, options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'maxBytes',
      target: target.constructor,
      propertyName: propertyName as string,
      options: { message: `String should have at most ${max} bytes (UTF-8)`, ...options },
      constraints: [max],
      validator: {
        validate: (value: unknown): boolean => typeof value !== 'string' || Buffer.byteLength(value, 'utf8') <= max,
      },
    });
  };
}

/** New password: 8-128 characters and at most 72 UTF-8 bytes (bcrypt limit). */
export function NewPasswordField(): PropertyDecorator {
  return applyDecorators(IsString(), MinLength(8), MaxLength(128), MaxBytes(BCRYPT_MAX_BYTES));
}
