import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Unique email address' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ 
    example: 'SecurePass123!', 
    description: 'Password (min 8 chars, must contain upper, lower, and digit/special)' 
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password is too weak. Must contain uppercase, lowercase, and a digit or special character.',
  })
  password!: string;

  @ApiProperty({ example: 'acme-corp', description: 'Tenant ID' })
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ example: 'main', description: 'Branch ID' })
  @IsString()
  @IsNotEmpty()
  branchId!: string;
}
