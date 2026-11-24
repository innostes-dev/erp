import { IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MSG = "String should match pattern '^[a-z0-9]+(?:-[a-z0-9]+)*$'";

export class TenantCreate {
  @IsString() @MinLength(1) @MaxLength(255) name!: string;
  @IsString() @MinLength(1) @MaxLength(63) @Matches(SLUG_PATTERN, { message: SLUG_MSG }) slug!: string;
  @IsOptional() @IsString() @Length(2, 2) country?: string | null;
  @IsOptional() @IsString() @MaxLength(64) timezone?: string | null;
  @IsOptional() @IsString() @MaxLength(16) language?: string | null;
  @IsOptional() @IsString() @MaxLength(20) date_format?: string | null;
}

export class TenantUpdate {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(255) name?: string | null;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(63) @Matches(SLUG_PATTERN, { message: SLUG_MSG }) slug?:
    | string
    | null;
  @IsOptional() @IsString() @Length(2, 2) country?: string | null;
  @IsOptional() @IsString() @MaxLength(64) timezone?: string | null;
  @IsOptional() @IsString() @MaxLength(16) language?: string | null;
  @IsOptional() @IsString() @MaxLength(20) date_format?: string | null;
}
