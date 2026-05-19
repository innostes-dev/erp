import { IsNotEmpty, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Short lived reset token' })
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @ApiProperty({ example: 'NewSecurePass123!', description: 'New password' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password is too weak. Must contain uppercase, lowercase, and a digit or special character.',
  })
  newPassword!: string;
}
