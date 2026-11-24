import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EmailField, NewPasswordField } from '../common/dto-decorators';
import { DEVICE_TYPES, DeviceType } from '../users/user.types';

export class LoginRequest {
  @EmailField() email!: string;
  @IsString() @MinLength(1) @MaxLength(128) password!: string;
  @IsOptional() @IsString() @Length(16, 128) device_fingerprint?: string;
  @IsOptional() @IsString() @MaxLength(255) device_name?: string | null;
  @IsOptional() @IsIn(DEVICE_TYPES) device_type?: DeviceType;
}

export class RefreshTokenRequest {
  @IsString() @MaxLength(512) refresh_token!: string;
}

export class ForgotPasswordRequest {
  @EmailField() email!: string;
}

export class ResetPasswordRequest {
  @IsString() @MaxLength(4096) token!: string;
  @NewPasswordField() new_password!: string;
}

export class ChangePasswordRequest {
  @IsString() @MaxLength(128) current_password!: string;
  @NewPasswordField() new_password!: string;
}

export class LogoutRequest {
  @IsOptional() @IsString() @MaxLength(512) refresh_token?: string | null;
  @IsOptional() @IsBoolean() logout_all?: boolean;
}

export class CreateApiKeyRequest {
  @IsString() @MinLength(1) @MaxLength(128) name!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) expires_in_days?: number | null;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  scopes?: string[];
}
