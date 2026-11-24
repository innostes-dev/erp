import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EmailField, NewPasswordField } from '../common/dto-decorators';

export class UserCreate {
  @IsString() @MinLength(1) @MaxLength(100) first_name!: string;
  @IsOptional() @IsString() @MaxLength(100) last_name?: string | null;
  @EmailField() email!: string;
  @NewPasswordField() password!: string;
  @IsOptional() @IsString() @MaxLength(32) mobile?: string | null;
  /** Accepted for schema compatibility; privileged accounts are only created by first-run setup. */
  @IsOptional() @IsBoolean() is_super_admin?: boolean;
}
