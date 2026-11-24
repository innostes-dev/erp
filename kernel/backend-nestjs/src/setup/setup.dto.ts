import { Type } from 'class-transformer';
import { IsDefined, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { EmailField, NewPasswordField } from '../common/dto-decorators';
import { TenantCreate } from '../tenancy/tenancy.dto';

export class AdminUserCreate {
  @IsString() @MinLength(1) @MaxLength(100) first_name!: string;
  @IsOptional() @IsString() @MaxLength(100) last_name?: string | null;
  @EmailField() email!: string;
  @NewPasswordField() password!: string;
  @IsOptional() @IsString() @MaxLength(32) mobile?: string | null;
}

export class SetupBrandingCreate {
  @IsOptional() @IsString() @MaxLength(32) theme?: string;
  @IsOptional() @IsString() @MaxLength(32) primary_color?: string;
  @IsOptional() @IsString() @MaxLength(2048) logo_url?: string | null;
}

export class SetupRequest {
  @IsDefined() @ValidateNested() @Type(() => TenantCreate) organization!: TenantCreate;
  @IsDefined() @ValidateNested() @Type(() => AdminUserCreate) admin!: AdminUserCreate;
  @IsOptional() @ValidateNested() @Type(() => SetupBrandingCreate) branding?: SetupBrandingCreate | null;
}
