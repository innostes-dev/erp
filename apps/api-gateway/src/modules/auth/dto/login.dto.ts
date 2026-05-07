import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { LoginCredentials } from '@mono/shared/types';

export class LoginDto implements LoginCredentials {
  @ApiProperty({ example: 'admin@mono.dev', description: 'User email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin123', description: 'User password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
