import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupDto {
  // Tenant Info
  @ApiProperty({ example: 'system-tenant' })
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ example: 'My Enterprise' })
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @ApiProperty({ example: 'my-enterprise' })
  @IsString()
  @IsNotEmpty()
  tenantSlug!: string;

  // Branch Info (Optional/Skippable)
  @ApiProperty({ example: 'Main Headquarters' })
  @IsString()
  @IsOptional()
  branchName?: string;

  // Super Admin User Info
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(12)
  adminPassword!: string;

  @ApiProperty({ example: 'Super' })
  @IsString()
  @IsNotEmpty()
  adminFirstName!: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  adminLastName!: string;
}
