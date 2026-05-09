import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
